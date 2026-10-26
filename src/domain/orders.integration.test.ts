import "dotenv/config";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { applyProviderPayment, expireStaleOrders, reserveOrder } from "./orders.ts";
import type { CheckoutInput } from "./validation.ts";

/**
 * Prueba de integración contra PostgreSQL (DATABASE_URL). Usa un producto y clientes
 * propios de la corrida y los borra al final. Ejecutar solo en la base de desarrollo.
 */

const run = randomUUID().slice(0, 8);
const slug = `test-${run}`;
let productId = "";
let shippingWasEnabled = false;

function checkoutInput(quantity: number, email: string): CheckoutInput {
  return {
    lines: [{ slug, quantity }],
    customer: { fullName: "Persona de Prueba", email, phone: "099123456", ageConfirmed: true },
    shippingCode: "retiro",
  };
}

before(async () => {
  const product = await db.product.create({
    data: {
      slug,
      name: "Prueba",
      style: "Test",
      status: "AVAILABLE",
      priceUyu: 100,
      abvTenths: 50,
      volumeMl: 330,
      stock: 5,
      summary: "test",
      description: "test",
      tastingNotes: [],
      ingredients: [],
      accentColor: "#000000",
      artworkSrc: "/products/golden-label.webp",
      artworkAlt: "test",
    },
  });
  productId = product.id;

  const retiro = await db.shippingOption.findUniqueOrThrow({ where: { code: "retiro" } });
  shippingWasEnabled = retiro.enabled;
  await db.shippingOption.update({ where: { code: "retiro" }, data: { enabled: true } });
});

after(async () => {
  // Orden de borrado: pedidos (arrastran ítems y pagos), luego producto y clientes.
  await db.order.deleteMany({ where: { customer: { email: { endsWith: `${run}@prueba.test` } } } });
  await db.product.deleteMany({ where: { slug } });
  await db.customer.deleteMany({ where: { email: { endsWith: `${run}@prueba.test` } } });
  await db.shippingOption.update({ where: { code: "retiro" }, data: { enabled: shippingWasEnabled } });
  await db.$disconnect();
});

test("reserva stock al crear el pedido y bloquea la sobreventa", async () => {
  const first = await reserveOrder(checkoutInput(3, `a-${run}@prueba.test`));
  assert.equal(first.totalUyu, 300);

  await assert.rejects(
    () => reserveOrder(checkoutInput(3, `b-${run}@prueba.test`)),
    (error: unknown) => (error as { status?: number }).status === 409,
    "solo quedan 2 unidades disponibles",
  );

  const second = await reserveOrder(checkoutInput(2, `c-${run}@prueba.test`));
  assert.equal(second.totalUyu, 200);
});

test("un pago aprobado descuenta stock una sola vez (idempotente)", async () => {
  const order = await db.order.findFirstOrThrow({
    where: { customer: { email: `a-${run}@prueba.test` } },
  });
  const payment = {
    providerPaymentId: `pay-${run}-1`,
    status: "approved",
    amountUyu: order.totalUyu,
    currency: "UYU",
    orderId: order.id,
  };

  const first = await applyProviderPayment(payment, "mercadopago");
  assert.equal(first.outcome, "applied");
  assert.equal(first.outcome === "applied" && first.orderStatus, "PAID");

  const replay = await applyProviderPayment(payment, "mercadopago");
  assert.equal(replay.outcome === "applied" && replay.changed, false);

  const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
  assert.equal(product.stock, 2, "5 - 3 = 2, sin doble descuento");
});

test("un pago rechazado libera la reserva", async () => {
  const order = await db.order.findFirstOrThrow({
    where: { customer: { email: `c-${run}@prueba.test` } },
  });
  const result = await applyProviderPayment(
    { providerPaymentId: `pay-${run}-2`, status: "rejected", amountUyu: order.totalUyu, currency: "UYU", orderId: order.id },
    "mercadopago",
  );
  assert.equal(result.outcome === "applied" && result.orderStatus, "PAYMENT_REJECTED");

  const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
  assert.equal(product.stock, 2, "el stock físico no cambia con un rechazo");
});

test("un monto distinto al del pedido manda el pedido a revisión", async () => {
  const order = await reserveOrder(checkoutInput(1, `d-${run}@prueba.test`));
  const result = await applyProviderPayment(
    { providerPaymentId: `pay-${run}-3`, status: "approved", amountUyu: 1, currency: "UYU", orderId: order.orderId },
    "mercadopago",
  );
  assert.equal(result.outcome === "applied" && result.orderStatus, "NEEDS_REVIEW");
});

test("reservas vencidas pasan a EXPIRED y un pago tardío se valida contra el stock", async () => {
  const past = new Date(Date.now() - 2 * 60 * 60_000);
  const order = await reserveOrder(checkoutInput(1, `e-${run}@prueba.test`), past);

  const expired = await expireStaleOrders();
  assert.ok(expired >= 1);
  const stored = await db.order.findUniqueOrThrow({ where: { id: order.orderId } });
  assert.equal(stored.status, "EXPIRED");

  const late = await applyProviderPayment(
    { providerPaymentId: `pay-${run}-4`, status: "approved", amountUyu: order.totalUyu, currency: "UYU", orderId: order.orderId },
    "mercadopago",
  );
  assert.equal(late.outcome === "applied" && late.orderStatus, "PAID");
});
