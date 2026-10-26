import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 lg:px-10">
      <h1 className="font-display mt-3 text-[clamp(3rem,8vw,6rem)] font-black leading-[0.9]">Tu pedido</h1>
      <div className="mt-12">
        <CheckoutForm />
      </div>
    </div>
  );
}
