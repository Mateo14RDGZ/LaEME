import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, listCatalog } from "@/data/queries";
import { absoluteUrl } from "@/lib/site";
import { formatAbv, formatUyu } from "@/lib/money";
import { AvailabilityBadge } from "@/components/catalog/availability";
import { BeerArtwork } from "@/components/catalog/beer-artwork";
import { AddToCart } from "@/components/catalog/add-to-cart";
import { ProductCard } from "@/components/catalog/product-card";
import { Tagline } from "@/components/brand/tagline";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Cerveza no encontrada" };
  const description = `${product.style}. ${product.summary} ${formatAbv(product.abvTenths)} · ${product.volumeMl} ml.`;
  return {
    title: `${product.name} · ${product.style}`,
    description,
    alternates: { canonical: absoluteUrl(`/cervezas/${product.slug}`) },
    openGraph: {
      title: `${product.name} · LA EME`,
      description,
      images: [product.artworkSrc],
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const [product, catalog] = await Promise.all([getProductBySlug(slug), listCatalog()]);
  if (!product) notFound();

  const related = catalog.filter((p) => p.slug !== product.slug).slice(0, 3);
  const productJsonLd =
    product.status === "AVAILABLE" && product.priceUyu > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.summary,
          brand: { "@type": "Brand", name: "LA EME" },
          image: absoluteUrl(product.artworkSrc),
          offers: {
            "@type": "Offer",
            priceCurrency: "UYU",
            price: product.priceUyu,
            availability: product.purchasable
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : null;

  return (
    <article className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-10">
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}

      <nav aria-label="Migas de pan" className="label-caps mb-8 text-[0.72rem]">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:underline">Inicio</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/cervezas" className="hover:underline">Cervezas</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <div className="group lg:sticky lg:top-28">
            <BeerArtwork
              src={product.artworkSrc}
              alt={product.artworkAlt}
              accentColor={product.accentColor}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
              className="artwork-settle"
            />
          </div>
        </div>

        <div className="lg:col-span-6">
          <p className="label-caps text-[0.78rem]" style={{ color: product.accentColor }}>
            {product.style}
          </p>
          <h1 className="font-display mt-3 text-[clamp(3.5rem,10vw,6.5rem)] font-black leading-[0.9]">
            {product.name}
          </h1>
          <p className="mt-6 max-w-xl font-display text-2xl italic leading-snug">{product.summary}</p>
          <div className="mt-6">
            <AvailabilityBadge item={product} />
          </div>

          <dl className="mt-10 grid grid-cols-3 border-y border-ink/25 py-5 text-center">
            <div>
              <dt className="label-caps text-[0.7rem] text-ink/70">Graduación</dt>
              <dd className="font-display mt-1 text-3xl font-bold">{formatAbv(product.abvTenths)}</dd>
            </div>
            <div>
              <dt className="label-caps text-[0.7rem] text-ink/70">Volumen</dt>
              <dd className="font-display mt-1 text-3xl font-bold">{product.volumeMl} ml</dd>
            </div>
            <div>
              <dt className="label-caps text-[0.7rem] text-ink/70">Precio</dt>
              <dd className="font-display mt-1 text-3xl font-bold">
                {product.priceUyu > 0 ? formatUyu(product.priceUyu) : "Por confirmar"}
              </dd>
            </div>
          </dl>

          <div className="mt-10">
            {product.status === "AVAILABLE" && product.purchasable && (
              <AddToCart slug={product.slug} name={product.name} />
            )}
            {product.status === "AVAILABLE" && !product.purchasable && (
              <p className="border-l-2 border-burgundy pl-4 text-ink/85">
                {product.priceUyu <= 0
                  ? "El precio de esta cerveza todavía no está confirmado."
                  : "No hay unidades disponibles en este momento."}
              </p>
            )}
            {product.status === "COMING_SOON" && (
              <div className="border-l-2 border-gold pl-4">
                <p className="font-display text-2xl font-bold">Próximamente</p>
                <p className="mt-2 text-ink/85">Todavía no está a la venta.</p>
              </div>
            )}
            {product.status === "SOLD_OUT" && (
              <div className="border-l-2 border-burgundy pl-4">
                <p className="font-display text-2xl font-bold">Agotada</p>
                <p className="mt-2 text-ink/85">Por ahora no tenemos unidades para vender.</p>
              </div>
            )}
          </div>

          <section className="mt-14 space-y-8" aria-labelledby="descripcion">
            <div>
              <h2 id="descripcion" className="label-caps text-[0.8rem]">Sobre esta cerveza</h2>
              <p className="mt-3 leading-relaxed text-ink/90">{product.description}</p>
            </div>

            {product.tastingNotes.length > 0 && (
              <div>
                <h2 className="label-caps text-[0.8rem]">Notas de cata</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {product.tastingNotes.map((note) => (
                    <li key={note} className="border border-ink/40 px-3 py-1 text-sm">{note}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="label-caps text-[0.8rem]">Ingredientes</h2>
              {product.ingredientsVerified && product.ingredients.length > 0 ? (
                <p className="mt-3 leading-relaxed">{product.ingredients.join(", ")}.</p>
              ) : (
                <p className="mt-3 text-ink/75">
                  Ingredientes en revisión. Se publicarán cuando la ficha esté verificada.
                </p>
              )}
            </div>

            <div className="text-sm text-ink/80">
              <h2 className="label-caps text-[0.8rem] text-ink">Envío y temperatura</h2>
              <p className="mt-3">
                Los envíos y los costos se calculan en el checkout según tu zona. Consultá{" "}
                <Link href="/envios" className="underline underline-offset-4">cómo funcionan los envíos</Link>.
                Servir entre 6 y 8 °C.
              </p>
            </div>

            <p className="border-t border-ink/20 pt-6 text-sm text-ink/75">
              Contiene alcohol. Venta solo a mayores de 18 años. Consumí con moderación.
            </p>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="relacionadas" className="mt-28 border-t border-ink pt-12">
          <h2 id="relacionadas" className="font-display text-4xl font-black">
            Otras cervezas de LA EME
          </h2>
          <Tagline className="mt-3 text-sm tracking-[0.2em] text-ink/70" />
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
