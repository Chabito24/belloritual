import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const SESSION_DAYS = 7;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MIN = 10;

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// ---- Rate limit fuerte (MySQL) ----
async function countRecentAttempts(ip: string) {
  const rows = await prisma.$queryRaw<{ cnt: bigint }[]>`
    SELECT COUNT(*) AS cnt
    FROM admin_login_attempts
    WHERE ip = ${ip}
      AND created_at > DATE_SUB(NOW(), INTERVAL ${RATE_LIMIT_WINDOW_MIN} MINUTE)
  `;
  return Number(rows?.[0]?.cnt ?? 0);
}

async function recordAttempt(ip: string, correo: string | null) {
  await prisma.$executeRaw`
    INSERT INTO admin_login_attempts (ip, correo, created_at)
    VALUES (${ip}, ${correo}, NOW(3))
  `;
}

async function clearAttempts(ip: string) {
  await prisma.$executeRaw`
    DELETE FROM admin_login_attempts
    WHERE ip = ${ip}
  `;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const correo = String(body?.correo ?? body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    console.log("[admin/login] attempt", { correo, hasPassword: Boolean(password) });

    if (!correo || !password) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // IP y User-Agent (reutilizamos lo mismo en toda la función)
    const h = await headers();
    const ipRaw = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim();
    const ip = ipRaw || "unknown";
    const user_agent = h.get("user-agent")?.slice(0, 255) ?? null;

    // ✅ Rate limit: 3 intentos / 10 min por IP
    const cnt = await countRecentAttempts(ip);
    if (cnt >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "RATE_LIMIT", retryAfterSec: RATE_LIMIT_WINDOW_MIN * 60 },
        { status: 429 }
      );
    }

    const admin = await prisma.usuarios_admin.findUnique({ where: { correo } });

    if (!admin) {
      // Registrar intento fallido
      await recordAttempt(ip, correo);
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    if (!admin.activo) {
      // (opcional) podrías registrar intento también, lo dejo igual para no cambiar tu comportamiento
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 });
    }

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      // Registrar intento fallido
      await recordAttempt(ip, correo);
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const token_hash = sha256(token);
    const expira_en = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    const ipToStore = ip === "unknown" ? null : ip;

    await prisma.admin_sesiones.create({
      data: { usuario_admin_id: admin.id, token_hash, expira_en, ip: ipToStore, user_agent },
    });

    await prisma.usuarios_admin.update({
      where: { id: admin.id },
      data: { ultimo_login_en: new Date() },
    });

    const cookieStore = await cookies();
    cookieStore.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });

    // ✅ Limpia intentos al login exitoso
    await clearAttempts(ip);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/login]", {
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}