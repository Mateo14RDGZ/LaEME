import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está configurada.");
  }
  return new PrismaClient({
    // Serverless: cada instancia tiene su pool. Pocas conexiones evitan agotar Postgres.
    adapter: new PrismaPg({ connectionString, max: 5 }),
  });
}

/** Cliente único por proceso (evita agotar conexiones con el hot reload de Next). */
export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
