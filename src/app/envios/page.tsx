import type { Metadata } from "next";
import { listEnabledShipping } from "@/data/queries";
import { formatUyu } from "@/lib/money";

export const metadata: Metadata = {
  title: "Envíos y devoluciones",
  description: "Cómo funcionan los envíos y el retiro de LA EME, y nuestra política de devoluciones.",
  alternates: { canonical: "/envios" },
};

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const options = await listEnabledShipping();

  return (
    <article className="mx-auto max-w-3xl px-4 pb-24 pt-14 sm:px-6">
      <p className="label-caps text-[0.78rem]">Información</p>
      <h1 className="font-display mt-4 text-[clamp(3rem,8vw,5.5rem)] font-black leading-[0.92]">Envíos y devoluciones</h1>

      <div className="mt-6 border-l-2 border-gold bg-gold/10 p-4 text-sm">
        Texto provisorio. Las zonas, los costos y los plazos se configuran antes de vender y deben ser revisados por el operador.
      </div>

      <section className="mt-12 space-y-4" aria-labelledby="envios">
        <h2 id="envios" className="font-display text-3xl font-bold">Envíos y retiro</h2>
        <p className="leading-relaxed">
          Las opciones disponibles, su costo y las zonas que cubren se muestran en el checkout antes de pagar. Si una
          opción no cubre tu departamento, no aparece.
        </p>
        {options.length > 0 ? (
          <ul className="divide-y divide-ink/20 border-y border-ink/20">
            {options.map((o) => (
              <li key={o.code} className="flex justify-between gap-4 py-3">
                <span>{o.label}</span>
                <span className="tabular-nums">{o.priceUyu > 0 ? formatUyu(o.priceUyu) : "Sin costo"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink/75">Todavía no hay opciones de envío habilitadas.</p>
        )}
      </section>

      <section className="mt-12 space-y-4" aria-labelledby="devoluciones">
        <h2 id="devoluciones" className="font-display text-3xl font-bold">Devoluciones</h2>
        <p className="leading-relaxed">
          Si recibís un producto dañado o distinto al que compraste, escribinos dentro de un plazo razonable desde la
          entrega, con foto del producto y del número de pedido. Lo resolvemos caso por caso.
        </p>
        <p className="leading-relaxed text-ink/80">
          Por tratarse de bebidas alcohólicas, no aceptamos devoluciones por motivos de higiene una vez abierto el envase.
        </p>
      </section>
    </article>
  );
}
