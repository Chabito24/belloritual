// app/api/admin/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (!token) return null;

  const token_hash = sha256(token);

  const session = await prisma.admin_sesiones.findFirst({
    where: { token_hash },
    select: { usuario_admin_id: true, expira_en: true },
  });

  if (!session) return null;
  if (session.expira_en && session.expira_en.getTime() <= Date.now()) return null;

  const admin = await prisma.usuarios_admin.findUnique({
    where: { id: session.usuario_admin_id },
    select: { id: true, nombre: true, correo: true, activo: true },
  });

  if (!admin || !admin.activo) return null;
  return admin;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const items = await prisma.leads.findMany({
      orderBy: { id: "desc" },
      take: 200,
    });

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    console.error("[GET /api/admin/leads]", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}