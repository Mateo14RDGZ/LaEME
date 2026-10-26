import Link from "next/link";
import { Wordmark } from "../brand/wordmark";
import { BRAND_TAGLINE } from "../brand/tagline";
import { RESPONSIBLE_CONSUMPTION_MESSAGE } from "@/config/business";

type FooterSettings = Record<string, string>;

/** Pie de página. Contacto y redes salen de los ajustes del sitio: vacíos no se muestran. */
export function SiteFooter({ settings }: { settings: FooterSettings }) {
  const email = settings["contact.email"];
  const phone = settings["contact.phone"];
  const whatsapp = settings["contact.whatsapp"];
  const instagram = settings["social.instagram"];
  const facebook = settings["social.facebook"];
  const hasContact = Boolean(email || phone || whatsapp);

  return (
    <footer className="mt-32 bg-brown text-cream">
      <div className="mx-auto grid max-w-7xl gap-16 px-5 py-20 sm:px-8 md:grid-cols-12 lg:px-12">
        <div className="md:col-span-4">
          <Wordmark size="sm" withEmblem className="items-start" />
          <p className="font-display mt-10 max-w-xs text-3xl font-black uppercase leading-[1.05]">{BRAND_TAGLINE}</p>
        </div>

        <nav aria-label="Pie de página" className="grid gap-12 sm:grid-cols-2 md:col-span-4 md:col-start-6">
          <div>
            <h2 className="text-base font-semibold text-gold">Explorar</h2>
            <ul className="mt-5 space-y-3">
              <li><Link className="hover:underline" href="/cervezas">Cervezas</Link></li>
              <li><Link className="hover:underline" href="/nuestra-filosofia">Nuestra filosofía</Link></li>
              <li><Link className="hover:underline" href="/carrito">Carrito</Link></li>
              <li><Link className="hover:underline" href="/contacto">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gold">Información</h2>
            <ul className="mt-5 space-y-3">
              <li><Link className="hover:underline" href="/envios">Envíos y devoluciones</Link></li>
              <li><Link className="hover:underline" href="/privacidad">Privacidad</Link></li>
              <li><Link className="hover:underline" href="/terminos">Términos</Link></li>
            </ul>
          </div>
        </nav>

        <div className="md:col-span-3 md:col-start-10">
          <h2 className="text-base font-semibold text-gold">Contacto</h2>
          <div className="mt-5">
            {hasContact ? (
              <ul className="space-y-3">
                {email && <li><a className="hover:underline" href={`mailto:${email}`}>{email}</a></li>}
                {phone && <li><a className="hover:underline" href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></li>}
                {whatsapp && <li>WhatsApp: {whatsapp}</li>}
              </ul>
            ) : (
              <p className="text-cream/85">Datos de contacto a configurar por el operador.</p>
            )}
          </div>
          {(instagram || facebook) && (
            <ul className="mt-6 flex gap-6">
              {instagram && <li><a className="hover:underline" href={instagram} rel="noopener noreferrer" target="_blank">Instagram</a></li>}
              {facebook && <li><a className="hover:underline" href={facebook} rel="noopener noreferrer" target="_blank">Facebook</a></li>}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-cream/20">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-cream/85 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <p>© {new Date().getFullYear()} LA EME · Cerveza artesanal independiente, hecha en Uruguay.</p>
          <p className="text-gold">{RESPONSIBLE_CONSUMPTION_MESSAGE}</p>
        </div>
      </div>
    </footer>
  );
}
