import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const SESSION_DAYS = 7;

type Bucket = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as {
  __adminLoginBuckets?: Map<string, Bucket>;
};

const buckets = globalForRateLimit.__adminLoginBuckets ?? new Map<string, Bucket>();
globalForRateLimit.__adminLoginBuckets = buckets;

function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }

  b.count += 1;
  return { ok: true };
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
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

    // ✅ Rate limit (3 intentos / 10 min por IP)
    const h = await headers();
    const ipRaw = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim();
    const ip = ipRaw || "unknown";
    const key = `admin_login:${ip}`;

    const rl = rateLimit(key, 3, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "RATE_LIMIT", retryAfterSec: rl.retryAfterSec },
        { status: 429 }
      );
    }

    const admin = await prisma.usuarios_admin.findUnique({ where: { correo } });

    if (!admin) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    if (!admin.activo) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 });
    }

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const token_hash = sha256(token);
    const expira_en = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    const user_agent = h.get("user-agent")?.slice(0, 255) ?? null;
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

    // ✅ Reset del contador al login exitoso
    buckets.delete(key);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/login]", {
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}