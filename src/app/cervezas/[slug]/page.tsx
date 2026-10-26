import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, listCatalog } from "@/data/queries";
import { absoluteUrl } from "@/lib/site";
import { formatAbv, formatUyu } from "@/lib/money";
import { isDarkHex } from "@/lib/color";
import { AvailabilityBadge } from "@/components/catalog/availability";
import { Bottle } from "@/components/catalog/bottle";
import { AddToCart } from "@/components/catalog/add-to-cart";
import { ProductCard } from "@/components/catalog/product-card";
import { Arrow } from "@/components/ui/arrow";

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
    openGraph: { title: `${product.name} · LA EME`, description, images: [product.bottleSrc ?? product.artworkSrc] },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const [product, catalog] = await Promise.all([getProductBySlug(slug), listCatalog()]);
  if (!product) notFound();

  const dark = isDarkHex(product.accentColor);
  const related = catalog.filter((p) => p.slug !== product.slug).slice(0, 2);
  const canBuy = product.status === "AVAILABLE" && product.purchasable;
  const productJsonLd =
    product.status === "AVAILABLE" && product.priceUyu > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.summary,
          brand: { "@type": "Brand", name: "LA EME" },
          image: absoluteUrl(product.bottleSrc ?? product.artworkSrc),
          offers: {
            "@type": "Offer",
            priceCurrency: "UYU",
            price: product.priceUyu,
            availability: product.purchasable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }
      : null;

  return (
    <article className={dark ? "bg-brown text-cream" : ""}>
      {productJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      )}

      <div className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 lg:px-12">
        <nav aria-label="Migas de pan" className="text-[0.9375rem]">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="underline underline-offset-4">Inicio</Link></li>
            <li aria-hidden="true" className="opacity-60">/</li>
            <li><Link href="/cervezas" className="underline underline-offset-4">Cervezas</Link></li>
            <li aria-hidden="true" className="opacity-60">/</li>
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>
      </div>

      {/* Escena: la botella sobre el color de su variedad. */}
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-24">
        <div className="lg:col-span-6">
          <Bottle
            src={product.bottleSrc ?? product.artworkSrc}
            alt={product.artworkAlt}
            tint={product.accentColor}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            className="mx-auto w-full max-w-[30rem] lg:sticky lg:top-28"
          />
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <h1 className="font-display text-[clamp(3.5rem,9vw,7rem)] font-black leading-[0.9]">{product.name}</h1>
          <p className={`mt-4 text-lg ${dark ? "text-cream/85" : "text-muted"}`}>{product.style}</p>
          <div className="mt-6">
            <AvailabilityBadge item={product} />
          </div>
          <p className="mt-8 font-display text-2xl italic leading-snug">{product.summary}</p>

          <dl className={`mt-10 grid grid-cols-2 gap-y-6 border-y py-6 sm:grid-cols-4 ${dark ? "border-cream/25" : "border-ink/25"}`}>
            <div>
              <dt className={`text-sm ${dark ? "text-cream/85" : "text-muted"}`}>Graduación</dt>
              <dd className="tabular mt-1 font-display text-2xl font-bold">{formatAbv(product.abvTenths)}</dd>
            </div>
            <div>
              <dt className={`text-sm ${dark ? "text-cream/85" : "text-muted"}`}>Volumen</dt>
              <dd className="tabular mt-1 font-display text-2xl font-bold">{product.volumeMl} ml</dd>
            </div>
            <div>
              <dt className={`text-sm ${dark ? "text-cream/85" : "text-muted"}`}>Servir a</dt>
              <dd className="tabular mt-1 font-display text-2xl font-bold">{product.serviceTemperature ?? "—"}</dd>
            </div>
            <div>
              <dt className={`text-sm ${dark ? "text-cream/85" : "text-muted"}`}>Precio</dt>
              <dd className="tabular mt-1 font-display text-2xl font-bold">
                {product.priceUyu > 0 ? formatUyu(product.priceUyu) : "Por confirmar"}
              </dd>
            </div>
          </dl>

          <div className="mt-10">
            {canBuy && <AddToCart slug={product.slug} name={product.name} />}
            {!canBuy && product.status === "AVAILABLE" && (
              <p className="notice text-ink">
                {product.priceUyu <= 0
                  ? "El precio de esta cerveza todavía no está confirmado."
                  : "No hay unidades disponibles en este momento."}
              </p>
            )}
            {product.status === "COMING_SOON" && (
              <div className="notice text-ink">
                <p className="font-display text-2xl font-bold">En desarrollo</p>
                <p className="mt-2">Todavía no está a la venta. Es parte del universo de LA EME mientras se completa su elaboración.</p>
              </div>
            )}
            {product.status === "SOLD_OUT" && (
              <div className="notice notice-error text-ink">
                <p className="font-display text-2xl font-bold">Agotada</p>
                <p className="mt-2">Por ahora no tenemos unidades para vender.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editorial: descripción y perfil de sabor. */}
      <section aria-labelledby="sobre" className="mx-auto grid max-w-7xl gap-16 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:px-12 lg:py-28">
        <div className="lg:col-span-5">
          <h2 id="sobre" className="font-display text-4xl font-black leading-tight sm:text-5xl">Sobre esta cerveza</h2>
          <p className="mt-6 text-[1.0625rem] leading-relaxed">{product.description}</p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <h2 className="font-display text-2xl font-bold">Perfil de sabor</h2>
          {product.tastingNotes.length > 0 ? (
            <ul className={`mt-6 divide-y border-y ${dark ? "divide-cream/25 border-cream/25" : "divide-ink/20 border-ink/20"}`}>
              {product.tastingNotes.map((note) => (
                <li key={note} className="font-display py-5 text-3xl font-bold">{note}</li>
              ))}
            </ul>
          ) : (
            <p className={`mt-6 ${dark ? "text-cream/85" : "text-muted"}`}>Las notas de cata se publicarán próximamente.</p>
          )}
        </div>
      </section>

      {/* Etiqueta oficial, a tamaño de lectura. */}
      <section aria-label="Etiqueta" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-12">
        <div className={`relative aspect-[1.9/1] overflow-hidden ${dark ? "" : "bg-parchment"}`}>
          <Image src={product.artworkSrc} alt={product.artworkAlt} fill sizes="(min-width: 1024px) 80vw, 100vw" className="object-contain p-[2%]" />
        </div>
      </section>

      {/* Información técnica: solo lo confirmado. */}
      <section aria-labelledby="ingredientes" className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 sm:px-8 md:grid-cols-2 lg:px-12">
        <div>
          <h2 id="ingredientes" className="font-display text-2xl font-bold">Ingredientes</h2>
          {product.ingredientsVerified && product.ingredients.length > 0 ? (
            <p className="mt-4 leading-relaxed">{product.ingredients.join(", ")}.</p>
          ) : (
            <p className={`mt-4 ${dark ? "text-cream/85" : "text-muted"}`}>
              Los ingredientes se publicarán cuando la ficha esté verificada.
            </p>
          )}
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Envío y conservación</h2>
          <p className={`mt-4 leading-relaxed ${dark ? "text-cream/85" : "text-muted"}`}>
            El costo y las zonas de envío se calculan en el checkout. Servir a {product.serviceTemperature ?? "la temperatura indicada"}.{" "}
            <Link href="/envios" className="underline underline-offset-4">Cómo funcionan los envíos</Link>.
          </p>
        </div>
      </section>

      <p className={`mx-auto max-w-7xl border-t px-5 py-8 text-sm sm:px-8 lg:px-12 ${dark ? "border-cream/25 text-cream/85" : "border-ink/20 text-muted"}`}>
        Contiene alcohol. Venta solo a mayores de 18 años. Consumí con moderación.
      </p>

      {related.length > 0 && (
        <section aria-labelledby="relacionadas" className="mx-auto max-w-7xl px-5 pb-32 pt-12 sm:px-8 lg:px-12">
          <div className="flex items-end justify-between gap-6 border-b border-current pb-6">
            <h2 id="relacionadas" className="font-display text-4xl font-black">Otras cervezas de LA EME</h2>
            <Link href="/cervezas" className="hidden items-center gap-2 font-semibold underline decoration-1 underline-offset-[6px] sm:inline-flex">
              Ver todas
              <Arrow />
            </Link>
          </div>
          <div className="mt-16 grid gap-16 sm:grid-cols-2">
            {related.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
