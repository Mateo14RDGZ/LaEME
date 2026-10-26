import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 lg:px-10">
      <h1 className="font-display text-[clamp(3rem,8vw,6rem)] font-black leading-[0.9]">Carrito</h1>
      <div className="mt-12">
        <CartView />
      </div>
    </div>
  );
}
