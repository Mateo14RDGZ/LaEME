"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../cart/cart-provider";
import { LaEmeEmblem } from "../brand/emblem";

const NAV = [
  { href: "/cervezas", label: "Cervezas" },
  { href: "/nuestra-filosofia", label: "Nuestra filosofía" },
  { href: "/contacto", label: "Contacto" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count, hydrated } = useCart();

  // Cierra el menú móvil al navegar.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-cream/95 backdrop-blur-[2px]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <Link href="/" aria-label="LA EME, ir al inicio" className="flex items-center gap-3">
          <span className="font-display text-2xl font-black leading-[0.85] tracking-tight">
            LA
            <br />
            EME
          </span>
          <LaEmeEmblem className="hidden h-5 w-8 sm:block" title="" />
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="label-caps relative py-2 text-[0.8rem] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-300 hover:after:scale-x-100"
                  aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/carrito"
            className="relative inline-flex h-11 min-w-11 items-center justify-center gap-2 px-2 label-caps text-[0.8rem] hover:text-orange"
            aria-label={`Carrito, ${hydrated ? count : 0} ${count === 1 ? "producto" : "productos"}`}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 7h16l-1.4 12.2a1 1 0 0 1-1 .8H6.4a1 1 0 0 1-1-.8L4 7z" />
              <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
            </svg>
            <span className="hidden sm:inline">Carrito</span>
            {hydrated && count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 font-body text-[0.7rem] font-bold text-cream"
              >
                {count}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center md:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3.5 w-6" aria-hidden="true">
              <span className={`absolute left-0 right-0 top-0 h-px bg-ink transition-transform duration-300 ${open ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`absolute left-0 right-0 bottom-0 h-px bg-ink transition-transform duration-300 ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      <nav
        id="menu-movil"
        aria-label="Móvil"
        hidden={!open}
        className="border-t border-ink/15 bg-cream md:hidden"
      >
        <ul className="mx-auto max-w-7xl px-4 py-2">
          {NAV.map((item) => (
            <li key={item.href} className="border-b border-ink/10 last:border-0">
              <Link href={item.href} className="font-display flex min-h-14 items-center text-2xl font-bold">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
