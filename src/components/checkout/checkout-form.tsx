"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useCart } from "../cart/cart-provider";
import { formatUyu } from "@/lib/money";
import { URUGUAY_DEPARTMENTS } from "@/domain/shipping";
import type { CartQuote } from "@/domain/cart";
import { MIN_AGE_YEARS } from "@/config/business";

type ShippingOption = { code: string; label: string; priceUyu: number; isPickup: boolean };
type OptionsResponse = { paymentsConfigured: boolean; options: ShippingOption[] };
type Issue = { code: string; message: string; field?: string; slug?: string };

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  ageConfirmed: boolean;
  shippingCode: string;
  department: string;
  city: string;
  street: string;
  streetNumber: string;
  apartment: string;
  postalCode: string;
  notes: string;
};

const EMPTY: FormState = {
  fullName: "",
  email: "",
  phone: "",
  ageConfirmed: false,
  shippingCode: "",
  department: "",
  city: "",
  street: "",
  streetNumber: "",
  apartment: "",
  postalCode: "",
  notes: "",
};

/** Mapea el campo que reporta el servidor (p. ej. "customer.email") al nombre del formulario. */
function fieldKey(field: string | undefined): keyof FormState | "address" | "lines" | null {
  if (!field) return null;
  const map: Record<string, keyof FormState | "address" | "lines"> = {
    "customer.fullName": "fullName",
    "customer.email": "email",
    "customer.phone": "phone",
    "customer.ageConfirmed": "ageConfirmed",
    shippingCode: "shippingCode",
    "address.department": "department",
    "address.city": "city",
    "address.street": "street",
    "address.streetNumber": "streetNumber",
    "address.apartment": "apartment",
    "address.postalCode": "postalCode",
    "address.notes": "notes",
    address: "address",
    lines: "lines",
  };
  return map[field] ?? null;
}

export function CheckoutForm() {
  const { entries, hydrated, clear } = useCart();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const uid = useId();

  const isPickup = useMemo(
    () => options?.options.find((o) => o.code === form.shippingCode)?.isPickup ?? false,
    [options, form.shippingCode],
  );
  const needsAddress = form.shippingCode !== "" && !isPickup;

  // Cotización del carrito para mostrar el resumen (el servidor la recalcula al confirmar).
  useEffect(() => {
    if (!hydrated || entries.length === 0) return;
    const controller = new AbortController();
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: entries }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: CartQuote | null) => data && setQuote(data))
      .catch(() => undefined);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, JSON.stringify(entries)]);

  // Opciones de envío según departamento.
  useEffect(() => {
    const controller = new AbortController();
    const params = form.department ? `?department=${encodeURIComponent(form.department)}` : "";
    setOptionsError(false);
    fetch(`/api/checkout/options${params}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("options");
        return r.json() as Promise<OptionsResponse>;
      })
      .then((data) => {
        setOptions(data);
        setForm((f) =>
          data.options.some((o) => o.code === f.shippingCode) ? f : { ...f, shippingCode: "" },
        );
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") setOptionsError(true);
      });
    return () => controller.abort();
  }, [form.department]);

  const selectedOption = options?.options.find((o) => o.code === form.shippingCode);
  const shippingUyu = selectedOption?.priceUyu ?? 0;
  const subtotal = quote?.subtotalUyu ?? 0;
  const hasBlocking = quote?.hasBlockingIssues ?? false;
  const canSubmit =
    hydrated &&
    entries.length > 0 &&
    !hasBlocking &&
    options?.paymentsConfigured === true &&
    (options?.options.length ?? 0) > 0 &&
    !submitting;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function errorFor(key: keyof FormState | "address" | "lines"): string | undefined {
    return issues.find((i) => fieldKey(i.field) === key)?.message;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setIssues([]);

    const body = {
      lines: entries,
      customer: {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        ageConfirmed: form.ageConfirmed,
      },
      shippingCode: form.shippingCode,
      ...(needsAddress
        ? {
            address: {
              department: form.department,
              city: form.city,
              street: form.street,
              streetNumber: form.streetNumber,
              apartment: form.apartment,
              postalCode: form.postalCode,
              notes: form.notes,
            },
          }
        : {}),
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        issues?: Issue[];
        checkoutUrl?: string;
      };

      if (res.status === 201 && data.checkoutUrl) {
        // El carrito se conserva hasta confirmar el pago en la página del pedido.
        window.location.assign(data.checkoutUrl);
        return;
      }

      setIssues(data.issues?.length ? data.issues : [{ code: "error", message: data.error ?? "No pudimos crear el pedido." }]);
      if (res.status === 409) {
        setQuote(null);
      }
      setSubmitting(false);
    } catch {
      setIssues([{ code: "network", message: "Sin conexión. Revisá tu internet e intentá de nuevo." }]);
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return <p className="text-muted" aria-live="polite">Preparando tu pedido…</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="border-t border-ink pt-10">
        <p className="font-display text-4xl font-black">No hay productos para pagar.</p>
        <Link href="/cervezas" className="btn btn-primary mt-8">Explorar cervezas</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-12 lg:grid-cols-12">
      <div className="space-y-12 lg:col-span-7">
        {issues.length > 0 && (
          <div role="alert" className="notice notice-error">
            <p className="font-semibold text-burgundy">Revisá estos puntos:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {issues.map((i, idx) => (
                <li key={`${i.code}-${idx}`}>{i.message}</li>
              ))}
            </ul>
          </div>
        )}

        {options && !options.paymentsConfigured && (
          <Notice tone="warn" title="Pagos no configurados">
            El pago con Mercado Pago todavía no está habilitado en este entorno. No se pueden tomar pedidos.
          </Notice>
        )}

        {(optionsError || (options && options.options.length === 0)) && (
          <Notice tone="warn" title="Envíos no configurados">
            No hay opciones de entrega o retiro habilitadas todavía. El operador debe configurarlas antes de aceptar pedidos.
          </Notice>
        )}

        <fieldset className="space-y-6">
          <legend className="font-display text-3xl font-black">1. Tus datos</legend>
          <Field id={`${uid}-name`} label="Nombre completo" error={errorFor("fullName")}>
            <input
              id={`${uid}-name`}
              className="field"
              name="name"
              autoComplete="name"
              required
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              aria-invalid={Boolean(errorFor("fullName"))}
            />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id={`${uid}-email`} label="Email" error={errorFor("email")}>
              <input
                id={`${uid}-email`}
                type="email"
                className="field"
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                aria-invalid={Boolean(errorFor("email"))}
              />
            </Field>
            <Field id={`${uid}-phone`} label="Teléfono" hint="Para coordinar la entrega" error={errorFor("phone")}>
              <input
                id={`${uid}-phone`}
                type="tel"
                className="field"
                name="phone"
                autoComplete="tel"
                inputMode="tel"
                placeholder="099 123 456"
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                aria-invalid={Boolean(errorFor("phone"))}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-3xl font-black">2. Entrega</legend>
          <div className="grid gap-3" role="radiogroup" aria-describedby={errorFor("shippingCode") ? `${uid}-ship-err` : undefined}>
            {options?.options.map((o) => (
              <label
                key={o.code}
                className={`flex cursor-pointer items-center justify-between gap-4 border-[1.5px] p-4 transition-colors ${
                  form.shippingCode === o.code ? "border-ink bg-parchment" : "border-ink/35 hover:border-ink"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    value={o.code}
                    checked={form.shippingCode === o.code}
                    onChange={() => update("shippingCode", o.code)}
                    className="h-4 w-4 accent-ink"
                  />
                  <span className="font-semibold">{o.label}</span>
                </span>
                <span className="tabular-nums">{o.priceUyu > 0 ? formatUyu(o.priceUyu) : "Sin costo"}</span>
              </label>
            ))}
          </div>
          {errorFor("shippingCode") && (
            <p id={`${uid}-ship-err`} className="text-sm font-semibold text-burgundy">{errorFor("shippingCode")}</p>
          )}
        </fieldset>

        {needsAddress && (
          <fieldset className="space-y-6">
            <legend className="font-display text-3xl font-black">3. Dirección de entrega</legend>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field id={`${uid}-dep`} label="Departamento" error={errorFor("department")}>
                <select
                  id={`${uid}-dep`}
                  className="field"
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  required
                  aria-invalid={Boolean(errorFor("department"))}
                >
                  <option value="">Elegí un departamento</option>
                  {URUGUAY_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field id={`${uid}-city`} label="Localidad" error={errorFor("city")}>
                <input id={`${uid}-city`} className="field" autoComplete="address-level2" required value={form.city} onChange={(e) => update("city", e.target.value)} aria-invalid={Boolean(errorFor("city"))} />
              </Field>
              <Field id={`${uid}-street`} label="Calle" error={errorFor("street")}>
                <input id={`${uid}-street`} className="field" autoComplete="address-line1" required value={form.street} onChange={(e) => update("street", e.target.value)} aria-invalid={Boolean(errorFor("street"))} />
              </Field>
              <Field id={`${uid}-num`} label="Número" error={errorFor("streetNumber")}>
                <input id={`${uid}-num`} className="field" inputMode="numeric" required value={form.streetNumber} onChange={(e) => update("streetNumber", e.target.value)} aria-invalid={Boolean(errorFor("streetNumber"))} />
              </Field>
              <Field id={`${uid}-apto`} label="Apartamento (opcional)" error={errorFor("apartment")}>
                <input id={`${uid}-apto`} className="field" value={form.apartment} onChange={(e) => update("apartment", e.target.value)} />
              </Field>
              <Field id={`${uid}-cp`} label="Código postal (opcional)" error={errorFor("postalCode")}>
                <input id={`${uid}-cp`} className="field" inputMode="numeric" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
              </Field>
            </div>
            <Field id={`${uid}-notes`} label="Indicaciones para el repartidor (opcional)" error={errorFor("notes")}>
              <textarea id={`${uid}-notes`} className="field min-h-24" maxLength={300} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </Field>
          </fieldset>
        )}

        <fieldset className="space-y-4">
          <legend className="font-display text-3xl font-black">{needsAddress ? "4" : "3"}. Confirmación</legend>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 accent-ink"
              checked={form.ageConfirmed}
              onChange={(e) => update("ageConfirmed", e.target.checked)}
              aria-invalid={Boolean(errorFor("ageConfirmed"))}
            />
            <span>
              Confirmo que soy mayor de {MIN_AGE_YEARS} años y que compro para consumo personal.
            </span>
          </label>
          {errorFor("ageConfirmed") && (
            <p className="text-sm font-semibold text-burgundy">{errorFor("ageConfirmed")}</p>
          )}
          <p className="text-sm text-muted">
            Serás redirigido a Mercado Pago para pagar. Tu pedido queda confirmado solo cuando el pago es aprobado.
          </p>
        </fieldset>
      </div>

      <aside aria-labelledby="resumen-pedido" className="lg:col-span-5">
        <div className="paper bg-parchment p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 id="resumen-pedido" className="font-display text-3xl font-black">Tu pedido</h2>
          <ul className="mt-6 divide-y divide-ink/20 text-[0.95rem]">
            {quote?.lines.map((l) => (
              <li key={l.slug} className="flex justify-between gap-4 py-3">
                <span>{l.quantity} × {l.name}</span>
                <span className="tabular-nums">{formatUyu(l.lineTotalUyu)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-ink pt-4">
            <Row label="Subtotal" value={quote ? formatUyu(subtotal) : "—"} />
            <Row label="Envío" value={selectedOption ? (shippingUyu > 0 ? formatUyu(shippingUyu) : "Sin costo") : "Elegí una opción"} />
            <Row label="Total a pagar" value={quote ? formatUyu(subtotal + shippingUyu) : "—"} strong />
          </dl>
          <p className="mt-3 text-xs text-muted">
            El total final lo confirma el servidor al crear el pedido. Moneda: pesos uruguayos (UYU).
          </p>

          {hasBlocking && (
            <p className="mt-6 text-sm font-semibold text-burgundy">
              Hay productos del carrito que ya no se pueden comprar. <Link href="/carrito" className="underline">Revisá el carrito</Link>.
            </p>
          )}

          <button type="submit" disabled={!canSubmit} className="btn btn-primary mt-8 w-full">
            {submitting ? "Creando tu pedido…" : "Continuar al pago"}
          </button>
          <p className="mt-4 text-xs text-muted">
            Consumí con moderación. Venta solo a mayores de {MIN_AGE_YEARS} años.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-sm font-semibold text-burgundy">{error}</p>}
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "pt-2 font-display text-2xl font-black" : ""}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function Notice({ title, children, tone }: { title: string; children: ReactNode; tone: "warn" }) {
  return (
    <div role="status" className={`notice ${tone === "warn" ? "notice-warn" : ""}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm">{children}</p>
    </div>
  );
}
