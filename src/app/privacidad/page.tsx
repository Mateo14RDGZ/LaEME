import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos recolecta LA EME para tus pedidos y cómo los usamos.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 px-4 pb-24 pt-14 sm:px-6">
      <h1 className="font-display text-[clamp(3rem,8vw,5.5rem)] font-black leading-[0.92]">Privacidad</h1>
      <div className="notice notice-warn text-sm">
        Documento provisorio. Debe ser revisado por asesoría legal antes de publicarse, en particular a la luz de la
        Ley N.º 18.331 de Protección de Datos Personales de Uruguay.
      </div>
      <section className="space-y-3 leading-relaxed">
        <h2 className="font-display text-2xl font-bold">Qué datos recolectamos</h2>
        <p>Para procesar un pedido pedimos nombre, email, teléfono y, si elegís envío, la dirección de entrega. También registramos la confirmación de que sos mayor de 18 años.</p>
      </section>
      <section className="space-y-3 leading-relaxed">
        <h2 className="font-display text-2xl font-bold">Pagos</h2>
        <p>
          Los pagos se procesan en Mercado Pago. LA EME no recibe ni guarda números de tarjeta, códigos de seguridad ni
          credenciales de pago.
        </p>
      </section>
      <section className="space-y-3 leading-relaxed">
        <h2 className="font-display text-2xl font-bold">Para qué los usamos</h2>
        <p>Para preparar, pagar y entregar tu pedido, y para responder tus consultas. No los usamos para otros fines sin tu consentimiento.</p>
      </section>
      <section className="space-y-3 leading-relaxed">
        <h2 className="font-display text-2xl font-bold">Tus derechos</h2>
        <p>Podés consultar, rectificar o pedir la eliminación de tus datos escribiendo a los datos de contacto publicados en el sitio.</p>
      </section>
    </article>
  );
}
