import type { Metadata, Viewport } from "next";
import { Oswald, Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-provider";
import { AgeGate } from "@/components/layout/age-gate";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSiteSettings } from "@/data/queries";
import { siteUrl } from "@/lib/site";

const displayFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display-family",
  display: "swap",
});

const labelFont = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-label-family",
  display: "swap",
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body-family",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "LA EME · Cerveza artesanal uruguaya",
    template: "%s · LA EME",
  },
  description:
    "LA EME es una cerveza artesanal independiente, hecha en Uruguay. QUE HABLE LO QUE HACEMOS.",
  applicationName: "LA EME",
  openGraph: {
    type: "website",
    locale: "es_UY",
    siteName: "LA EME",
    title: "LA EME · QUE HABLE LO QUE HACEMOS.",
    description: "Cerveza artesanal independiente, hecha en Uruguay.",
    images: ["/products/tropical-haze-label.webp"],
  },
  icons: {
    icon: "/favicon.svg",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f5ebd8",
  width: "device-width",
  initialScale: 1,
};

// Las páginas leen la base (catálogo, stock, ajustes): se renderizan en cada solicitud.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <html
      lang="es-UY"
      className={`${displayFont.variable} ${labelFont.variable} ${bodyFont.variable}`}
    >
      <body className="paper min-h-dvh antialiased">
        <CartProvider>
          <a href="#contenido" className="skip-link">
            Saltar al contenido
          </a>
          <AgeGate />
          <SiteHeader />
          <main id="contenido" className="min-h-[60dvh]">
            {children}
          </main>
          <SiteFooter settings={settings} />
        </CartProvider>
      </body>
    </html>
  );
}
