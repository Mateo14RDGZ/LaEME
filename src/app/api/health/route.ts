import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMercadoPagoConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Estado de la configuración para verificar un despliegue. No expone secretos.
 * 200 si la base responde; 503 si falta la base o no conecta.
 */
export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  let database: "ok" | "not_configured" | "unreachable" = "not_configured";

  if (databaseConfigured) {
    try {
      await db.$queryRaw`SELECT 1`;
      database = "ok";
    } catch {
      database = "unreachable";
    }
  }

  const ok = database === "ok";
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      database,
      siteUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      cronSecretConfigured: Boolean(process.env.CRON_SECRET),
      paymentsConfigured: isMercadoPagoConfigured(),
    },
    { status: ok ? 200 : 503 },
  );
}
