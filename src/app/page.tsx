import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listCatalog } from "@/data/queries";
import { Tagline } from "@/components/brand/tagline";
import { LaEmeEmblem } from "@/components/brand/emblem";
import { ProductCard } from "@/components/catalog/product-card";
import { AvailabilityBadge } from "@/components/catalog/availability";
import { Arrow } from "@/components/ui/arrow";
import { formatAbv, formatUyu } from "@/lib/money";

export const metadata: Metadata = {
  title: "Cerveza artesanal uruguaya",
  description: "LA EME: cerveza artesanal independiente hecha en Uruguay. QUE HABLE LO QUE HACEMOS.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

const PRINCIPLES = [
  {
    title: "Con intención",
    body: "Cada cerveza empieza con una idea concreta y sigue hasta que el resultado se sostiene por sí solo.",
  },
  {
    title: "Con curiosidad",
    body: "Probamos combinaciones que nos gustan: mango con maracuyá, lúpulo cítrico, café y chocolate. Y seguimos probando.",
  },
  {
    title: "Con respeto",
    body: "Nombramos cada ingrediente y lo que aporta. Si está en el vaso, puede explicarse.",
  },
] as const;

export default async function HomePage() {
  const catalog = await listCatalog();
  const featured = catalog.find((p) => p.isFeatured) ?? catalog[0];

  return (
    <>
      {/* Hero: la frase de marca es la composición. */}
      <section aria-label="Presentación" className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 pt-12 sm:px-8 md:pt-20 lg:grid-cols-12 lg:gap-8 lg:px-12 lg:pb-36">
        <div className="lg:col-span-7">
          <Tagline as="h1" className="reveal text-[clamp(3.5rem,10.5vw,9rem)] max-w-[11ch]" />

          <p className="reveal mt-10 max-w-md text-lg leading-relaxed text-muted" style={{ ["--delay" as string]: "200ms" }}>
            Cerveza independiente, hecha en Uruguay. Ingredientes, curiosidad y cuidado en cada detalle:
            el resultado habla por sí solo.
          </p>

          <div className="reveal mt-10 flex flex-wrap items-center gap-x-8 gap-y-5" style={{ ["--delay" as string]: "300ms" }}>
            <Link href="/cervezas" className="btn btn-primary">
              Explorar cervezas
            </Link>
            <Link href="/nuestra-filosofia" className="inline-flex items-center gap-2 text-[0.9375rem] font-semibold underline decoration-1 underline-offset-[6px] hover:decoration-2">
              Nuestra filosofía
              <Arrow />
            </Link>
          </div>
        </div>

        {featured && (
          <div className="lg:col-span-5">
            <Link href={`/cervezas/${featured.slug}`} className="group mx-auto block max-w-[24rem] lg:max-w-none">
              <div className="artwork-settle relative aspect-[3/4] overflow-hidden" style={{ ["--delay" as string]: "150ms" }}>
                <Image
                  src="/brand/tropical-haze-bottle.webp"
                  alt="Botella ámbar de Tropical Haze con su etiqueta de mango y maracuyá"
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 80vw"
                  className="object-contain transition-transform duration-1000 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-translate-y-2"
                />
              </div>
              <div className="mt-6 flex items-baseline justify-between gap-6">
                <p className="font-display text-2xl font-black">{featured.name}</p>
                <p className="tabular text-[0.9375rem] text-muted">
                  {formatAbv(featured.abvTenths)} · {featured.volumeMl} ml
                </p>
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* Manifiesto */}
      <section aria-labelledby="manifiesto" className="bg-parchment">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
          <h2 id="manifiesto" className="font-display max-w-3xl text-4xl font-black leading-[1.05] sm:text-6xl">
            Hacer las cosas con intención, y dejar que hablen.
          </h2>
          <ul className="mt-20 grid gap-14 md:grid-cols-3 md:gap-10">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="border-t border-ink pt-8">
                <h3 className="font-display text-2xl font-bold">{p.title}</h3>
                <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cerveza destacada */}
      {featured && (
        <section aria-labelledby="destacada" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <div
                className="relative aspect-[1122/668] overflow-hidden"
                style={{ backgroundColor: `color-mix(in srgb, ${featured.accentColor} 16%, var(--color-cream))` }}
              >
                <Image
                  src={featured.artworkSrc}
                  alt={featured.artworkAlt}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-contain p-[3%]"
                />
              </div>
            </div>

            <div className="lg:col-span-4 lg:col-start-9">
              <h2 id="destacada" className="font-display text-6xl font-black leading-[0.95] sm:text-7xl">
                {featured.name}
              </h2>
              <p className="mt-4 text-lg text-muted">{featured.style}</p>
              <p className="mt-8 text-[1.0625rem] leading-relaxed">{featured.description}</p>

              <dl className="mt-10 divide-y divide-ink/20 border-y border-ink/20">
                <div className="flex justify-between py-3">
                  <dt className="text-muted">Graduación</dt>
                  <dd className="tabular font-semibold">{formatAbv(featured.abvTenths)}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-muted">Volumen</dt>
                  <dd className="tabular font-semibold">{featured.volumeMl} ml</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-muted">Precio</dt>
                  <dd className="tabular font-semibold">
                    {featured.priceUyu > 0 ? formatUyu(featured.priceUyu) : "Por confirmar"}
                  </dd>
                </div>
              </dl>

              <div className="mt-10 flex flex-wrap items-center gap-5">
                <AvailabilityBadge item={featured} />
                <Link href={`/cervezas/${featured.slug}`} className="inline-flex items-center gap-2 font-semibold underline decoration-1 underline-offset-[6px] hover:decoration-2">
                  Descubrir cerveza
                  <Arrow />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Colección */}
      <section aria-labelledby="coleccion" className="mx-auto max-w-7xl px-5 pb-32 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-6 border-b border-ink pb-6">
          <h2 id="coleccion" className="font-display text-5xl font-black sm:text-6xl">Cervezas</h2>
          <Link href="/cervezas" className="hidden items-center gap-2 font-semibold underline decoration-1 underline-offset-[6px] sm:inline-flex">
            Ver todas
            <Arrow />
          </Link>
        </div>

        {catalog.length === 0 ? (
          <p className="mt-14 text-muted">Estamos preparando la colección. Volvé pronto.</p>
        ) : (
          <div className="mt-16 grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((item, i) => (
              <ProductCard key={item.id} item={item} tall={i % 2 === 1} />
            ))}
          </div>
        )}
      </section>

      {/* Cierre */}
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-5 pb-32 text-center sm:px-8">
        <LaEmeEmblem className="h-14 w-24" title="" />
        <p className="font-display text-3xl font-bold leading-snug sm:text-4xl">
          Una cerveza se entiende probándola. Acá te contamos cómo la pensamos.
        </p>
        <Link href="/nuestra-filosofia" className="btn btn-ghost">
          Leer nuestra filosofía
        </Link>
      </section>
    </>
  );
}
