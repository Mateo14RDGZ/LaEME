import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import type { ProviderPayment } from "@/lib/payments/provider";
import { quoteCart, type CatalogProductForCart } from "./cart.ts";
import { DomainError, type DomainIssue } from "./errors.ts";
import { availableFor, lockProducts, reservedUnits } from "./inventory.ts";
import { decidePaymentAction, PAYABLE_FROM, RELEASABLE_FROM, type OrderStatus } from "./order-status.ts";
import { resolveShipping, type ShippingOptionForCheckout } from "./shipping.ts";
import type { CheckoutInput } from "./validation.ts";
import type { Prisma } from "@/generated/prisma/client";

export type ReservedOrder = {
  orderId: string;
  publicToken: string;
  subtotalUyu: number;
  shippingUyu: number;
  totalUyu: number;
  shippingLabel: string;
  reservedUntil: Date;
  items: { id: string; name: string; quantity: number; unitPriceUyu: number }[];
  payer: { email: string; name: string };
};

function newPublicToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Crea el pedido en PENDING_PAYMENT y reserva stock, todo en una transacción.
 * Los precios, el stock y el envío se leen del servidor; el cliente solo elige cantidades y opciones.
 */
export async function reserveOrder(input: CheckoutInput, now: Date = new Date()): Promise<ReservedOrder> {
  const reservationMinutes = getEnv().ORDER_RESERVATION_MINUTES;
  const slugs = [...new Set(input.lines.map((l) => l.slug))];

  return db.$transaction(async (tx) => {
    const found = await tx.product.findMany({ where: { slug: { in: slugs } } });
    const ids = found.map((p) => p.id);
    await lockProducts(tx, ids);

    const reserved = await reservedUnits(tx, ids, now);
    const catalog = new Map<string, CatalogProductForCart & { id: string; volumeMl: number }>();
    for (const p of found) {
      catalog.set(p.slug, {
        id: p.id,
        slug: p.slug,
        name: p.name,
        status: p.status,
        priceUyu: p.priceUyu,
        volumeMl: p.volumeMl,
        availableUnits: availableFor(p.stock, reserved.get(p.id) ?? 0),
      });
    }

    const quote = quoteCart(input.lines, catalog);
    if (quote.lines.length !== input.lines.length) {
      throw new DomainError("Algún producto del carrito ya no existe.", {
        status: 409,
        issues: [{ code: "unknown_product", message: "Producto no encontrado" }],
      });
    }
    if (quote.hasBlockingIssues) {
      const issues: DomainIssue[] = quote.lines
        .filter((l) => !l.purchasable)
        .map((l) => ({
          code: l.block ?? "not_purchasable",
          message: `${l.name}: no está disponible en la cantidad solicitada`,
          slug: l.slug,
        }));
      throw new DomainError("Hay productos que no están disponibles en este momento.", {
        status: 409,
        issues,
      });
    }

    const shippingOptions: ShippingOptionForCheckout[] = await tx.shippingOption.findMany({
      where: { enabled: true },
    });
    const department = input.address?.department;
    const shipping = resolveShipping(shippingOptions, input.shippingCode, department);

    if (!shipping.isPickup && !input.address) {
      throw new DomainError("Completá la dirección de entrega.", {
        issues: [{ code: "address_required", message: "Falta la dirección", field: "address" }],
      });
    }

    const customer = await tx.customer.upsert({
      where: { email: input.customer.email },
      create: {
        email: input.customer.email,
        fullName: input.customer.fullName,
        phone: input.customer.phone,
      },
      update: { fullName: input.customer.fullName, phone: input.customer.phone },
    });

    const subtotalUyu = quote.subtotalUyu;
    const shippingUyu = shipping.priceUyu;
    const totalUyu = subtotalUyu + shippingUyu;
    const reservedUntil = new Date(now.getTime() + reservationMinutes * 60_000);
    const publicToken = newPublicToken();
    const addr = !shipping.isPickup ? input.address : undefined;

    const order = await tx.order.create({
      data: {
        publicToken,
        status: "PENDING_PAYMENT",
        customerId: customer.id,
        subtotalUyu,
        shippingUyu,
        totalUyu,
        currency: "UYU",
        shippingCode: shipping.code,
        shippingLabel: shipping.label,
        isPickup: shipping.isPickup,
        department: addr?.department,
        city: addr?.city,
        street: addr?.street,
        streetNumber: addr?.streetNumber,
        apartment: addr?.apartment || null,
        postalCode: addr?.postalCode || null,
        addressNotes: addr?.notes || null,
        reservedUntil,
        items: {
          create: quote.lines.map((line) => {
            const product = catalog.get(line.slug)!;
            return {
              productId: product.id,
              productSlug: line.slug,
              productName: line.name,
              productStyle: found.find((p) => p.slug === line.slug)!.style,
              unitPriceUyu: line.unitPriceUyu,
              quantity: line.quantity,
              lineTotalUyu: line.lineTotalUyu,
            };
          }),
        },
      },
      include: { items: true },
    });

    return {
      orderId: order.id,
      publicToken,
      subtotalUyu,
      shippingUyu,
      totalUyu,
      shippingLabel: shipping.label,
      reservedUntil,
      items: order.items.map((i) => ({
        id: i.productId,
        name: i.productName,
        quantity: i.quantity,
        unitPriceUyu: i.unitPriceUyu,
      })),
      payer: { email: customer.email, name: customer.fullName },
    };
  });
}

/** Libera la reserva de un pedido que no pudo iniciar el pago. */
export async function releaseOrderAfterFailure(orderId: string): Promise<void> {
  await db.order.updateMany({
    where: { id: orderId, status: { in: [...RELEASABLE_FROM] } },
    data: { status: "CANCELLED", reservedUntil: null, notes: "No se pudo iniciar el pago." },
  });
}

export async function recordPreference(input: {
  orderId: string;
  provider: string;
  providerPreferenceId: string;
  amountUyu: number;
}): Promise<void> {
  await db.payment.create({
    data: {
      orderId: input.orderId,
      provider: input.provider,
      providerPreferenceId: input.providerPreferenceId,
      amountUyu: input.amountUyu,
    },
  });
}

export type ApplyResult =
  | { outcome: "ignored"; reason: string }
  | { outcome: "applied"; orderStatus: OrderStatus; changed: boolean };

/**
 * Aplica un pago consultado al proveedor sobre su pedido.
 * Idempotente: el mismo pago procesado varias veces no vuelve a descontar stock ni a cambiar el pedido.
 */
export async function applyProviderPayment(
  payment: ProviderPayment,
  providerName: string,
  now: Date = new Date(),
): Promise<ApplyResult> {
  if (!payment.orderId) return { outcome: "ignored", reason: "sin referencia de pedido" };

  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: payment.orderId! },
      include: { items: true },
    });
    if (!order) return { outcome: "ignored" as const, reason: "pedido inexistente" };

    await tx.payment.upsert({
      where: { providerPaymentId: payment.providerPaymentId },
      create: {
        orderId: order.id,
        provider: providerName,
        providerPaymentId: payment.providerPaymentId,
        providerStatus: payment.status,
        amountUyu: payment.amountUyu,
      },
      update: { providerStatus: payment.status },
    });

    const decision = decidePaymentAction(payment.status);
    const current = order.status;

    if (decision.action === "keep") {
      return { outcome: "applied" as const, orderStatus: current, changed: false };
    }

    if (decision.action === "mark_paid") {
      const amountMismatch =
        payment.amountUyu !== order.totalUyu || payment.currency !== order.currency;

      // Un segundo pago aprobado sobre el mismo pedido requiere revisión manual.
      const otherApproved = await tx.payment.count({
        where: {
          orderId: order.id,
          providerStatus: "approved",
          providerPaymentId: { not: payment.providerPaymentId },
        },
      });

      if (amountMismatch || otherApproved > 0) {
        const res = await tx.order.updateMany({
          where: { id: order.id, status: { in: [...PAYABLE_FROM, "PAID"] } },
          data: {
            status: "NEEDS_REVIEW",
            notes: amountMismatch
              ? "Monto o moneda del pago no coinciden con el pedido. Revisar antes de despachar."
              : "Se recibió más de un pago aprobado para este pedido. Revisar y reembolsar si corresponde.",
          },
        });
        return { outcome: "applied" as const, orderStatus: "NEEDS_REVIEW" as const, changed: res.count > 0 };
      }

      if (current === "PAID" || current === "REFUNDED" || current === "NEEDS_REVIEW") {
        return { outcome: "applied" as const, orderStatus: current, changed: false };
      }

      return confirmPaid(tx, order.id, order.items, now);
    }

    const target: Record<string, OrderStatus> = {
      mark_rejected: "PAYMENT_REJECTED",
      mark_cancelled: "CANCELLED",
      mark_expired: "EXPIRED",
    };

    if (decision.action === "mark_refunded") {
      const res = await tx.order.updateMany({
        where: { id: order.id, status: "PAID" },
        data: {
          status: "REFUNDED",
          notes: "Pago reembolsado o contracargo. El stock NO se repuso automáticamente.",
        },
      });
      return { outcome: "applied" as const, orderStatus: res.count ? "REFUNDED" : current, changed: res.count > 0 };
    }

    const next = target[decision.action];
    if (!next) return { outcome: "applied" as const, orderStatus: current, changed: false };

    const res = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING_PAYMENT" },
      data: { status: next, reservedUntil: null },
    });
    return { outcome: "applied" as const, orderStatus: res.count ? next : current, changed: res.count > 0 };
  });
}

async function confirmPaid(
  tx: Prisma.TransactionClient,
  orderId: string,
  items: { productId: string; quantity: number }[],
  now: Date,
): Promise<ApplyResult> {
  const productIds = items.map((i) => i.productId);
  await lockProducts(tx, productIds);

  const products = await tx.product.findMany({ where: { id: { in: productIds } } });
  const stockById = new Map(products.map((p) => [p.id, p.stock]));
  const enough = items.every((i) => (stockById.get(i.productId) ?? 0) >= i.quantity);

  if (!enough) {
    // Pagado pero sin stock (la reserva venció y el stock se vendió a otro). Queda para revisión.
    const res = await tx.order.updateMany({
      where: { id: orderId, status: { in: [...PAYABLE_FROM] } },
      data: {
        status: "NEEDS_REVIEW",
        reservedUntil: null,
        notes: "Pago aprobado sin stock suficiente (la reserva venció). Revisar: reembolsar o reponer.",
      },
    });
    return { outcome: "applied", orderStatus: "NEEDS_REVIEW", changed: res.count > 0 };
  }

  const res = await tx.order.updateMany({
    where: { id: orderId, status: { in: [...PAYABLE_FROM] } },
    data: { status: "PAID", paidAt: now, reservedUntil: null },
  });
  if (res.count === 0) {
    return { outcome: "applied", orderStatus: "PAID", changed: false };
  }

  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }
  return { outcome: "applied", orderStatus: "PAID", changed: true };
}

/** Marca como EXPIRED los pedidos cuya reserva venció sin pagar. Pensado para un cron. */
export async function expireStaleOrders(now: Date = new Date()): Promise<number> {
  const res = await db.order.updateMany({
    where: { status: "PENDING_PAYMENT", reservedUntil: { lt: now } },
    data: { status: "EXPIRED", reservedUntil: null },
  });
  return res.count;
}
