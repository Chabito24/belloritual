let PrismaClient;

try {
  ({ PrismaClient } = require("./lib/generated/prisma/client"));
} catch {
  ({ PrismaClient } = require("./lib/generated/prisma"));
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const r = await prisma.usuarios_admin.findUnique({
      where: { correo: "belloritualniquia@gmail.com" },
      select: { correo: true, activo: true, password_hash: true },
    });

    if (!r) {
      console.log("NO_EXISTE");
      return;
    }

    const hash = r.password_hash || "";
    console.log({
      correo: r.correo,
      activo: r.activo,
      len: hash.length,
      prefix: hash.slice(0, 4),
    });
  } finally {
    // Prisma v5/v6/v7
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("ERROR", e.message);
  process.exit(1);
});