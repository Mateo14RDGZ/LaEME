import { NextResponse } from "next/server";
import { quoteCart } from "@/domain/cart";
import { cartLinesSchema } from "@/domain/validation";
import { loadCartProducts } from "@/data/queries";
import { errorResponse, handleRouteError, zodIssues } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Cotiza el carrito con precios y disponibilidad reales. Lo usa la UI; el checkout vuelve a validar. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = cartLinesSchema.safeParse(body?.lines);
    if (!parsed.success) {
      return errorResponse(400, "Revisá el carrito.", zodIssues(parsed.error));
    }

    const slugs = [...new Set(parsed.data.map((l) => l.slug))];
    const products = await loadCartProducts(slugs);
    const quote = quoteCart(parsed.data, products);

    const unknownSlugs = slugs.filter((s) => !products.has(s));
    return NextResponse.json({ ...quote, unknownSlugs });
  } catch (error) {
    return handleRouteError(error, "cart/quote");
  }
}
