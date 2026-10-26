import Image from "next/image";

type BeerArtworkProps = {
  src: string;
  alt: string;
  accentColor: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Arte de la cerveza sobre un fondo tintado con su color de acento.
 * Usa la etiqueta oficial mientras no existan fotos de producto.
 */
export function BeerArtwork({ src, alt, accentColor, sizes, priority = false, className = "" }: BeerArtworkProps) {
  return (
    <div
      className={`relative aspect-square overflow-hidden ${className}`}
      style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 14%, var(--color-cream))` }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain p-[6%] transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-translate-y-1.5 group-hover:scale-[1.02]"
      />
    </div>
  );
}
