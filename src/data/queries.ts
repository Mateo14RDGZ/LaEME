import "server-only";
import { db } from "@/lib/db";
import { availableFor, reservedUnits } from "@/domain/inventory";
import type { CatalogProductForCart } from "@/domain/cart";
import type { ShippingOptionForCheckout } from "@/domain/shipping";

/**
 * Lecturas de la base para páginas y endpoints. Nada de esto se confía al cliente:
 * la disponibilidad se recalcula en cada lectura.
 */

export type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  style: string;
  summary: string;
  description: string;
  tastingNotes: string[];
  ingredients: string[];
  ingredientsVerified: boolean;
  status: "DRAFT" | "COMING_SOON" | "AVAILABLE" | "SOLD_OUT" | "DISCONTINUED";
  priceUyu: number;
  abvTenths: number;
  volumeMl: number;
  accentColor: string;
  artworkSrc: string;
  artworkAlt: string;
  bottleSrc: string | null;
  serviceTemperature: string | null;
  isFeatured: boolean;
  /** Unidades que pueden venderse hoy (stock menos reservas). */
  availableUnits: number;
  /** true solo si el producto se puede agregar al carrito ahora. */
  purchasable: boolean;
};

const PUBLIC_STATUSES = ["AVAILABLE", "COMING_SOON", "SOLD_OUT"] as const;

async function withAvailability(
  rows: Awaited<ReturnType<typeof db.product.findMany>>,
): Promise<CatalogItem[]> {
  const reserved = await reservedUnits(db, rows.map((r) => r.id), new Date());
  return rows.map((p) => {
    const availableUnits = availableFor(p.stock, reserved.get(p.id) ?? 0);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      style: p.style,
      summary: p.summary,
      description: p.description,
      tastingNotes: p.tastingNotes,
      ingredients: p.ingredients,
      ingredientsVerified: p.ingredientsVerified,
      status: p.status,
      priceUyu: p.priceUyu,
      abvTenths: p.abvTenths,
      volumeMl: p.volumeMl,
      accentColor: p.accentColor,
      artworkSrc: p.artworkSrc,
      artworkAlt: p.artworkAlt,
      bottleSrc: p.bottleSrc,
      serviceTemperature: p.serviceTemperature,
      isFeatured: p.isFeatured,
      availableUnits,
      purchasable: p.status === "AVAILABLE" && p.priceUyu > 0 && availableUnits > 0,
    };
  });
}

/** Catálogo público, ordenado. Excluye borradores y productos discontinuados. */
export async function listCatalog(): Promise<CatalogItem[]> {
  const rows = await db.product.findMany({
    where: { status: { in: [...PUBLIC_STATUSES] } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return withAvailability(rows);
}

export async function getProductBySlug(slug: string): Promise<CatalogItem | null> {
  const row = await db.product.findUnique({ where: { slug } });
  if (!row || !(PUBLIC_STATUSES as readonly string[]).includes(row.status)) return null;
  const [item] = await withAvailability([row]);
  return item ?? null;
}

/** Mapa slug -> datos de carrito, para cotizar líneas en el servidor. */
export async function loadCartProducts(slugs: string[]): Promise<Map<string, CatalogProductForCart>> {
  const rows = await db.product.findMany({ where: { slug: { in: slugs } } });
  const items = await withAvailability(rows);
  return new Map(
    items.map((p) => [
      p.slug,
      {
        slug: p.slug,
        name: p.name,
        status: p.status,
        priceUyu: p.priceUyu,
        availableUnits: p.availableUnits,
      },
    ]),
  );
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  const rows = await db.siteSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function listEnabledShipping(): Promise<ShippingOptionForCheckout[]> {
  const rows = await db.shippingOption.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({
    code: r.code,
    label: r.label,
    priceUyu: r.priceUyu,
    enabled: r.enabled,
    isPickup: r.isPickup,
    departments: r.departments,
  }));
}

export type OrderView = {
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  subtotalUyu: number;
  shippingUyu: number;
  totalUyu: number;
  shippingLabel: string;
  isPickup: boolean;
  items: { productName: string; productStyle: string; quantity: number; unitPriceUyu: number; lineTotalUyu: number }[];
};

/** Pedido accesible solo con su token público. No expone ids internos ni datos personales. */
export async function getOrderByToken(token: string): Promise<OrderView | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const order = await db.order.findUnique({
    where: { publicToken: token },
    include: { items: true },
  });
  if (!order) return null;
  return {
    status: order.status,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    subtotalUyu: order.subtotalUyu,
    shippingUyu: order.shippingUyu,
    totalUyu: order.totalUyu,
    shippingLabel: order.shippingLabel,
    isPickup: order.isPickup,
    items: order.items.map((i) => ({
      productName: i.productName,
      productStyle: i.productStyle,
      quantity: i.quantity,
      unitPriceUyu: i.unitPriceUyu,
      lineTotalUyu: i.lineTotalUyu,
    })),
  };
}
