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
  accentColor: string;
  artworkSrc: string;
  artworkAlt: string;
  isFeatured: boolean;
  sortOrder: number;
};

export const productSeeds: ProductSeed[] = [
  {
    slug: "tropical-haze",
    name: "Tropical Haze",
    style: "IPA de mango & maracuyá",
    summary: "Una IPA turbia y aromática que combina lúpulo con mango y maracuyá.",
    description:
      "Combina el carácter lupulado con la intensidad tropical del mango y el maracuyá. Cerveza artesanal uruguaya, hecha para compartir buenos momentos.",
    tastingNotes: ["Mango maduro", "Maracuyá", "Lúpulo tropical"],
    ingredients: ["Malta pilsen", "Trigo", "Avena", "Lúpulos Citra y Mosaic", "Mango", "Maracuyá"],
    ingredientsVerified: false,
    abvTenths: 58,
    volumeMl: 330,
    accentColor: "#C87927",
    artworkSrc: "/products/tropical-haze-label.webp",
    artworkAlt: "Etiqueta de Tropical Haze con mango y maracuyá ilustrados sobre fondo amarillo",
    isFeatured: true,
    sortOrder: 1,
  },
  {
    slug: "citrus-ipa",
    name: "Citrus IPA",
    style: "IPA cítrica y lupulada",
    summary: "Lúpulo en primer plano con notas cítricas.",
    description:
      "Una IPA de carácter lupulado y notas cítricas frescas, para quienes disfrutan del lúpulo al frente.",
    tastingNotes: ["Cítrico", "Lúpulo"],
    ingredients: [],
    ingredientsVerified: false,
    abvTenths: 60,
    volumeMl: 330,
    accentColor: "#52633B",
    artworkSrc: "/products/citrus-ipa-label.webp",
    artworkAlt: "Etiqueta de Citrus IPA con lima y conos de lúpulo en verdes",
    isFeatured: false,
    sortOrder: 2,
  },
  {
    slug: "midnight",
    name: "Midnight",
    style: "Stout de café & chocolate",
    summary: "Un stout tostado en el que el café y el chocolate construyen el cuerpo.",
    description:
      "Tonos tostados y oscuros. El café y el chocolate son protagonistas de una cerveza para la noche.",
    tastingNotes: ["Café", "Chocolate", "Tostado"],
    ingredients: [],
    ingredientsVerified: false,
    abvTenths: 65,
    volumeMl: 330,
    accentColor: "#38271D",
    artworkSrc: "/products/midnight-label.webp",
    artworkAlt: "Etiqueta de Midnight con granos de café y cacao en tonos marrones",
    isFeatured: false,
    sortOrder: 3,
  },
  {
    slug: "golden",
    name: "Golden",
    style: "Lager clásica",
    summary: "Una lager dorada de trago limpio para el día a día.",
    description:
      "Una lager clásica de tonos dorados, pensada para acompañar cualquier momento.",
    tastingNotes: ["Maltas claras", "Trago limpio"],
    ingredients: [],
    ingredientsVerified: false,
    abvTenths: 48,
    volumeMl: 330,
    accentColor: "#D9A72E",
    artworkSrc: "/products/golden-label.webp",
    artworkAlt: "Etiqueta de Golden con espigas de trigo en tonos dorados",
    isFeatured: false,
    sortOrder: 4,
  },
  {
    slug: "berry-sour",
    name: "Berry Sour",
    style: "Sour con frutos rojos",
    summary: "Ácida y frutal, con la intensidad de los frutos rojos.",
    description:
      "Una cerveza ácida con la intensidad de los frutos rojos, para quienes buscan algo distinto.",
    tastingNotes: ["Frutos rojos", "Acidez"],
    ingredients: [],
    ingredientsVerified: false,
    abvTenths: 52,
    volumeMl: 330,
    accentColor: "#8F3535",
    artworkSrc: "/products/berry-sour-label.webp",
    artworkAlt: "Etiqueta de Berry Sour con frutos rojos y hojas en bordó",
    isFeatured: false,
    sortOrder: 5,
  },
];

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
