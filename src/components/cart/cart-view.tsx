"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./cart-provider";
import { formatUyu } from "@/lib/money";
import { MAX_UNITS_PER_LINE, type CartLineQuote, type CartQuote } from "@/domain/cart";

type QuoteResponse = CartQuote & { unknownSlugs: string[] };

const BLOCK_TEXT: Record<NonNullable<CartLineQuote["block"]>, string> = {
  not_for_sale: "Esta cerveza no está a la venta.",
  no_price: "Precio por confirmar.",
  sold_out: "Agotada.",
  insufficient_stock: "No hay unidades suficientes. Reducí la cantidad.",
};

export function CartView() {
  const { entries, hydrated, setQuantity, remove, clear } = useCart();
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const key = JSON.stringify(entries);

  useEffect(() => {
    if (!hydrated) return;
    if (entries.length === 0) {
      setQuote(null);
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: entries }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("quote");
        setQuote((await res.json()) as QuoteResponse);
        setStatus("idle");
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
    // `key` resume los cambios de `entries` sin depender de la referencia del arreglo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hydrated]);

  // Quita del carrito los productos que ya no existen en el catálogo.
  useEffect(() => {
    if (quote?.unknownSlugs.length) {
      quote.unknownSlugs.forEach((slug) => remove(slug));
    }
  }, [quote, remove]);

  if (!hydrated) {
    return <p className="text-ink/70" aria-live="polite">Cargando tu carrito…</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="border-t border-ink pt-10">
        <p className="font-display text-4xl font-black">Tu carrito está vacío.</p>
        <p className="mt-4 max-w-md text-ink/80">Cuando elijas una cerveza, aparece acá con su precio final.</p>
        <Link href="/cervezas" className="btn btn-primary mt-8">
          Explorar cervezas
        </Link>
      </div>
    );
  }

  const lines = quote?.lines ?? [];
  const hasBlocking = quote?.hasBlockingIssues ?? false;

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <section aria-labelledby="lineas" className="lg:col-span-8">
        <h2 id="lineas" className="sr-only">Productos</h2>

        {status === "error" && (
          <p role="alert" className="mb-6 border-l-2 border-burgundy pl-4">
            No pudimos verificar precios y disponibilidad. Revisá tu conexión e intentá de nuevo.
          </p>
        )}

        <ul className="divide-y divide-ink/25 border-y border-ink/25">
          {entries.map((entry) => {
            const line = lines.find((l) => l.slug === entry.slug);
            return (
              <li key={entry.slug} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-2xl font-bold">
                    {line?.name ?? entry.slug}
                  </p>
                  {line && (
                    <p className="mt-1 text-sm text-ink/75">
                      {formatUyu(line.unitPriceUyu)} c/u
                    </p>
                  )}
                  {line && !line.purchasable && line.block && (
                    <p role="status" className="mt-2 text-sm font-semibold text-burgundy">
                      {BLOCK_TEXT[line.block]}
                    </p>
                  )}
                  {line?.limited && line.purchasable && (
                    <p className="mt-2 text-sm text-brown font-semibold">Últimas unidades disponibles.</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-6 sm:justify-end">
                  <div className="inline-flex items-center border-[1.5px] border-ink" role="group" aria-label={`Cantidad de ${line?.name ?? entry.slug}`}>
                    <button
                      type="button"
                      className="h-11 w-11 text-xl hover:bg-ink hover:text-cream disabled:opacity-40"
                      onClick={() => setQuantity(entry.slug, entry.quantity - 1)}
                      disabled={entry.quantity <= 1}
                      aria-label="Quitar una unidad"
                    >
                      −
                    </button>
                    <span className="min-w-10 text-center font-semibold tabular-nums" aria-live="polite">
                      {entry.quantity}
                    </span>
                    <button
                      type="button"
                      className="h-11 w-11 text-xl hover:bg-ink hover:text-cream disabled:opacity-40"
                      onClick={() => setQuantity(entry.slug, entry.quantity + 1)}
                      disabled={entry.quantity >= MAX_UNITS_PER_LINE}
                      aria-label="Agregar una unidad"
                    >
                      +
                    </button>
                  </div>
                  <p className="w-28 text-right font-semibold tabular-nums">
                    {line ? formatUyu(line.lineTotalUyu) : "—"}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(entry.slug)}
                    className="label-caps text-[0.72rem] underline underline-offset-4 hover:text-burgundy"
                  >
                    Quitar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <button type="button" onClick={clear} className="label-caps mt-6 text-[0.72rem] underline underline-offset-4 hover:text-burgundy">
          Vaciar carrito
        </button>
      </section>

      <aside aria-labelledby="resumen" className="lg:col-span-4">
        <div className="paper bg-parchment p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 id="resumen" className="font-display text-3xl font-black">Resumen</h2>
          <dl className="mt-6 space-y-3 text-lg">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-semibold tabular-nums" aria-live="polite">
                {quote ? formatUyu(quote.subtotalUyu) : "—"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink/75">
            El envío se calcula en el checkout según tu zona y se suma al total.
          </p>

          {hasBlocking && (
            <p className="mt-6 text-sm font-semibold text-burgundy">
              Revisá los productos marcados para poder continuar.
            </p>
          )}

          {hasBlocking ? (
            <span className="btn btn-primary mt-6 w-full opacity-45" aria-disabled="true">
              Ir al checkout
            </span>
          ) : (
            <Link href="/checkout" className="btn btn-primary mt-6 w-full">
              Ir al checkout
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
