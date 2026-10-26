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

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Cliente de base de datos creado al primer uso, no al importar el módulo.
 * Así el build (que importa el código sin ejecutar consultas) no necesita DATABASE_URL.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
