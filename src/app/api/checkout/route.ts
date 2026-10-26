import { NextResponse } from "next/server";
import { checkoutSchema } from "@/domain/validation";
import { reserveOrder, recordPreference, releaseOrderAfterFailure } from "@/domain/orders";
import { getEnv, isMercadoPagoConfigured } from "@/lib/env";
import { createMercadoPagoProvider } from "@/lib/payments/mercadopago";
import { errorResponse, handleRouteError, zodIssues } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Crea el pedido (PENDING_PAYMENT) con stock reservado y devuelve la URL de pago.
 * No marca nada como pagado: eso lo decide únicamente el webhook verificado.
 */
export async function POST(request: Request) {
  if (!isMercadoPagoConfigured()) {
    return errorResponse(
      503,
      "Los pagos todavía no están configurados. No se pueden tomar pedidos en este momento.",
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, "Revisá los datos del formulario.", zodIssues(parsed.error));
    }

    const order = await reserveOrder(parsed.data);
    const site = getEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    const orderUrl = `${site}/pedido/${order.publicToken}`;

    const provider = createMercadoPagoProvider();
    const checkoutItems = order.items.map((item) => ({
      id: item.id,
      title: item.name,
      quantity: item.quantity,
      unitPriceUyu: item.unitPriceUyu,
    }));
    if (order.shippingUyu > 0) {
      checkoutItems.push({
        id: "envio",
        title: order.shippingLabel,
        quantity: 1,
        unitPriceUyu: order.shippingUyu,
      });
    }

    try {
      const session = await provider.createCheckout({
        orderId: order.orderId,
        publicToken: order.publicToken,
        items: checkoutItems,
        payer: order.payer,
        expiresAt: order.reservedUntil,
        successUrl: orderUrl,
        pendingUrl: orderUrl,
        failureUrl: orderUrl,
        notificationUrl: `${site}/api/webhooks/mercadopago`,
      });

      await recordPreference({
        orderId: order.orderId,
        provider: provider.name,
        providerPreferenceId: session.providerPreferenceId,
        amountUyu: order.totalUyu,
      });

      return NextResponse.json({ orderToken: order.publicToken, checkoutUrl: session.checkoutUrl }, { status: 201 });
    } catch (error) {
      // Si el proveedor falla, se libera el stock reservado y el pedido queda cancelado.
      await releaseOrderAfterFailure(order.orderId);
      console.error("[checkout] proveedor de pagos", error instanceof Error ? error.message : "error");
      return errorResponse(502, "No pudimos iniciar el pago. Tu carrito no se perdió; intentá de nuevo.");
    }
  } catch (error) {
    return handleRouteError(error, "checkout");
  }
}
