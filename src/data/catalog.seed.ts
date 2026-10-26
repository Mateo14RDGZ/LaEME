/**
 * Catálogo semilla de LA EME.
 *
 * Fuente de contenido de las cervezas. `npm run db:seed` lo vuelca a la base de datos.
 * Al volver a correr el seed solo se actualizan textos y arte; precio, estado, stock
 * y envíos los administra el operador en la base y nunca se pisan.
 *
 * ⚠️ Todas las notas de cata e ingredientes son provisorias y deben revisarse antes
 * de publicar. Los precios en 0 significan "no configurado": el producto no se puede comprar.
 */

export type ProductSeed = {
  slug: string;
  name: string;
  style: string;
  summary: string;
  description: string;
  tastingNotes: string[];
  ingredients: string[];
  ingredientsVerified: boolean;
  abvTenths: number;
  volumeMl: number;
  serviceTemperature: string;
  accentColor: string;
  artworkSrc: string;
  bottleSrc: string;
  artworkAlt: string;
  isFeatured: boolean;
  sortOrder: number;
};

/**
 * Textos y datos tomados de las etiquetas oficiales de LA EME.
 * Ingredientes y recetas quedan sin publicar hasta verificarlos (ingredientsVerified = false).
 */
export const productSeeds: ProductSeed[] = [
  {
    slug: "tropical-haze",
    name: "Tropical Haze",
    style: "IPA de mango y maracuyá",
    summary: "Una IPA turbia y aromática que combina lúpulo con mango y maracuyá.",
    description:
      "Combina el carácter lupulado con la intensidad tropical del mango y el maracuyá. Cerveza artesanal uruguaya, hecha para compartir buenos momentos.",
    tastingNotes: ["Mango", "Maracuyá"],
    ingredients: [],
    ingredientsVerified: false,
    abvTenths: 58,
    volumeMl: 330,
    serviceTemperature: "6–8 °C",
    accentColor: "#C87927",
    artworkSrc: "/products/tropical-haze-label.webp",
    bottleSrc: "/brand/tropical-haze-bottle.webp",
    artworkAlt: "Etiqueta de Tropical Haze con mango y maracuyá ilustrados sobre fondo amarillo",
    isFeatured: true,
    sortOrder: 1,
  },
  {
    slug: "citrus-ipa",
    name: "Citrus IPA",
    style: "IPA cítrica y lupulada",
    summary: "Una IPA fresca y equilibrada, con intensas notas de lima, pomelo y frutas tropicales.",
    description:
      "Elaborada con ingredientes seleccionados para un sabor vibrante y refrescante. Es la primera cerveza que LA EME desarrolla, y todavía está en fase de experimentación.",
    tastingNotes: ["Lima", "Pomelo", "Frutas tropicales"],
    ingredients: [],
    ingredientsVerified: false,
    abvTenths: 60,
    volumeMl: 330,
    serviceTemperature: "6–8 °C",
    accentColor: "#52633B",
    artworkSrc: "/products/citrus-ipa-label-large.webp",
    bottleSrc: "/brand/citrus-ipa-bottle.webp",
    artworkAlt: "Etiqueta de Citrus IPA con lúpulos, follaje y limas cortadas en verde",
    isFeatured: false,
    sortOrder: 2,
  },
  {
    slug: "midnvght",
    name: "Midnvght",
    style: "Stout de café y chocolate",
    summary: "Una stout intensa y sedosa, con notas de café, chocolate amargo y un tostado profundo.",
    description:
      "Equilibrada, con cuerpo y un final seco, ideal para quienes disfrutan de sabores intensos y complejos.",
    tastingNotes: ["Café", "Chocolate amargo", "Tostado profundo"],
    ingredients: [],
    ingredientsVerified: false,
    abvTenths: 65,
    volumeMl: 330,
    serviceTemperature: "8–10 °C",
    accentColor: "#38271D",
    artworkSrc: "/products/midnvght-label-large.webp",
    bottleSrc: "/brand/midnvght-bottle.webp",
    artworkAlt: "Etiqueta de Midnvght con granos de café, chocolate y cacao en tonos oscuros",
    isFeatured: false,
    sortOrder: 3,
  },
];

/**
 * Variedades que se retiran del catálogo público. No se borran: quedan como borrador
 * hasta que el responsable de la marca decida otra cosa.
 */
export const retiredSlugs = ["golden", "berry-sour", "midnight"] as const;

export type ShippingSeed = {
  code: string;
  label: string;
  isPickup: boolean;
  departments: string[];
  sortOrder: number;
};

/**
 * Opciones de entrega. Se siembran DESHABILITADAS y con precio 0: el operador
 * debe definir costos y zonas reales antes de aceptar pedidos.
 */
export const shippingSeeds: ShippingSeed[] = [
  { code: "retiro", label: "Retiro (punto a confirmar)", isPickup: true, departments: [], sortOrder: 1 },
  { code: "envio", label: "Envío a domicilio", isPickup: false, departments: [], sortOrder: 2 },
];

/** Claves de ajustes del sitio que se muestran en contacto y pie de página. Vacías hasta configurar. */
export const siteSettingKeys = [
  "contact.email",
  "contact.phone",
  "contact.whatsapp",
  "contact.address",
  "social.instagram",
  "social.facebook",
] as const;
