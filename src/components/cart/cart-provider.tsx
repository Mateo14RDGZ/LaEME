"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clampQuantity, MAX_LINES, MAX_UNITS_PER_LINE } from "@/domain/cart";

/**
 * Carrito persistente en el navegador, solo por comodidad. Guarda slugs y cantidades,
 * nunca precios: todo monto se recalcula en el servidor.
 */

export type CartEntry = { slug: string; quantity: number };

type CartContextValue = {
  entries: CartEntry[];
  count: number;
  hydrated: boolean;
  add: (slug: string, quantity?: number) => { ok: boolean; message: string };
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "laeme.cart.v1";

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e): e is CartEntry => typeof e?.slug === "string" && Number.isInteger(e?.quantity))
      .map((e) => ({ slug: e.slug.slice(0, 80), quantity: clampQuantity(e.quantity) }))
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

function writeStorage(entries: CartEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Almacenamiento bloqueado (modo privado, etc.): el carrito sigue funcionando en memoria.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<CartEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(entries);
  }, [entries, hydrated]);

  const add = useCallback<CartContextValue["add"]>((slug, quantity = 1) => {
    let result = { ok: true, message: "Agregada al carrito" };
    setEntries((current) => {
      const existing = current.find((e) => e.slug === slug);
      if (!existing && current.length >= MAX_LINES) {
        result = { ok: false, message: "Tu carrito tiene demasiados productos distintos." };
        return current;
      }
      const base = existing?.quantity ?? 0;
      const next = clampQuantity(base + quantity);
      if (base + quantity > MAX_UNITS_PER_LINE) {
        result = { ok: true, message: `Máximo ${MAX_UNITS_PER_LINE} unidades por cerveza.` };
      }
      if (existing) {
        return current.map((e) => (e.slug === slug ? { ...e, quantity: next } : e));
      }
      return [...current, { slug, quantity: clampQuantity(quantity) }];
    });
    return result;
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setEntries((current) =>
      current.map((e) => (e.slug === slug ? { ...e, quantity: clampQuantity(quantity) } : e)),
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setEntries((current) => current.filter((e) => e.slug !== slug));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      entries,
      count: entries.reduce((sum, e) => sum + e.quantity, 0),
      hydrated,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [entries, hydrated, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
