import Link from "next/link";
import type { CatalogItem } from "@/data/queries";
import { formatAbv, formatUyu } from "@/lib/money";
import { Arrow } from "@/components/ui/arrow";
import { AvailabilityBadge } from "./availability";
import { BeerArtwork } from "./beer-artwork";

type ProductCardProps = {
  item: CatalogItem;
  /** Desplaza la tarjeta para un ritmo asimétrico en la grilla. */
  tall?: boolean;
  priority?: boolean;
};

export function ProductCard({ item, tall = false, priority = false }: ProductCardProps) {
  return (
    <article className={`group flex flex-col ${tall ? "sm:mt-20" : ""}`}>
      <Link href={`/cervezas/${item.slug}`} className="block" aria-label={`Ver ${item.name}, ${item.style}`}>
        <BeerArtwork
          src={item.artworkSrc}
          alt={item.artworkAlt}
          accentColor={item.accentColor}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          priority={priority}
        />
      </Link>

      <div className="mt-6 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-[2rem] font-black leading-none">
              <Link href={`/cervezas/${item.slug}`} className="hover:underline decoration-2 underline-offset-4">
                {item.name}
              </Link>
            </h3>
            <p className="mt-2 text-[0.9375rem] text-muted">{item.style}</p>
          </div>
          <AvailabilityBadge item={item} />
        </div>

        <p className="mt-4 leading-relaxed">{item.summary}</p>

        <dl className="tabular mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink/20 pt-4 text-[0.9375rem]">
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
            <dd className="font-semibold">{item.priceUyu > 0 ? formatUyu(item.priceUyu) : "Por confirmar"}</dd>
          </div>
        </dl>

        <Link href={`/cervezas/${item.slug}`} className="mt-6 inline-flex w-fit items-center gap-2 font-semibold underline decoration-1 underline-offset-[6px] hover:decoration-2">
          Descubrir cerveza
          <Arrow />
        </Link>
      </div>
    </article>
  );
}
