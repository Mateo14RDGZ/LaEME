import type { Metadata } from "next";
import { RESPONSIBLE_CONSUMPTION_MESSAGE, MIN_AGE_YEARS } from "@/config/business";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Condiciones de uso del sitio y de compra de LA EME.",
  alternates: { canonical: "/terminos" },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 pb-24 pt-14 sm:px-6">
      <h1 className="font-display text-[clamp(3rem,8vw,5.5rem)] font-black leading-[0.92]">Términos</h1>
      <div className="border-l-2 border-gold bg-gold/10 p-4 text-sm">
        Documento provisorio. Debe ser revisado por asesoría legal antes de vender, incluyendo requisitos de venta de
        alcohol, etiquetado, impuestos y defensa del consumidor en Uruguay.
      </div>
      <section className="space-y-3 leading-relaxed">
        <h2 className="font-display text-2xl font-bold">Venta a mayores</h2>
        <p>La venta está restringida a personas mayores de {MIN_AGE_YEARS} años. Al comprar declarás cumplir esa condición.</p>
      </section>
      <section className="space-y-3 leading-relaxed">
        <h2 className="font-display text-2xl font-bold">Precios y pagos</h2>
        <p>Los precios se expresan en pesos uruguayos (UYU) e incluyen los impuestos que correspondan según la configuración vigente. El total se confirma al crear el pedido.</p>
      </section>
      <section className="space-y-3 leading-relaxed">
        <h2 className="font-display text-2xl font-bold">Disponibilidad</h2>
        <p>Un pedido queda confirmado solo cuando el pago es aprobado. Las unidades se reservan por un tiempo limitado mientras se completa el pago.</p>
      </section>
      <section className="space-y-3 leading-relaxed">
        <h2 className="font-display text-2xl font-bold">Consumo responsable</h2>
        <p>{RESPONSIBLE_CONSUMPTION_MESSAGE}</p>
      </section>
    </article>
  );
}
