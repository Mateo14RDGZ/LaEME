/** URL pública del sitio, validada desde el entorno. Sin barra final. */
export function siteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(raw.replace(/\/$/, ""));
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}
