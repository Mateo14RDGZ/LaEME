import { NextResponse } from "next/server";
import { applyProviderPayment } from "@/domain/orders";
import { isMercadoPagoConfigured } from "@/lib/env";
import { createMercadoPagoProvider } from "@/lib/payments/mercadopago";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Webhook de Mercado Pago.
 *  1. Verifica la firma x-signature con el secreto de la aplicación.
 *  2. Consulta el pago en la API de Mercado Pago (nunca confía en el cuerpo del webhook).
 *  3. Aplica el estado de forma idempotente.
 * Responde 200 para que Mercado Pago no reintente eventos ya procesados o que no nos corresponden.
 */
export async function POST(request: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const body = (await request.json().catch(() => null)) as
    | { type?: string; topic?: string; data?: { id?: string | number } }
    | null;

  const topic = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? body?.type ?? body?.topic;
  if (topic !== "payment") {
    return NextResponse.json({ ignored: "topic" }, { status: 200 });
  }

  const dataId =
    url.searchParams.get("data.id") ?? (body?.data?.id !== undefined ? String(body.data.id) : null);
  if (!dataId) {
    return NextResponse.json({ error: "missing_data_id" }, { status: 400 });
  }

  const provider = createMercadoPagoProvider();
  const valid = provider.verifyWebhookSignature({
    dataId,
    requestId: request.headers.get("x-request-id"),
    signatureHeader: request.headers.get("x-signature"),
  });
  if (!valid) {
    console.warn("[webhook] firma inválida");
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  try {
    const payment = await provider.fetchPayment(dataId);
    if (!payment) {
      return NextResponse.json({ ignored: "payment_not_found" }, { status: 200 });
    }
    const result = await applyProviderPayment(payment, provider.name);
    return NextResponse.json({ received: true, result: result.outcome }, { status: 200 });
  } catch (error) {
    // 500 hace que Mercado Pago reintente la notificación.
    console.error("[webhook] error procesando pago", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
