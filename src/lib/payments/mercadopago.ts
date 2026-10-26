import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CheckoutSession,
  CreateCheckoutInput,
  PaymentProvider,
  ProviderPayment,
} from "./provider.ts";

const API_BASE = "https://api.mercadopago.com";
const REQUEST_TIMEOUT_MS = 10_000;

/** Interpreta el header x-signature: "ts=<timestamp>,v1=<hex>". */
export function parseSignatureHeader(header: string): { ts: string; v1: string } | null {
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
  if (!parts.ts || !parts.v1) return null;
  return { ts: parts.ts, v1: parts.v1 };
}

/**
 * Manifiesto firmado por Mercado Pago:
 * id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 * Los ids alfanuméricos se firman en minúsculas.
 */
export function buildSignatureManifest(dataId: string, requestId: string | null, ts: string): string {
  return `id:${dataId.toLowerCase()};request-id:${requestId ?? ""};ts:${ts};`;
}

export function computeSignature(manifest: string, secret: string): string {
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

export function signaturesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

type MpPreferenceResponse = { id: string; init_point: string };

type MpPaymentResponse = {
  id: number | string;
  status: string;
  transaction_amount: number;
  currency_id: string;
  external_reference: string | null;
};

class MercadoPagoProvider implements PaymentProvider {
  readonly name = "mercadopago";

  constructor(
    private readonly accessToken: string,
    private readonly webhookSecret: string,
  ) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(`${API_BASE}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          ...init.headers,
        },
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const items = input.items.map((item) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unitPriceUyu,
      currency_id: "UYU",
    }));

    const response = await this.request<MpPreferenceResponse>("/checkout/preferences", {
      method: "POST",
      headers: { "X-Idempotency-Key": `order-${input.orderId}` },
      body: JSON.stringify({
        items,
        payer: { email: input.payer.email, name: input.payer.name },
        external_reference: input.orderId,
        metadata: { order_public_token: input.publicToken },
        back_urls: {
          success: input.successUrl,
          pending: input.pendingUrl,
          failure: input.failureUrl,
        },
        auto_return: "approved",
        notification_url: input.notificationUrl,
        statement_descriptor: "LA EME",
        expires: true,
        expiration_date_to: input.expiresAt.toISOString(),
      }),
    });

    if (!response.ok) {
      // No se loguea el cuerpo: puede contener datos del comprador.
      throw new Error(`Mercado Pago rechazó la preferencia (HTTP ${response.status})`);
    }
    const data = (await response.json()) as MpPreferenceResponse;
    return { providerPreferenceId: data.id, checkoutUrl: data.init_point };
  }

  async fetchPayment(providerPaymentId: string): Promise<ProviderPayment | null> {
    const response = await this.request<MpPaymentResponse>(
      `/v1/payments/${encodeURIComponent(providerPaymentId)}`,
    );
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`No se pudo consultar el pago en Mercado Pago (HTTP ${response.status})`);
    }
    const data = (await response.json()) as MpPaymentResponse;
    return {
      providerPaymentId: String(data.id),
      status: data.status,
      amountUyu: Math.round(data.transaction_amount),
      currency: data.currency_id,
      orderId: data.external_reference,
    };
  }

  verifyWebhookSignature(input: {
    dataId: string;
    requestId: string | null;
    signatureHeader: string | null;
  }): boolean {
    if (!input.signatureHeader) return false;
    const parsed = parseSignatureHeader(input.signatureHeader);
    if (!parsed) return false;
    const manifest = buildSignatureManifest(input.dataId, input.requestId, parsed.ts);
    return signaturesMatch(computeSignature(manifest, this.webhookSecret), parsed.v1);
  }
}

export function createMercadoPagoProvider(): PaymentProvider {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
  return new MercadoPagoProvider(accessToken, webhookSecret);
}
