/** true si el color de acento es oscuro: decide si la tarjeta va en marrón con texto crema. */
export function isDarkHex(hex: string): boolean {
  const h = hex.replace("#", "");
  const channel = (start: number) => parseInt(h.slice(start, start + 2), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(channel(0)) + 0.7152 * lin(channel(2)) + 0.0722 * lin(channel(4));
  return luminance < 0.18;
}
