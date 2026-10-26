import type { MetadataRoute } from "next";
import { listCatalog } from "@/data/queries";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listCatalog();
  const staticPaths = ["/", "/cervezas", "/nuestra-filosofia", "/contacto", "/envios", "/privacidad", "/terminos"];
  return [
    ...staticPaths.map((path) => ({ url: absoluteUrl(path), changeFrequency: "weekly" as const })),
    ...products.map((p) => ({ url: absoluteUrl(`/cervezas/${p.slug}`), changeFrequency: "weekly" as const })),
  ];
}
