import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start gap-8 px-4 py-32 sm:px-6">
      <h1 className="font-display text-[clamp(3rem,8vw,6rem)] font-black leading-[0.92]">Esta página no existe.</h1>
      <p className="text-lg text-muted">Quizás el enlace cambió. Podés volver a las cervezas.</p>
      <Link href="/cervezas" className="btn btn-primary">Ver cervezas</Link>
    </div>
  );
}
