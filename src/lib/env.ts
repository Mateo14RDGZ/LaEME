import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),
  ORDER_RESERVATION_MINUTES: z.coerce.number().int().min(5).max(120).default(30),
  CRON_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/** Valida variables de entorno una sola vez. Falla con un mensaje claro si falta algo. */
export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Configuración de entorno inválida:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Mercado Pago solo se considera configurado con un access token real (no el placeholder del ejemplo). */
export function isMercadoPagoConfigured(): boolean {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
  const tokenLooksReal =
    /^(TEST|APP_USR)-/.test(token) && token.length > 40 && !token.includes("000000000");
  return tokenLooksReal && webhookSecret.length >= 16 && !webhookSecret.startsWith("replace-");
}
