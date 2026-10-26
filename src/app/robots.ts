import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/carrito", "/checkout", "/pedido/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
