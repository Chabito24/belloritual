import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buildMariaDbAdapter() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL no está definida");

  const url = new URL(raw);
  const database = url.pathname.replace(/^\//, "");
  const host = url.hostname;
  const port = Number(url.port || 3306);
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);

  // Evita forzar SSL en local (localhost / 127.0.0.1)
  const isLocal = host === "localhost" || host === "127.0.0.1";

  return new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,

    // Aiven suele requerir TLS. Para diagnóstico rápido:
    ssl: isLocal ? undefined : { rejectUnauthorized: false },

    // Pool conservador (serverless)
    connectionLimit: 2,
    acquireTimeout: 10_000,
    connectTimeout: 5_000,
  });
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: buildMariaDbAdapter(),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;