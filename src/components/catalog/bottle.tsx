import Image from "next/image";

type BottleProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Fondo de la escena: color de acento de la variedad, suavizado. */
  tint: string;
  className?: string;
};

/**
 * Botella de LA EME sobre una escena tintada con el color de su variedad.
 * El fondo es plano (sin degradados): la luz la pone la foto, no el CSS.
 */
export function Bottle({ src, alt, sizes, priority = false, tint, className = "" }: BottleProps) {
  return (
    <div
      className={`relative aspect-[4/5] overflow-hidden ${className}`}
      style={{ backgroundColor: `color-mix(in srgb, ${tint} 16%, var(--color-cream))` }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain px-[14%] py-[6%] transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:-translate-y-2"
      />
    </div>
  );
}
