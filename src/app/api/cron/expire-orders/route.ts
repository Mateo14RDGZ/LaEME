import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { expireStaleOrders } from "@/domain/orders";
import { getEnv } from "@/lib/env";
import { handleRouteError } from "@/lib/http";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = getEnv().CRON_SECRET;
  if (!secret || secret.length < 16 || secret.startsWith("replace-")) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Libera pedidos cuya reserva venció sin pago. Ejecutar cada 5 minutos
 * (Vercel Cron o similar) con `Authorization: Bearer $CRON_SECRET`.
 */
async function run(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const expired = await expireStaleOrders();
    return NextResponse.json({ expired });
  } catch (error) {
    return handleRouteError(error, "cron/expire-orders");
  }
}

export const GET = run;
export const POST = run;
