/**
 * Máquina de estados de pagos y pedidos.
 * Funciones puras: deciden qué transición es válida desde cada estado.
 * La aplicación real se hace con updateMany condicional en la base (idempotente).
 */

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PAYMENT_REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "NEEDS_REVIEW";

/** Estados de pago reportados por el proveedor (Mercado Pago). */
export type ProviderPaymentStatus =
  | "approved"
  | "pending"
  | "in_process"
  | "authorized"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back"
  | "expired"
  | string;

export type PaymentDecision =
  | { action: "mark_paid" }
  | { action: "mark_rejected" }
  | { action: "mark_cancelled" }
  | { action: "mark_expired" }
  | { action: "mark_refunded" }
  | { action: "keep" };

/**
 * Qué hacer con un pedido cuando el proveedor informa un estado de pago.
 * "keep" = no cambiar nada (pendiente, o ya en un estado final compatible).
 */
export function decidePaymentAction(providerStatus: ProviderPaymentStatus): PaymentDecision {
  switch (providerStatus) {
    case "approved":
      return { action: "mark_paid" };
    case "rejected":
      return { action: "mark_rejected" };
    case "cancelled":
      return { action: "mark_cancelled" };
    case "expired":
      return { action: "mark_expired" };
    case "refunded":
    case "charged_back":
      return { action: "mark_refunded" };
    default:
      // pending, in_process, authorized y estados desconocidos: no se cierra el pedido.
      return { action: "keep" };
  }
}

/** Estados desde los que un pago aprobado puede marcar el pedido como pagado. */
export const PAYABLE_FROM: readonly OrderStatus[] = [
  "PENDING_PAYMENT",
  "EXPIRED",
  "PAYMENT_REJECTED",
  "CANCELLED",
];

/** Estados desde los que se libera la reserva al fallar o cancelarse el pago. */
export const RELEASABLE_FROM: readonly OrderStatus[] = ["PENDING_PAYMENT"];

/** Estados que consumen stock físico (ya descontado). */
export const STOCK_CONSUMING: readonly OrderStatus[] = ["PAID", "REFUNDED"];

export function isFinal(status: OrderStatus): boolean {
  return status !== "PENDING_PAYMENT";
}
