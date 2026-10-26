import type { Metadata } from "next";
import Link from "next/link";
import { Tagline } from "@/components/brand/tagline";
import { LaEmeEmblem } from "@/components/brand/emblem";

export const metadata: Metadata = {
  title: "Nuestra filosofía",
  description: "Cómo pensamos LA EME: intención, curiosidad, ingredientes y una cerveza que habla por sí sola.",
  alternates: { canonical: "/nuestra-filosofia" },
};

const VALUES = [
  {
    title: "Atención al detalle",
    body: "Una cerveza se juega en los pequeños pasos: la molienda, el lúpulo en el momento justo, la temperatura de servicio. Nos importan todos.",
  },
  {
    title: "Curiosidad y experimentación",
    body: "Nos gusta probar lo que nos despierta preguntas. Algunas ideas se quedan, otras no, y las dos cosas nos enseñan.",
  },
  {
    title: "Ingredientes y sabor",
    body: "El mango, el maracuyá, el café o el cítrico no son adornos. Son la razón de cada cerveza y los nombramos sin rodeos.",
  },
  {
    title: "Identidad independiente",
    body: "Hacemos lo que creemos, a nuestro ritmo, sin fórmulas prestadas. Independiente significa decidir cada cosa nosotros.",
  },
  {
    title: "Compartir un buen momento",
    body: "Una cerveza se termina en una mesa, con alguien enfrente. Pensamos cada lata y cada botella para eso.",
  },
] as const;

export default function PhilosophyPage() {
  return (
    <article className="mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 lg:px-10">
      <header className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="label-caps text-[0.78rem]">Nuestra filosofía</p>
          <h1 className="font-display mt-4 text-[clamp(3rem,8vw,6.5rem)] font-black leading-[0.92]">
            Preferimos mostrar lo que hacemos.
          </h1>
        </div>
        <div className="flex items-end lg:col-span-4 lg:justify-end">
          <LaEmeEmblem className="h-16 w-28 text-ink" title="" />
        </div>
      </header>

      <div className="mt-16 max-w-2xl space-y-6 text-xl leading-relaxed text-ink/90">
        <p>
          No necesitamos prometer demasiado. El producto, los ingredientes, el oficio y el cuidado en cada detalle
          hablan por sí solos.
        </p>
        <Tagline className="text-3xl leading-snug tracking-normal" />
      </div>

      <ol className="mt-20 grid gap-x-10 gap-y-14 border-t border-ink pt-14 md:grid-cols-2 lg:grid-cols-3">
        {VALUES.map((v, i) => (
          <li key={v.title}>
            <p className="label-caps text-[0.75rem] text-orange">{String(i + 1).padStart(2, "0")}</p>
            <h2 className="font-display mt-3 text-3xl font-bold leading-tight">{v.title}</h2>
            <p className="mt-4 leading-relaxed text-ink/85">{v.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-24 flex flex-wrap items-center gap-6 border-t border-ink pt-12">
        <Link href="/cervezas" className="btn btn-primary">Conocer las cervezas</Link>
        <Link href="/contacto" className="label-caps text-[0.8rem] underline underline-offset-[6px]">Escribinos</Link>
      </div>
    </article>
  );
}
