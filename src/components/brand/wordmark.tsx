import Link from "next/link";
import { LaEmeEmblem } from "./emblem";

type WordmarkProps = {
  size?: "sm" | "lg";
  withEmblem?: boolean;
  href?: string;
  className?: string;
};

/** Wordmark "LA EME" (tipografía display) con el símbolo M debajo, como en la etiqueta. */
export function Wordmark({ size = "sm", withEmblem = false, href = "/", className = "" }: WordmarkProps) {
  const big = size === "lg";
  const content = (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span
        className={`font-display font-black tracking-[0.02em] ${big ? "text-[clamp(4.5rem,15vw,11rem)]" : "text-2xl"}`}
      >
        LA
        <br />
        EME
      </span>
      {withEmblem && (
        <LaEmeEmblem className={`mt-2 ${big ? "h-12 w-20" : "h-5 w-8"}`} title="" />
      )}
    </span>
  );

  return (
    <Link href={href} aria-label="LA EME, ir al inicio" className="inline-block">
      {content}
    </Link>
  );
}
