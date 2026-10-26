import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByToken } from "@/data/queries";
import { formatUyu } from "@/lib/money";
import { ClearCartOnPaid, PendingRefresh } from "@/components/checkout/order-side-effects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu pedido",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ token: string }> };

const COPY: Record<string, { title: string; body: string; tone: "ok" | "wait" | "bad" }> = {
  PENDING_PAYMENT: {
    title: "Esperando la confirmación del pago",
    body: "Si ya pagaste, la confirmación puede demorar unos minutos. Esta página se actualiza sola. Tus unidades quedan reservadas por un tiempo limitado.",
    tone: "wait",
  },
  PAID: {
    title: "Pago confirmado. ¡Gracias por tu compra!",
    body: "Recibimos tu pago. Te contactaremos para coordinar la entrega o el retiro.",
    tone: "ok",
  },
  PAYMENT_REJECTED: {
    title: "El pago no fue aprobado",
    body: "Tu pedido no se confirmó y las unidades ya no están reservadas. Podés volver al carrito e intentar de nuevo.",
    tone: "bad",
  },
  CANCELLED: {
    title: "Pedido cancelado",
    body: "Este pedido no se completó y las unidades ya no están reservadas. Podés volver al carrito.",
    tone: "bad",
  },
  EXPIRED: {
    title: "La reserva venció",
    body: "No recibimos el pago a tiempo y las unidades volvieron al stock. Si ya pagaste, escribinos y lo revisamos.",
    tone: "bad",
  },
  REFUNDED: {
    title: "Pago reembolsado",
    body: "El pago de este pedido fue reembolsado.",
    tone: "bad",
  },
  NEEDS_REVIEW: {
    title: "Estamos revisando tu pedido",
    body: "Hubo un inconveniente con el pago o el stock. Te contactaremos a la dirección de correo que indicaste.",
    tone: "wait",
  },
};

export default async function OrderPage({ params }: Params) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  const copy = COPY[order.status] ?? COPY.NEEDS_REVIEW!;
  const pending = order.status === "PENDING_PAYMENT";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-14 sm:px-6">
      {order.status === "PAID" && <ClearCartOnPaid />}
      {pending && <PendingRefresh />}

      <p className="sr-only" aria-live="polite">Estado del pedido: {copy.title}</p>
      <h1 className="font-display mt-4 text-[clamp(2.75rem,7vw,4.5rem)] font-black leading-[0.95]">
        {copy.title}
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{copy.body}</p>

      <section aria-labelledby="detalle" className="mt-12 border-t border-ink pt-8">
        <h2 id="detalle" className="font-display text-3xl font-black">Detalle</h2>
        <ul className="mt-6 divide-y divide-ink/20">
          {order.items.map((item) => (
            <li key={`${item.productName}-${item.quantity}`} className="flex justify-between gap-4 py-4">
              <div>
                <p className="font-semibold">{item.productName}</p>
                <p className="text-sm text-muted">
                  {item.quantity} × {formatUyu(item.unitPriceUyu)} · {item.productStyle}
                </p>
              </div>
              <p className="tabular-nums">{formatUyu(item.lineTotalUyu)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t border-ink pt-4">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatUyu(order.subtotalUyu)}</dd></div>
          <div className="flex justify-between"><dt>{order.shippingLabel}</dt><dd className="tabular-nums">{order.shippingUyu > 0 ? formatUyu(order.shippingUyu) : "Sin costo"}</dd></div>
          <div className="flex justify-between font-display text-2xl font-black"><dt>Total</dt><dd className="tabular-nums">{formatUyu(order.totalUyu)}</dd></div>
        </dl>
      </section>

      {(copy.tone === "bad" || order.status === "PAYMENT_REJECTED") && (
        <Link href="/carrito" className="btn btn-primary mt-12">
          Volver al carrito
        </Link>
      )}
      {order.status === "PAID" && (
        <Link href="/cervezas" className="btn btn-ghost mt-12">
          Seguir explorando
        </Link>
      )}
    </div>
  );
}
