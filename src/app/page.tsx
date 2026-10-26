import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listCatalog, type CatalogItem } from "@/data/queries";
import { Tagline } from "@/components/brand/tagline";
import { LaEmeEmblem } from "@/components/brand/emblem";
import { AvailabilityBadge } from "@/components/catalog/availability";
import { Bottle } from "@/components/catalog/bottle";
import { Arrow } from "@/components/ui/arrow";
import { formatAbv, formatUyu } from "@/lib/money";
import { isDarkHex } from "@/lib/color";

export const metadata: Metadata = {
  title: "Cerveza artesanal uruguaya",
  description: "LA EME: cerveza artesanal independiente, hecha en Trinidad, Flores. QUE HABLE LO QUE HACEMOS.",
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
    body: "Probamos combinaciones que nos gustan: mango y maracuyá, lima y lúpulo, café y chocolate. Y seguimos probando.",
  },
  {
    title: "Con respeto",
    body: "Nombramos cada ingrediente y lo que aporta. Si está en el vaso, puede explicarse.",
  },
] as const;

/** Cada variedad tiene su propia composición; el orden lo marca el catálogo, no el código. */
function VarietyFeature({ item }: { item: CatalogItem }) {
  return (
    <section aria-labelledby={`variedad-${item.slug}`} className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-12 lg:py-36">
      <div className="lg:col-span-6">
        <Bottle
          src={item.bottleSrc ?? item.artworkSrc}
          alt={item.artworkAlt}
          tint={item.accentColor}
          sizes="(min-width: 1024px) 45vw, 90vw"
          className="mx-auto w-full max-w-[32rem]"
        />
      </div>
      <div className="lg:col-span-5 lg:col-start-8">
        <h2 id={`variedad-${item.slug}`} className="font-display text-6xl font-black leading-[0.95] sm:text-7xl">
          {item.name}
        </h2>
        <p className="mt-4 text-lg text-muted">{item.style}</p>
        <p className="mt-8 text-[1.0625rem] leading-relaxed">{item.description}</p>
        <Specs item={item} />
        <Footer item={item} />
      </div>
    </section>
  );
}

function VarietyRow({ item }: { item: CatalogItem }) {
  return (
    <section aria-labelledby={`variedad-${item.slug}`} className="border-y border-ink/20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 md:grid-cols-12 lg:px-12 lg:py-28">
        <div className="md:col-span-4">
          <Bottle
            src={item.bottleSrc ?? item.artworkSrc}
            alt={item.artworkAlt}
            tint={item.accentColor}
            sizes="(min-width: 768px) 30vw, 80vw"
            className="mx-auto max-w-[20rem]"
          />
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <h2 id={`variedad-${item.slug}`} className="font-display text-5xl font-black leading-none sm:text-6xl">
            {item.name}
          </h2>
          <p className="mt-4 text-lg text-muted">{item.style}</p>
          <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed">{item.summary}</p>
          <Specs item={item} />
          <Footer item={item} />
        </div>
      </div>
    </section>
  );
}

function VarietyBand({ item }: { item: CatalogItem }) {
  return (
    <section aria-labelledby={`variedad-${item.slug}`} className="bg-brown text-cream">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-12 lg:py-36">
        <div className="order-2 lg:order-1 lg:col-span-6">
          <h2 id={`variedad-${item.slug}`} className="font-display text-6xl font-black leading-[0.95] sm:text-7xl">
            {item.name}
          </h2>
          <p className="mt-4 text-lg text-cream/85">{item.style}</p>
          <p className="mt-8 max-w-xl text-[1.0625rem] leading-relaxed">{item.description}</p>
          <Specs item={item} onDark />
          <Footer item={item} onDark />
        </div>
        <div className="order-1 lg:order-2 lg:col-span-5 lg:col-start-8">
          <Bottle
            src={item.bottleSrc ?? item.artworkSrc}
            alt={item.artworkAlt}
            tint={item.accentColor}
            sizes="(min-width: 1024px) 40vw, 80vw"
            className="mx-auto max-w-[26rem]"
          />
        </div>
      </div>
    </section>
  );
}

function Specs({ item, onDark = false }: { item: CatalogItem; onDark?: boolean }) {
  const line = onDark ? "border-cream/25" : "border-ink/25";
  const muted = onDark ? "text-cream/85" : "text-muted";
  return (
    <dl className={`mt-10 grid grid-cols-2 gap-y-5 border-y ${line} py-6 sm:grid-cols-4`}>
      <div>
        <dt className={`text-sm ${muted}`}>Graduación</dt>
        <dd className="tabular mt-1 font-display text-2xl font-bold">{formatAbv(item.abvTenths)}</dd>
      </div>
      <div>
        <dt className={`text-sm ${muted}`}>Volumen</dt>
        <dd className="tabular mt-1 font-display text-2xl font-bold">{item.volumeMl} ml</dd>
      </div>
      <div>
        <dt className={`text-sm ${muted}`}>Servir a</dt>
        <dd className="tabular mt-1 font-display text-2xl font-bold">{item.serviceTemperature ?? "—"}</dd>
      </div>
      <div>
        <dt className={`text-sm ${muted}`}>Precio</dt>
        <dd className="tabular mt-1 whitespace-nowrap font-display text-xl font-bold sm:text-2xl">
          {item.priceUyu > 0 ? formatUyu(item.priceUyu) : "Por confirmar"}
        </dd>
      </div>
    </dl>
  );
}

function Footer({ item, onDark = false }: { item: CatalogItem; onDark?: boolean }) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-6">
      <AvailabilityBadge item={item} onDark={onDark} />
      <Link href={`/cervezas/${item.slug}`} className="inline-flex items-center gap-2 font-semibold underline decoration-1 underline-offset-[6px] hover:decoration-2">
        Descubrir cerveza
        <Arrow />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const catalog = await listCatalog();
  const featured = catalog.find((p) => p.isFeatured) ?? catalog[0];
  const citrus = catalog.find((p) => p.slug === "citrus-ipa");
  const midnvght = catalog.find((p) => p.slug === "midnvght");

  return (
    <>
      {/* Hero: la frase de marca y las botellas, sobre el mismo fondo oscuro de las fotos. */}
      <section aria-label="Presentación" className="grid lg:grid-cols-12">
        <div className="mx-auto flex max-w-7xl flex-col justify-center px-5 pb-16 pt-14 sm:px-8 lg:col-span-7 lg:px-12 lg:py-28">
          <Tagline as="h1" className="reveal max-w-[11ch] text-[clamp(3.5rem,10vw,8.5rem)]" />

          <p className="reveal mt-10 max-w-md text-lg leading-relaxed text-muted" style={{ ["--delay" as string]: "200ms" }}>
            Cerveza artesanal independiente, hecha en Trinidad, Flores. Ingredientes, curiosidad y cuidado en cada
            detalle: el resultado habla por sí solo.
          </p>

          <div className="reveal mt-10 flex flex-wrap items-center gap-x-8 gap-y-5" style={{ ["--delay" as string]: "300ms" }}>
            <Link href="/cervezas" className="btn btn-primary">
              Explorar cervezas
            </Link>
            <Link href="/nuestra-filosofia" className="inline-flex items-center gap-2 font-semibold underline decoration-1 underline-offset-[6px] hover:decoration-2">
              Conocer la filosofía
              <Arrow />
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[32rem] items-end justify-center overflow-hidden bg-brown px-5 pt-14 sm:min-h-[40rem] lg:col-span-5">
          {featured && (
            <div className="relative h-[26rem] w-full max-w-[26rem] sm:h-[34rem]">
              {citrus && (
                <img
                  src={citrus.bottleSrc ?? "/brand/citrus-ipa-bottle.webp"}
                  alt=""
                  aria-hidden="true"
                  className="absolute bottom-6 left-0 h-[78%] w-auto opacity-95"
                />
              )}
              {midnvght && (
                <img
                  src={midnvght.bottleSrc ?? "/brand/midnvght-bottle.webp"}
                  alt=""
                  aria-hidden="true"
                  className="absolute bottom-6 right-0 h-[72%] w-auto opacity-95"
                />
              )}
              <img
                src={featured.bottleSrc ?? featured.artworkSrc}
                alt={featured.artworkAlt}
                className="absolute bottom-0 left-1/2 h-full w-auto -translate-x-1/2 drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]"
              />
            </div>
          )}
        </div>
      </section>

      {/* Origen: lo que la marca sí puede afirmar, tomado de su etiqueta. */}
      <section aria-labelledby="origen" className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-12 lg:px-12 lg:py-36">
        <div className="lg:col-span-7">
          <h2 id="origen" className="font-display text-5xl font-black leading-[1.02] sm:text-7xl">
            Hecha en Trinidad, Flores.
          </h2>
        </div>
        <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
          <p className="text-[1.0625rem] leading-relaxed text-muted">
            Cada cerveza de LA EME se piensa y se elabora en Trinidad, Flores. Elegimos los ingredientes con cuidado y
            preferimos mostrar lo que hacemos antes que contarlo.
          </p>
          <img src="/brand/lighthouse.webp" alt="" aria-hidden="true" className="mt-10 h-auto w-56 opacity-80" />
        </div>
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

      {/* Colección: cada variedad con su propia composición. */}
      <section aria-labelledby="coleccion" className="mx-auto max-w-7xl px-5 pt-24 sm:px-8 lg:px-12 lg:pt-36">
        <div className="flex items-end justify-between gap-6 border-b border-ink pb-6">
          <h2 id="coleccion" className="font-display text-5xl font-black sm:text-6xl">Cervezas</h2>
          <Link href="/cervezas" className="hidden items-center gap-2 font-semibold underline decoration-1 underline-offset-[6px] sm:inline-flex">
            Ver todas
            <Arrow />
          </Link>
        </div>
      </section>

      {catalog.length === 0 ? (
        <p className="mx-auto max-w-7xl px-5 py-24 text-muted sm:px-8 lg:px-12">Estamos preparando la colección. Volvé pronto.</p>
      ) : (
        catalog.map((item, i) => {
          if (i === 0) return <VarietyFeature key={item.id} item={item} />;
          if (isDarkHex(item.accentColor)) return <VarietyBand key={item.id} item={item} />;
          return <VarietyRow key={item.id} item={item} />;
        })
      )}

      {/* Cierre */}
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-5 pb-32 pt-24 text-center sm:px-8">
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
