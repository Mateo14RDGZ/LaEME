"use client";

import { useState } from "react";
import Link from "next/link";
import { MAX_UNITS_PER_LINE } from "@/domain/cart";
import { useCart } from "../cart/cart-provider";

type AddToCartProps = {
  slug: string;
  name: string;
};

export function AddToCart({ slug, name }: AddToCartProps) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function onAdd() {
    const result = add(slug, quantity);
    setFeedback({ tone: result.ok ? "ok" : "error", text: result.message });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="label-caps mb-2 text-[0.75rem]" id={`qty-${slug}`}>
            Cantidad
          </p>
          <div className="inline-flex items-center border-[1.5px] border-ink" role="group" aria-labelledby={`qty-${slug}`}>
            <button
              type="button"
              className="h-12 w-12 text-xl hover:bg-ink hover:text-cream disabled:opacity-40"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label={`Quitar una unidad de ${name}`}
            >
              −
            </button>
            <output className="min-w-12 text-center font-semibold tabular-nums" aria-live="polite">
              {quantity}
            </output>
            <button
              type="button"
              className="h-12 w-12 text-xl hover:bg-ink hover:text-cream disabled:opacity-40"
              onClick={() => setQuantity((q) => Math.min(MAX_UNITS_PER_LINE, q + 1))}
              disabled={quantity >= MAX_UNITS_PER_LINE}
              aria-label={`Agregar una unidad de ${name}`}
            >
              +
            </button>
          </div>
        </div>

        <button type="button" onClick={onAdd} className="btn btn-primary w-full sm:flex-1">
          Agregar al carrito
        </button>
      </div>

      <div aria-live="polite" className="min-h-6 text-sm">
        {feedback && (
          <p className={feedback.tone === "ok" ? "text-olive" : "text-burgundy"}>
            {feedback.text}{" "}
            {feedback.tone === "ok" && (
              <Link href="/carrito" className="font-semibold underline underline-offset-4">
                Ver carrito
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
