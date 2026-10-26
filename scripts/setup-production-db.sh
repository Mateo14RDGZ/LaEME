#!/usr/bin/env bash
# Aplica migraciones y seed a la base de PRODUCCIÓN. Ejecutar una vez por base nueva.
# Uso: DATABASE_URL="<cadena directa de Neon o Supabase>" bash scripts/setup-production-db.sh
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Falta DATABASE_URL." >&2
  exit 1
fi

case "$DATABASE_URL" in
  *localhost*|*127.0.0.1*)
    echo "DATABASE_URL apunta a localhost. Usa la base de producción." >&2
    exit 1 ;;
esac

echo "Aplicando migraciones..."
npx prisma migrate deploy

echo "Cargando catálogo, envíos y ajustes (idempotente)..."
npx tsx prisma/seed.ts

echo "Listo. Verifica en /api/health del dominio desplegado."
