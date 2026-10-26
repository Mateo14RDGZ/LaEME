import "dotenv/config";
/**
 * Siembra el catálogo, las opciones de envío y los ajustes del sitio.
 *
 * Es idempotente. Al re-ejecutarlo:
 *  - el contenido editorial (textos, notas, arte) se actualiza desde src/data/catalog.seed.ts;
 *  - precio, estado, stock, envíos habilitados y ajustes del sitio NO se pisan.
 */
import { db } from "../src/lib/db.ts";
import { productSeeds, retiredSlugs, shippingSeeds, siteSettingKeys } from "../src/data/catalog.seed.ts";

async function main() {
  for (const seed of productSeeds) {
    const content = {
      name: seed.name,
      style: seed.style,
      summary: seed.summary,
      description: seed.description,
      tastingNotes: seed.tastingNotes,
      ingredients: seed.ingredients,
      ingredientsVerified: seed.ingredientsVerified,
      abvTenths: seed.abvTenths,
      volumeMl: seed.volumeMl,
      accentColor: seed.accentColor,
      artworkSrc: seed.artworkSrc,
      artworkAlt: seed.artworkAlt,
      bottleSrc: seed.bottleSrc,
      serviceTemperature: seed.serviceTemperature,
      isFeatured: seed.isFeatured,
      sortOrder: seed.sortOrder,
    };
    await db.product.upsert({
      where: { slug: seed.slug },
      create: { slug: seed.slug, priceUyu: 0, stock: 0, status: "COMING_SOON", ...content },
      update: content,
    });
    console.log(`producto: ${seed.slug}`);
  }

  // Variedades fuera del catálogo público: borrador, sin aceptar pedidos.
  const retired = await db.product.updateMany({
    where: { slug: { in: [...retiredSlugs] } },
    data: { status: "DRAFT" },
  });
  console.log(`fuera del catálogo: ${retired.count}`);

  for (const shipping of shippingSeeds) {
    await db.shippingOption.upsert({
      where: { code: shipping.code },
      create: { ...shipping, priceUyu: 0, enabled: false },
      update: { label: shipping.label, isPickup: shipping.isPickup, sortOrder: shipping.sortOrder },
    });
    console.log(`envío: ${shipping.code}`);
  }

  for (const key of siteSettingKeys) {
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value: "" },
      update: {},
    });
  }
  console.log("ajustes del sitio: listos (vacíos hasta configurar)");

  await db.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
