"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../cart/cart-provider";

/** Limpia el carrito cuando el servidor confirmó el pago. */
export function ClearCartOnPaid() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}

/**
 * Mientras el pago está pendiente, vuelve a leer el estado desde el servidor.
 * Se detiene solo: nunca confía en el navegador para decidir el estado.
 */
export function PendingRefresh({ maxMinutes = 10 }: { maxMinutes?: number }) {
  const router = useRouter();
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - started > maxMinutes * 60_000) {
        window.clearInterval(timer);
        return;
      }
      router.refresh();
    }, 8_000);
    return () => window.clearInterval(timer);
  }, [router, maxMinutes]);
  return null;
}
