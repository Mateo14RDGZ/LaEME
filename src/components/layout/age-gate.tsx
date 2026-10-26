"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Wordmark } from "../brand/wordmark";
import { MIN_AGE_YEARS } from "@/config/business";

/**
 * Verificación de edad al ingresar. Es un aviso de experiencia, NO una verificación legal:
 * la responsabilidad de validar edad en venta y entrega sigue siendo del operador (ver README).
 */
const STORAGE_KEY = "laeme.age.v1";

type Status = "unknown" | "confirmed" | "declined";

export function AgeGate() {
  const [status, setStatus] = useState<Status>("unknown");
  const headingId = useId();
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      setStatus(window.localStorage.getItem(STORAGE_KEY) === "confirmed" ? "confirmed" : "unknown");
    } catch {
      setStatus("unknown");
    }
  }, []);

  useEffect(() => {
    if (status === "unknown") firstButton.current?.focus();
  }, [status]);

  // Mientras el aviso está abierto, el contenido de fondo no recibe foco ni lectura.
  useEffect(() => {
    const main = document.getElementById("contenido");
    if (!main) return;
    if (status === "confirmed") main.removeAttribute("inert");
    else main.setAttribute("inert", "");
  }, [status]);

  if (status === "confirmed") return null;

  function confirm() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "confirmed");
    } catch {
      // Sin almacenamiento, la confirmación dura solo esta visita.
    }
    setStatus("confirmed");
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-brown/95 px-4 py-10 text-cream"
    >
      <div className="paper w-full max-w-md bg-cream px-6 py-10 text-ink sm:px-10">
        <Wordmark size="sm" withEmblem />
        <div className="rule mt-6" aria-hidden="true" />

        {status === "declined" ? (
          <div className="mt-8 space-y-4">
            <h2 id={headingId} className="font-display text-3xl font-black uppercase leading-tight">
              Este sitio es solo para mayores de {MIN_AGE_YEARS} años
            </h2>
            <p className="text-base">
              Gracias por visitarnos. Esta cerveza está pensada para personas adultas.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <h2 id={headingId} className="font-display text-3xl font-black uppercase leading-tight">
              ¿Sos mayor de {MIN_AGE_YEARS} años?
            </h2>
            <p className="text-base">
              Las cervezas de LA EME contienen alcohol. Confirmá tu edad para continuar.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button ref={firstButton} type="button" onClick={confirm} className="btn btn-primary flex-1">
                Sí, soy mayor de {MIN_AGE_YEARS}
              </button>
              <button type="button" onClick={() => setStatus("declined")} className="btn btn-ghost flex-1">
                No
              </button>
            </div>
          </div>
        )}

        <p className="mt-8 label-caps text-[0.7rem] text-brown">
          Consumir con moderación · Mantener refrigerada
        </p>
      </div>
    </div>
  );
}
