import type { Metadata } from "next";
import { listCatalog } from "@/data/queries";
import { ProductCard } from "@/components/catalog/product-card";
import { Tagline } from "@/components/brand/tagline";

export const metadata: Metadata = {
  title: "Cervezas",
  description:
    "La colección de LA EME: IPA, stout, lager y sour, cada una con su nombre, estilo, graduación y disponibilidad real.",
  alternates: { canonical: "/cervezas" },
};

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const items = await listCatalog();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 lg:px-10">
      <header className="border-b border-ink pb-8">
                <h1 className="font-display mt-3 text-[clamp(3.5rem,9vw,7rem)] font-black leading-[0.9]">
          Cervezas
        </h1>
        <p className="mt-5 text-lg text-muted">Cerveza independiente, hecha en Trinidad, Flores.</p>
      </header>

      {items.length === 0 ? (
        <p className="mt-16 max-w-md text-lg text-muted">
          Todavía no hay cervezas publicadas. Volvé pronto.
        </p>
      ) : (
        <div className="mt-14 grid gap-14 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <ProductCard key={item.id} item={item} offset={i % 2 === 1} priority={i < 2} />
          ))}
        </div>
      )}
    </div>
  );
}
