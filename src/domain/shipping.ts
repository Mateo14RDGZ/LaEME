import { DomainError } from "./errors.ts";

export const URUGUAY_DEPARTMENTS = [
  "Artigas",
  "Canelones",
  "Cerro Largo",
  "Colonia",
  "Durazno",
  "Flores",
  "Florida",
  "Lavalleja",
  "Maldonado",
  "Montevideo",
  "Paysandú",
  "Río Negro",
  "Rivera",
  "Rocha",
  "Salto",
  "San José",
  "Soriano",
  "Tacuarembó",
  "Treinta y Tres",
] as const;

export type ShippingOptionForCheckout = {
  code: string;
  label: string;
  priceUyu: number;
  enabled: boolean;
  isPickup: boolean;
  /** Lista vacía = cubre todo el país (el operador debe confirmarlo). */
  departments: string[];
};

export type ResolvedShipping = {
  code: string;
  label: string;
  priceUyu: number;
  isPickup: boolean;
};

/**
 * Resuelve la opción de envío elegida, validando que esté habilitada y cubra la zona.
 * El costo siempre sale de la configuración del servidor.
 */
export function resolveShipping(
  options: ShippingOptionForCheckout[],
  code: string,
  department: string | undefined,
): ResolvedShipping {
  const option = options.find((o) => o.code === code && o.enabled);
  if (!option) {
    throw new DomainError("La opción de envío elegida no está disponible.", {
      issues: [{ code: "shipping_unavailable", message: "Opción de envío no disponible", field: "shippingCode" }],
    });
  }

  if (!option.isPickup) {
    const covered = option.departments.length === 0 || (department !== undefined && option.departments.includes(department));
    if (!covered) {
      throw new DomainError("Esta opción de envío no cubre el departamento elegido.", {
        issues: [{ code: "zone_not_covered", message: "Zona no cubierta", field: "department" }],
      });
    }
  }

  return {
    code: option.code,
    label: option.label,
    priceUyu: option.priceUyu,
    isPickup: option.isPickup,
  };
}

/** Opciones que el cliente puede elegir para un departamento dado (o para retiro). */
export function shippingOptionsFor(
  options: ShippingOptionForCheckout[],
  department: string | undefined,
): ShippingOptionForCheckout[] {
  return options.filter(
    (o) =>
      o.enabled &&
      (o.isPickup ||
        o.departments.length === 0 ||
        (department !== undefined && o.departments.includes(department))),
  );
}
