/**
 * La frase de marca. Siempre en este texto exacto; no traducir, acortar ni reemplazar.
 */
export const BRAND_TAGLINE = "QUE HABLE LO QUE HACEMOS.";

type TaglineProps = {
  as?: "h1" | "p" | "h2";
  className?: string;
};

export function Tagline({ as: Tag = "p", className = "" }: TaglineProps) {
  return (
    <Tag className={`font-display font-black uppercase leading-[0.92] tracking-[-0.01em] ${className}`}>
      {BRAND_TAGLINE}
    </Tag>
  );
}
