import Link from "next/link";
import { Wordmark } from "../brand/wordmark";
import { BRAND_TAGLINE } from "../brand/tagline";
import { RESPONSIBLE_CONSUMPTION_MESSAGE } from "@/config/business";

type FooterSettings = Record<string, string>;

const LEGAL_LINKS = [
  { href: "/envios", label: "Envíos y devoluciones" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/terminos", label: "Términos" },
] as const;

/** Pie de página. Contacto y redes salen de los ajustes del sitio: vacíos no se muestran. */
export function SiteFooter({ settings }: { settings: FooterSettings }) {
  const email = settings["contact.email"];
  const phone = settings["contact.phone"];
  const whatsapp = settings["contact.whatsapp"];
  const instagram = settings["social.instagram"];
  const facebook = settings["social.facebook"];
  const hasSocial = Boolean(instagram || facebook);

  return (
    <footer className="mt-24 border-t border-ink bg-brown text-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-12 lg:px-10">
        <div className="md:col-span-5">
          <Wordmark size="sm" withEmblem className="items-start" />
          <p className="font-display mt-8 max-w-sm text-3xl font-black uppercase leading-tight">
            {BRAND_TAGLINE}
          </p>
        </div>

        <nav aria-label="Pie de página" className="md:col-span-3">
          <h2 className="label-caps mb-4 text-[0.75rem] text-gold">Explorar</h2>
          <ul className="space-y-3">
            <li><Link className="hover:text-gold" href="/cervezas">Cervezas</Link></li>
            <li><Link className="hover:text-gold" href="/nuestra-filosofia">Nuestra filosofía</Link></li>
            <li><Link className="hover:text-gold" href="/carrito">Carrito</Link></li>
            <li><Link className="hover:text-gold" href="/contacto">Contacto</Link></li>
          </ul>
          <h2 className="label-caps mb-4 mt-10 text-[0.75rem] text-gold">Legal</h2>
          <ul className="space-y-3">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}><Link className="hover:text-gold" href={l.href}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="label-caps mb-4 text-[0.75rem] text-gold">Contacto</h2>
          <ul className="space-y-3 text-cream/90">
            {email && <li><a className="hover:text-gold" href={`mailto:${email}`}>{email}</a></li>}
            {phone && <li><a className="hover:text-gold" href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></li>}
            {whatsapp && <li>WhatsApp: {whatsapp}</li>}
            {!email && !phone && !whatsapp && (
              <li className="text-cream/60">Datos de contacto a configurar por el operador.</li>
            )}
          </ul>
          {hasSocial && (
            <>
              <h2 className="label-caps mb-4 mt-10 text-[0.75rem] text-gold">Redes</h2>
              <ul className="flex gap-6">
                {instagram && <li><a className="hover:text-gold" href={instagram} rel="noopener noreferrer" target="_blank">Instagram</a></li>}
                {facebook && <li><a className="hover:text-gold" href={facebook} rel="noopener noreferrer" target="_blank">Facebook</a></li>}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-cream/20">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-cream/75 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>© {new Date().getFullYear()} LA EME · Cerveza artesanal independiente, hecha en Uruguay.</p>
          <p className="label-caps text-[0.7rem] text-gold">{RESPONSIBLE_CONSUMPTION_MESSAGE}</p>
        </div>
      </div>
    </footer>
  );
}
