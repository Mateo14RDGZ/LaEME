/**
 * Montos en pesos uruguayos (UYU) como enteros.
 * UYU se opera sin centavos en este comercio, así que todo monto es un entero
 * y nunca se usan floats para sumar dinero.
 */

const uyuFormatter = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
  maximumFractionDigits: 0,
});

export function formatUyu(amount: number): string {
  return uyuFormatter.format(amount);
}

export function isValidAmount(amount: number): boolean {
  return Number.isSafeInteger(amount) && amount >= 0;
}

export function assertValidAmount(amount: number, label: string): void {
  if (!isValidAmount(amount)) {
    throw new Error(`Monto inválido en ${label}: ${amount}`);
  }
}

/** Formatea graduación alcohólica guardada en décimas (58 -> "5,8 %"). */
export function formatAbv(abvTenths: number): string {
  return `${(abvTenths / 10).toFixed(1).replace(".", ",")} %`;
}
