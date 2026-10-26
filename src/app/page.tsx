import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listCatalog } from "@/data/queries";
import { Tagline } from "@/components/brand/tagline";
import { LaEmeEmblem } from "@/components/brand/emblem";
import { ProductCard } from "@/components/catalog/product-card";
import { AvailabilityBadge } from "@/components/catalog/availability";
import { formatAbv, formatUyu } from "@/lib/money";

export const metadata: Metadata = {
  title: "Cerveza artesanal uruguaya",
  description:
    "LA EME: cerveza artesanal independiente hecha en Uruguay. QUE HABLE LO QUE HACEMOS.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

const PRINCIPLES = [
  {
    n: "01",
    title: "Con intención",
    body: "Cada cerveza empieza con una idea concreta y sigue hasta que el resultado se sostiene por sí solo.",
  },
  {
    n: "02",
    title: "Con curiosidad",
    body: "Probamos combinaciones que nos gustan: mango con maracuyá, lúpulo cítrico, café y chocolate. Y seguimos probando.",
  },
  {
    n: "03",
    title: "Con respeto",
    body: "Nombramos cada ingrediente y lo que aporta. Si está en el vaso, puede explicarse.",
  },
] as const;

export default async function HomePage() {
  const catalog = await listCatalog();
  const featured = catalog.find((p) => p.isFeatured) ?? catalog[0];
  const collection = catalog;

  return (
    <>
      {/* HERO: la frase de marca es el centro de la composición. */}
      <section aria-label="Presentación" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-20 pt-10 sm:px-6 md:pt-16 lg:grid-cols-12 lg:gap-6 lg:px-10 lg:pb-28">
          <div className="reveal lg:col-span-7" style={{ ["--delay" as string]: "0ms" }}>
            <p className="label-caps flex items-center gap-3 text-[0.8rem]">
              <span className="h-px w-10 bg-ink" aria-hidden="true" />
              Cerveza artesanal · Uruguay
            </p>

            <Tagline
              as="h1"
              className="reveal mt-6 text-[clamp(3.25rem,11vw,9.5rem)] max-w-[12ch]"
            />

            <p className="reveal mt-8 max-w-md text-lg leading-relaxed text-ink/85" style={{ ["--delay" as string]: "250ms" }}>
              Cerveza independiente, hecha en Uruguay. Ingredientes, curiosidad y cuidado en cada detalle:
              el resultado habla por sí solo.
            </p>

            <div className="reveal mt-10 flex flex-wrap items-center gap-6" style={{ ["--delay" as string]: "400ms" }}>
              <Link href="/cervezas" className="btn btn-primary">
                Explorar cervezas
              </Link>
              <Link href="/nuestra-filosofia" className="label-caps text-[0.8rem] underline underline-offset-[6px]">
                Nuestra filosofía
              </Link>
            </div>
          </div>

          {featured && (
            <div className="lg:col-span-5 lg:pl-6">
              <Link
                href={`/cervezas/${featured.slug}`}
                className="group relative mx-auto block w-full max-w-[22rem] sm:max-w-md lg:max-w-none"
              >
                <div className="artwork-settle relative aspect-[3/4] overflow-hidden" style={{ ["--delay" as string]: "200ms" }}>
                  <Image
                    src="/brand/tropical-haze-bottle.webp"
                    alt="Botella ámbar de Tropical Haze con su etiqueta de mango y maracuyá"
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, 80vw"
                    className="object-contain transition-transform duration-1000 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-translate-y-2"
                  />
                </div>
                <div className="mt-4 flex items-end justify-between gap-4 border-t border-ink/30 pt-3">
                  <div>
                    <p className="font-display text-2xl font-black">{featured.name}</p>
                    <p className="label-caps text-[0.7rem]" style={{ color: featured.accentColor }}>{featured.style}</p>
                  </div>
                  <p className="text-sm text-right">
                    {formatAbv(featured.abvTenths)} · {featured.volumeMl} ml
                  </p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* MANIFIESTO */}
      <section aria-labelledby="manifiesto" className="bg-parchment">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-12">
            <h2 id="manifiesto" className="font-display text-4xl font-black leading-[1.02] sm:text-5xl lg:col-span-5">
              Hacer las cosas con intención, y dejar que hablen.
            </h2>
            <ol className="grid gap-10 sm:grid-cols-3 lg:col-span-7 lg:gap-8">
              {PRINCIPLES.map((p) => (
                <li key={p.n} className="border-t border-ink pt-5">
                  <p className="label-caps text-[0.75rem] text-orange">{p.n}</p>
                  <h3 className="font-display mt-3 text-2xl font-bold">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-ink/85">{p.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* DESTACADA */}
      {featured && (
        <section aria-labelledby="destacada" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="relative aspect-[1122/668] overflow-hidden" style={{ backgroundColor: `color-mix(in srgb, ${featured.accentColor} 14%, var(--color-cream))` }}>
                <Image
                  src={featured.artworkSrc}
                  alt={featured.artworkAlt}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-contain p-[3%]"
                />
              </div>
            </div>
            <div className="lg:col-span-5">
              <p className="label-caps text-[0.78rem]" style={{ color: featured.accentColor }}>
                Cerveza insignia
              </p>
              <h2 id="destacada" className="font-display mt-3 text-6xl font-black leading-[0.9] sm:text-7xl">
                {featured.name}
              </h2>
              <p className="label-caps mt-3 text-[0.85rem]">{featured.style}</p>
              <p className="mt-6 text-lg leading-relaxed text-ink/85">{featured.description}</p>

              <dl className="mt-8 grid grid-cols-3 border-y border-ink/25 py-4 text-center">
                <div>
                  <dt className="label-caps text-[0.68rem]">Graduación</dt>
                  <dd className="font-display mt-1 text-2xl font-bold">{formatAbv(featured.abvTenths)}</dd>
                </div>
                <div>
                  <dt className="label-caps text-[0.68rem]">Volumen</dt>
                  <dd className="font-display mt-1 text-2xl font-bold">{featured.volumeMl} ml</dd>
                </div>
                <div>
                  <dt className="label-caps text-[0.68rem]">Precio</dt>
                  <dd className="font-display mt-1 text-2xl font-bold">
                    {featured.priceUyu > 0 ? formatUyu(featured.priceUyu) : "Por confirmar"}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <AvailabilityBadge item={featured} />
                <Link href={`/cervezas/${featured.slug}`} className="btn btn-ghost">
                  Descubrir cerveza
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* COLECCIÓN */}
      <section aria-labelledby="coleccion" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink pb-6">
          <div>
            <p className="label-caps text-[0.78rem]">La colección</p>
            <h2 id="coleccion" className="font-display mt-2 text-5xl font-black">Cervezas</h2>
          </div>
          <Tagline className="text-right text-sm tracking-[0.2em] text-ink/70" />
        </div>

        {collection.length === 0 ? (
          <p className="mt-12 text-ink/80">Estamos preparando la colección. Volvé pronto.</p>
        ) : (
          <div className="mt-14 grid gap-14 sm:grid-cols-2 lg:grid-cols-3">
            {collection.map((item, i) => (
              <ProductCard key={item.id} item={item} tall={i % 2 === 1} />
            ))}
          </div>
        )}
      </section>

      {/* CIERRE */}
      <section className="mx-auto mb-8 flex max-w-7xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:px-10">
        <LaEmeEmblem className="h-14 w-24 text-ink" title="" />
        <p className="font-display max-w-2xl text-3xl font-bold leading-snug sm:text-4xl">
          Una cerveza se entiende probándola. Acá te contamos cómo la pensamos.
        </p>
        <Link href="/nuestra-filosofia" className="btn btn-ghost mt-2">
          Leer nuestra filosofía
        </Link>
      </section>
    </>
  );
}
