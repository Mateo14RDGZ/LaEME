/**
 * Cálculo de carrito. Funciones puras: reciben productos ya leídos de la base
 * y devuelven precios y disponibilidad. Nunca confían en precios del cliente.
 */

export const MAX_UNITS_PER_LINE = 12;
export const MAX_LINES = 20;

export type CartLineInput = { slug: string; quantity: number };

export type CatalogProductForCart = {
  slug: string;
  name: string;
  status: "DRAFT" | "COMING_SOON" | "AVAILABLE" | "SOLD_OUT" | "DISCONTINUED";
  priceUyu: number;
  /** Stock físico menos reservas de pedidos pendientes. */
  availableUnits: number;
};

export type PurchaseBlock =
  | "not_for_sale"
  | "no_price"
  | "sold_out"
  | "insufficient_stock";

export type CartLineQuote = {
  slug: string;
  name: string;
  quantity: number;
  unitPriceUyu: number;
  lineTotalUyu: number;
  purchasable: boolean;
  /** Indica pocas unidades sin revelar el stock exacto. */
  limited: boolean;
  block: PurchaseBlock | null;
};

export type CartQuote = {
  lines: CartLineQuote[];
  subtotalUyu: number;
  hasBlockingIssues: boolean;
};

const LIMITED_THRESHOLD = 3;

export function blockFor(product: CatalogProductForCart, quantity: number): PurchaseBlock | null {
  if (product.status !== "AVAILABLE") return "not_for_sale";
  if (product.priceUyu <= 0) return "no_price";
  if (product.availableUnits <= 0) return "sold_out";
  if (product.availableUnits < quantity) return "insufficient_stock";
  return null;
}

/**
 * Valida y cotiza líneas de carrito. Las líneas con slug desconocido se omiten
 * y el llamador decide cómo informarlo.
 */
export function quoteCart(
  lines: CartLineInput[],
  products: Map<string, CatalogProductForCart>,
): CartQuote {
  const quoted: CartLineQuote[] = [];
  let subtotalUyu = 0;

  for (const line of lines) {
    const product = products.get(line.slug);
    if (!product) continue;

    const block = blockFor(product, line.quantity);
    const unitPriceUyu = product.priceUyu;
    const lineTotalUyu = unitPriceUyu * line.quantity;
    subtotalUyu += lineTotalUyu;

    quoted.push({
      slug: product.slug,
      name: product.name,
      quantity: line.quantity,
      unitPriceUyu,
      lineTotalUyu,
      purchasable: block === null,
      limited: block === null && product.availableUnits <= LIMITED_THRESHOLD,
      block,
    });
  }

  return {
    lines: quoted,
    subtotalUyu,
    hasBlockingIssues: quoted.some((line) => !line.purchasable),
  };
}

/** Normaliza cantidades que llegan de un cliente: entero entre 1 y el máximo por línea. */
export function clampQuantity(value: number): number {
  if (!Number.isInteger(value)) return 1;
  return Math.min(Math.max(value, 1), MAX_UNITS_PER_LINE);
}
