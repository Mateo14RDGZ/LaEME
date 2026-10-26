import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * Inventario y reservas.
 *
 *  - Product.stock es stock físico. Solo baja cuando un pago queda APROBADO.
 *  - Un pedido pendiente de pago reserva sus unidades hasta reservedUntil.
 *  - Disponible = stock - reservas vigentes de pedidos PENDING_PAYMENT.
 *  - Cualquier cambio de stock se hace después de bloquear la fila del producto
 *    con SELECT ... FOR UPDATE, siempre en el mismo orden (por id) para evitar deadlocks.
 */

export type DbClient = typeof db | Prisma.TransactionClient;

/** Bloquea las filas de productos dadas, en orden estable. Debe usarse dentro de una transacción. */
export async function lockProducts(tx: Prisma.TransactionClient, productIds: string[]): Promise<void> {
  const ordered = [...new Set(productIds)].sort();
  for (const id of ordered) {
    await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id" = ${id} FOR UPDATE`;
  }
}

/** Unidades reservadas vigentes por producto. */
export async function reservedUnits(
  client: DbClient,
  productIds: string[],
  now: Date,
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const rows = await client.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { in: productIds },
      order: { status: "PENDING_PAYMENT", reservedUntil: { gt: now } },
    },
    _sum: { quantity: true },
  });
  return new Map(rows.map((row) => [row.productId, row._sum.quantity ?? 0]));
}

/** Stock disponible para venta: físico menos reservas vigentes, nunca negativo. */
export function availableFor(stock: number, reserved: number): number {
  return Math.max(stock - reserved, 0);
}
