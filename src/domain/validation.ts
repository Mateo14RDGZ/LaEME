import { z } from "zod";
import { MAX_LINES, MAX_UNITS_PER_LINE } from "./cart.ts";
import { URUGUAY_DEPARTMENTS } from "./shipping.ts";

const slugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Identificador de producto inválido");

export const cartLinesSchema = z
  .array(
    z.object({
      slug: slugSchema,
      quantity: z.number().int().min(1).max(MAX_UNITS_PER_LINE),
    }),
  )
  .min(1, "El carrito está vacío")
  .max(MAX_LINES)
  .refine((lines) => new Set(lines.map((l) => l.slug)).size === lines.length, {
    message: "Hay productos repetidos en el carrito",
  });

/** Teléfono uruguayo o internacional: solo dígitos y un + opcional, 8 a 15 dígitos. */
const phoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^\+?\d{8,15}$/, "Ingresá un teléfono válido, por ejemplo 099 123 456"),
  );

export const customerSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresá tu nombre completo").max(120),
  email: z.email("Ingresá un email válido").max(254).transform((v) => v.toLowerCase()),
  phone: phoneSchema,
  ageConfirmed: z.literal(true, { message: "Debés confirmar que sos mayor de edad" }),
});

export const addressSchema = z.object({
  department: z.enum(URUGUAY_DEPARTMENTS, { message: "Elegí un departamento" }),
  city: z.string().trim().min(2, "Ingresá la localidad").max(80),
  street: z.string().trim().min(2, "Ingresá la calle").max(120),
  streetNumber: z.string().trim().min(1, "Ingresá el número").max(10),
  apartment: z.string().trim().max(20).optional().default(""),
  postalCode: z.string().trim().max(10).optional().default(""),
  notes: z.string().trim().max(300).optional().default(""),
});

export const checkoutSchema = z
  .object({
    lines: cartLinesSchema,
    customer: customerSchema,
    shippingCode: z.string().min(1).max(60),
    address: addressSchema.optional(),
  })
  .strict();

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const shippingQuerySchema = z.object({
  department: z.enum(URUGUAY_DEPARTMENTS).optional(),
});
