import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const SESSION_DAYS = 7;

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  const raw = await req.text();
  console.log("[admin/login] raw body =>", raw);

  let body: any = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    body = {};
  }

  const correo = String(body?.correo ?? body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!correo || !password) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
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

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || null;
  const user_agent = h.get("user-agent")?.slice(0, 255) ?? null;

  await prisma.admin_sesiones.create({
    data: { usuario_admin_id: admin.id, token_hash, expira_en, ip, user_agent },
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

  return NextResponse.json({ ok: true });
}