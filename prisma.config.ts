import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` no se conecta a la base, así que el build no necesita DATABASE_URL.
// Para migraciones y seed, DATABASE_URL debe estar definida: sin ella fallan al conectar.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://build-placeholder:unset@localhost:5432/unset",
  },
});
