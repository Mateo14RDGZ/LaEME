import type { Metadata } from "next";
import { getSiteSettings } from "@/data/queries";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacto de LA EME. Datos de contacto y redes configurables por el operador.",
  alternates: { canonical: "/contacto" },
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const s = await getSiteSettings();
  const rows: { label: string; value: string | undefined; href?: string }[] = [
    { label: "Email", value: s["contact.email"], href: s["contact.email"] ? `mailto:${s["contact.email"]}` : undefined },
    { label: "Teléfono", value: s["contact.phone"], href: s["contact.phone"] ? `tel:${s["contact.phone"]!.replace(/\s/g, "")}` : undefined },
    { label: "WhatsApp", value: s["contact.whatsapp"] },
    { label: "Dirección", value: s["contact.address"] },
    { label: "Instagram", value: s["social.instagram"], href: s["social.instagram"] },
    { label: "Facebook", value: s["social.facebook"], href: s["social.facebook"] },
  ];
  const configured = rows.filter((r) => r.value);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-14 sm:px-6 lg:px-10">
      <p className="label-caps text-[0.78rem]">Contacto</p>
      <h1 className="font-display mt-4 text-[clamp(3rem,8vw,6rem)] font-black leading-[0.92]">Hablemos.</h1>
      <p className="mt-6 max-w-xl text-lg text-ink/85">
        Para consultas sobre pedidos, envíos o la cerveza, escribinos por los canales de abajo.
      </p>

      <section aria-labelledby="canales" className="mt-14 border-t border-ink pt-8">
        <h2 id="canales" className="sr-only">Canales</h2>
        {configured.length === 0 ? (
          <p className="text-ink/80">
            Los datos de contacto todavía no están publicados. El operador debe cargarlos en los ajustes del sitio.
          </p>
        ) : (
          <dl className="divide-y divide-ink/20">
            {configured.map((r) => (
              <div key={r.label} className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr]">
                <dt className="label-caps text-[0.75rem]">{r.label}</dt>
                <dd className="text-lg">
                  {r.href ? (
                    <a href={r.href} className="underline underline-offset-4 hover:text-orange" rel="noopener noreferrer">
                      {r.value}
                    </a>
                  ) : (
                    r.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  );
}
