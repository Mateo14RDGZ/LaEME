import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { quoteCart, clampQuantity, type CatalogProductForCart } from "./cart.ts";
import { resolveShipping, shippingOptionsFor, type ShippingOptionForCheckout } from "./shipping.ts";
import { decidePaymentAction } from "./order-status.ts";
import { buildSignatureManifest, computeSignature, parseSignatureHeader, signaturesMatch } from "../lib/payments/mercadopago.ts";
import { formatAbv, isValidAmount } from "../lib/money.ts";
import { cartLinesSchema, checkoutSchema } from "./validation.ts";

const products = new Map<string, CatalogProductForCart>([
  ["tropical-haze", { slug: "tropical-haze", name: "Tropical Haze", status: "AVAILABLE", priceUyu: 290, availableUnits: 10 }],
  ["golden", { slug: "golden", name: "Golden", status: "COMING_SOON", priceUyu: 250, availableUnits: 0 }],
  ["midnight", { slug: "midnight", name: "Midnight", status: "AVAILABLE", priceUyu: 0, availableUnits: 5 }],
  ["citrus-ipa", { slug: "citrus-ipa", name: "Citrus IPA", status: "AVAILABLE", priceUyu: 300, availableUnits: 2 }],
  ["berry-sour", { slug: "berry-sour", name: "Berry Sour", status: "AVAILABLE", priceUyu: 310, availableUnits: 0 }],
]);

describe("cotización de carrito", () => {
  test("calcula subtotal con enteros y ignora slugs desconocidos", () => {
    const quote = quoteCart(
      [
        { slug: "tropical-haze", quantity: 3 },
        { slug: "no-existe", quantity: 1 },
      ],
      products,
    );
    assert.equal(quote.subtotalUyu, 870);
    assert.equal(quote.lines.length, 1);
    assert.equal(quote.hasBlockingIssues, false);
  });

  test("bloquea productos no disponibles, sin precio o sin stock", () => {
    const quote = quoteCart(
      [
        { slug: "golden", quantity: 1 },
        { slug: "midnight", quantity: 1 },
        { slug: "berry-sour", quantity: 1 },
      ],
      products,
    );
    assert.equal(quote.hasBlockingIssues, true);
    assert.deepEqual(
      quote.lines.map((l) => l.block),
      ["not_for_sale", "no_price", "sold_out"],
    );
    assert.equal(quote.lines.every((l) => !l.purchasable), true);
  });

  test("stock insuficiente bloquea la línea y marca pocas unidades", () => {
    const short = quoteCart([{ slug: "citrus-ipa", quantity: 3 }], products);
    assert.equal(short.lines[0]?.block, "insufficient_stock");
    assert.equal(short.lines[0]?.purchasable, false);

    const ok = quoteCart([{ slug: "citrus-ipa", quantity: 2 }], products);
    assert.equal(ok.lines[0]?.purchasable, true);
    assert.equal(ok.lines[0]?.limited, true);
  });

  test("clampQuantity acota a enteros entre 1 y el máximo", () => {
    assert.equal(clampQuantity(0), 1);
    assert.equal(clampQuantity(99), 12);
    assert.equal(clampQuantity(2.5), 1);
    assert.equal(clampQuantity(4), 4);
  });
});

describe("envíos", () => {
  const options: ShippingOptionForCheckout[] = [
    { code: "retiro", label: "Retiro", priceUyu: 0, enabled: true, isPickup: true, departments: [] },
    { code: "montevideo", label: "Montevideo", priceUyu: 150, enabled: true, isPickup: false, departments: ["Montevideo", "Canelones"] },
    { code: "todo-pais", label: "Todo el país", priceUyu: 400, enabled: false, isPickup: false, departments: [] },
  ];

  test("resuelve el costo desde la configuración del servidor", () => {
    const resolved = resolveShipping(options, "montevideo", "Canelones");
    assert.equal(resolved.priceUyu, 150);
  });

  test("rechaza opciones deshabilitadas", () => {
    assert.throws(() => resolveShipping(options, "todo-pais", "Rocha"), /no está disponible/);
  });

  test("rechaza zonas no cubiertas", () => {
    assert.throws(() => resolveShipping(options, "montevideo", "Rocha"), /no cubre/);
  });

  test("retiro no requiere departamento", () => {
    assert.equal(resolveShipping(options, "retiro", undefined).isPickup, true);
  });

  test("filtra opciones por departamento", () => {
    const codes = shippingOptionsFor(options, "Rocha").map((o) => o.code);
    assert.deepEqual(codes, ["retiro"]);
  });
});

describe("firma de webhooks de Mercado Pago", () => {
  const secret = "secreto-de-prueba-1234567890";
  const dataId = "ABC123";
  const requestId = "req-789";
  const ts = "1704908010";

  test("valida una firma correcta y rechaza una alterada", () => {
    const manifest = buildSignatureManifest(dataId, requestId, ts);
    assert.equal(manifest, "id:abc123;request-id:req-789;ts:1704908010;");
    const v1 = computeSignature(manifest, secret);
    const header = `ts=${ts},v1=${v1}`;
    const parsed = parseSignatureHeader(header);
    assert.ok(parsed);
    assert.equal(signaturesMatch(computeSignature(buildSignatureManifest(dataId, requestId, parsed.ts), secret), parsed.v1), true);
    assert.equal(signaturesMatch(computeSignature(buildSignatureManifest("OTRO", requestId, ts), secret), v1), false);
  });

  test("header malformado no se parsea", () => {
    assert.equal(parseSignatureHeader("basura"), null);
    assert.equal(parseSignatureHeader("ts=1"), null);
  });
});

describe("estados de pago", () => {
  test("aprobado marca pagado; pendiente no cierra el pedido", () => {
    assert.deepEqual(decidePaymentAction("approved"), { action: "mark_paid" });
    assert.deepEqual(decidePaymentAction("pending"), { action: "keep" });
    assert.deepEqual(decidePaymentAction("in_process"), { action: "keep" });
    assert.deepEqual(decidePaymentAction("estado-desconocido"), { action: "keep" });
  });

  test("rechazos, cancelaciones, vencimientos y reembolsos tienen acción propia", () => {
    assert.equal(decidePaymentAction("rejected").action, "mark_rejected");
    assert.equal(decidePaymentAction("cancelled").action, "mark_cancelled");
    assert.equal(decidePaymentAction("expired").action, "mark_expired");
    assert.equal(decidePaymentAction("refunded").action, "mark_refunded");
    assert.equal(decidePaymentAction("charged_back").action, "mark_refunded");
  });
});

describe("validación de entrada", () => {
  test("el carrito rechaza líneas repetidas y cantidades fuera de rango", () => {
    assert.equal(cartLinesSchema.safeParse([{ slug: "golden", quantity: 1 }, { slug: "golden", quantity: 2 }]).success, false);
    assert.equal(cartLinesSchema.safeParse([{ slug: "golden", quantity: 0 }]).success, false);
    assert.equal(cartLinesSchema.safeParse([{ slug: "golden", quantity: 13 }]).success, false);
    assert.equal(cartLinesSchema.safeParse([]).success, false);
  });

  test("el checkout exige confirmar mayoría de edad y no acepta campos extra", () => {
    const base = {
      lines: [{ slug: "golden", quantity: 1 }],
      customer: { fullName: "Ana Pérez", email: "ana@example.com", phone: "099 123 456", ageConfirmed: false },
      shippingCode: "retiro",
    };
    assert.equal(checkoutSchema.safeParse(base).success, false);
    assert.equal(checkoutSchema.safeParse({ ...base, customer: { ...base.customer, ageConfirmed: true }, total: 1 }).success, false);
    assert.equal(checkoutSchema.safeParse({ ...base, customer: { ...base.customer, ageConfirmed: true } }).success, true);
  });

  test("el checkout no acepta precios enviados por el cliente", () => {
    const parsed = checkoutSchema.safeParse({
      lines: [{ slug: "golden", quantity: 1, priceUyu: 1 }],
      customer: { fullName: "Ana Pérez", email: "ana@example.com", phone: "099123456", ageConfirmed: true },
      shippingCode: "retiro",
    });
    // Zod descarta claves desconocidas dentro de líneas; lo importante es que el precio no se use.
    assert.equal(parsed.success, true);
    assert.equal("priceUyu" in (parsed.success ? parsed.data.lines[0]! : {}), false);
  });
});

describe("dinero", () => {
  test("montos enteros y graduación en formato uruguayo", () => {
    assert.equal(isValidAmount(290), true);
    assert.equal(isValidAmount(290.5), false);
    assert.equal(isValidAmount(-1), false);
    assert.equal(formatAbv(58), "5,8 %");
  });
});
