/**
 * Contrato de proveedor de pagos. La gestión de pedidos depende solo de esta
 * interfaz; Mercado Pago es una implementación. Otro proveedor se agrega aquí
 * sin tocar pedidos ni stock.
 */

export type CheckoutLineItem = {
  id: string;
  title: string;
  quantity: number;
  unitPriceUyu: number;
};

export type CreateCheckoutInput = {
  orderId: string;
  publicToken: string;
  items: CheckoutLineItem[];
  payer: { email: string; name: string };
  expiresAt: Date;
  successUrl: string;
  pendingUrl: string;
  failureUrl: string;
  notificationUrl: string;
};

export type CheckoutSession = {
  providerPreferenceId: string;
  /** URL a la que se redirige al cliente para pagar. */
  checkoutUrl: string;
};

/** Pago tal como lo informa el proveedor, después de consultarlo en su API. */
export type ProviderPayment = {
  providerPaymentId: string;
  status: string;
  amountUyu: number;
  currency: string;
  orderId: string | null;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>;
  /** Consulta el pago directamente al proveedor. Nunca se confía en datos del navegador. */
  fetchPayment(providerPaymentId: string): Promise<ProviderPayment | null>;
  /** Verifica la firma de un webhook entrante. */
  verifyWebhookSignature(input: {
    dataId: string;
    requestId: string | null;
    signatureHeader: string | null;
  }): boolean;
}
