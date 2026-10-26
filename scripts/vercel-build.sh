#!/usr/bin/env bash
# Build de Vercel: genera el cliente de Prisma, aplica migraciones y seed si hay base,
# y compila Next. Sin base configurada compila igual (la app avisa en runtime).
set -euo pipefail

npx prisma generate

# Migraciones con la conexión directa (DATABASE_URL_UNPOOLED, que inyecta la integración de Neon).
MIGRATE_URL="${DATABASE_URL_UNPOOLED:-${DATABASE_URL:-}}"
if [ -n "$MIGRATE_URL" ]; then
  DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy
  DATABASE_URL="$MIGRATE_URL" npx tsx prisma/seed.ts
else
  echo "Sin DATABASE_URL en el build: se omiten migraciones y seed."
fi

npx next build
