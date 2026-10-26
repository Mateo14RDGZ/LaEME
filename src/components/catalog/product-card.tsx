import Link from "next/link";
import type { CatalogItem } from "@/data/queries";
import { formatAbv, formatUyu } from "@/lib/money";
import { AvailabilityBadge } from "./availability";
import { BeerArtwork } from "./beer-artwork";

type ProductCardProps = {
  item: CatalogItem;
  /** Variante asimétrica para el ritmo del catálogo. */
  tall?: boolean;
  priority?: boolean;
};

export function ProductCard({ item, tall = false, priority = false }: ProductCardProps) {
  return (
    <article className={`group flex flex-col ${tall ? "md:mt-16" : ""}`}>
      <Link
        href={`/cervezas/${item.slug}`}
        className="block focus-visible:outline-offset-4"
        aria-label={`Ver ${item.name}, ${item.style}`}
      >
        <BeerArtwork
          src={item.artworkSrc}
          alt={item.artworkAlt}
          accentColor={item.accentColor}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          priority={priority}
        />
      </Link>

      <div className="mt-5 flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-3xl font-black leading-none">
              <Link href={`/cervezas/${item.slug}`} className="hover:underline decoration-2 underline-offset-4">
                {item.name}
              </Link>
            </h3>
            <p className="label-caps mt-2 text-[0.75rem]" style={{ color: item.accentColor }}>
              {item.style}
            </p>
          </div>
          <AvailabilityBadge item={item} />
        </div>

        <p className="text-[0.95rem] leading-relaxed text-ink/80">{item.summary}</p>

        <dl className="mt-auto flex flex-wrap gap-x-6 gap-y-1 border-t border-ink/20 pt-3 text-sm">
          <div className="flex gap-1.5">
            <dt className="sr-only">Graduación</dt>
            <dd className="font-semibold">{formatAbv(item.abvTenths)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="sr-only">Volumen</dt>
            <dd>{item.volumeMl} ml</dd>
          </div>
          <div className="ml-auto flex gap-1.5">
            <dt className="sr-only">Precio</dt>
            <dd className="font-semibold">{item.priceUyu > 0 ? formatUyu(item.priceUyu) : "Consultar"}</dd>
          </div>
        </dl>

        <Link
          href={`/cervezas/${item.slug}`}
          className="label-caps mt-1 inline-flex w-fit items-center gap-2 text-[0.8rem] underline decoration-1 underline-offset-[6px] hover:decoration-2"
        >
          Descubrir cerveza
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
