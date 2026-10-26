import { NextResponse } from "next/server";
import { shippingOptionsFor } from "@/domain/shipping";
import { shippingQuerySchema } from "@/domain/validation";
import { listEnabledShipping } from "@/data/queries";
import { isMercadoPagoConfigured } from "@/lib/env";
import { errorResponse, handleRouteError, zodIssues } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Opciones de envío y retiro para el checkout, filtradas por departamento.
 * Indica si los pagos están configurados, para no mostrar un botón que no funciona.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = shippingQuerySchema.safeParse({
      department: url.searchParams.get("department") ?? undefined,
    });
    if (!parsed.success) {
      return errorResponse(400, "Departamento inválido.", zodIssues(parsed.error));
    }

    const enabled = await listEnabledShipping();
    const options = shippingOptionsFor(enabled, parsed.data.department).map((o) => ({
      code: o.code,
      label: o.label,
      priceUyu: o.priceUyu,
      isPickup: o.isPickup,
    }));

    return NextResponse.json({
      paymentsConfigured: isMercadoPagoConfigured(),
      options,
    });
  } catch (error) {
    return handleRouteError(error, "checkout/options");
  }
}
