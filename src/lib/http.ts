import { NextResponse } from "next/server";
import { DomainError, type DomainIssue } from "@/domain/errors";
import type { z } from "zod";

/** Respuesta de error uniforme. Nunca incluye stack traces ni datos internos. */
export function errorResponse(status: number, message: string, issues: DomainIssue[] = []) {
  return NextResponse.json({ error: message, issues }, { status });
}

export function zodIssues(error: z.ZodError): DomainIssue[] {
  return error.issues.map((i) => ({
    code: "invalid",
    message: i.message,
    field: i.path.join(".") || undefined,
  }));
}

/** Convierte errores conocidos en respuestas seguras; el resto se registra y responde genérico. */
export function handleRouteError(error: unknown, context: string) {
  if (error instanceof DomainError) {
    return errorResponse(error.status, error.message, error.issues);
  }
  console.error(`[${context}]`, error instanceof Error ? error.message : "error desconocido");
  return errorResponse(500, "Ocurrió un error inesperado. Intentá de nuevo en unos minutos.");
}
