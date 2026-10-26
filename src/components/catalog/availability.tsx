import type { CatalogItem } from "@/data/queries";

type Status = CatalogItem["status"];

const LABELS: Record<Status, string> = {
  DRAFT: "Borrador",
  COMING_SOON: "En desarrollo",
  AVAILABLE: "Disponible",
  SOLD_OUT: "Agotada",
  DISCONTINUED: "Discontinuada",
};

/** Estado comercial visible. Nunca afirma stock ni envío inmediato sin configurarlo. */
export function AvailabilityBadge({
  item,
  onDark = false,
}: {
  item: Pick<CatalogItem, "status" | "purchasable" | "priceUyu">;
  onDark?: boolean;
}) {
  let label = LABELS[item.status];
  let tone = "border-ink text-ink";

  if (item.status === "AVAILABLE" && item.priceUyu <= 0) {
    label = "Precio por confirmar";
    tone = "border-ink/60 text-muted";
  } else if (item.status === "AVAILABLE" && item.purchasable) {
    tone = "border-olive text-olive";
  } else if (item.status === "AVAILABLE") {
    label = "Agotada por ahora";
    tone = "border-burgundy text-burgundy";
  } else if (item.status === "SOLD_OUT") {
    tone = "border-burgundy text-burgundy";
  }

  if (onDark) tone = "border-cream/70 text-cream";

  return (
    <span className={`label-caps inline-flex items-center border px-2.5 py-1 text-[0.7rem] ${tone}`}>
      {label}
    </span>
  );
}
