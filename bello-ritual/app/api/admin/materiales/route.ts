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

  const sesion = await prisma.admin_sesiones.findUnique({
    where: { token_hash },
    select: { usuario_admin_id: true, expira_en: true },
  });

  if (!sesion) return null;
  if (sesion.expira_en && new Date(sesion.expira_en) < new Date()) return null;

  const admin = await prisma.usuarios_admin.findUnique({
    where: { id: sesion.usuario_admin_id },
    select: { id: true, nombre: true, correo: true, activo: true },
  });

  if (!admin || !admin.activo) return null;
  return admin;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const items = await prisma.materiales.findMany({
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR_INTERNO" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const nombre = String(body?.nombre ?? "").trim();
    const tipo = body?.tipo;   // 'FISICO' | 'TIEMPO'
    const unidad = body?.unidad; // 'UNIDAD' | 'HORA' | 'MINUTO' | 'ML' | 'G'
    const costo_unitario = body?.costo_unitario;

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "NOMBRE_REQUERIDO" }, { status: 400 });
    }
    if (!["FISICO", "TIEMPO"].includes(tipo)) {
      return NextResponse.json({ ok: false, error: "TIPO_INVALIDO" }, { status: 400 });
    }
    if (!["UNIDAD", "HORA", "MINUTO", "ML", "G"].includes(unidad)) {
      return NextResponse.json({ ok: false, error: "UNIDAD_INVALIDA" }, { status: 400 });
    }

    const costo = Number(costo_unitario);
    if (!Number.isFinite(costo) || costo < 0) {
      return NextResponse.json({ ok: false, error: "COSTO_INVALIDO" }, { status: 400 });
    }

    const item = await prisma.materiales.create({
      data: { nombre, tipo, unidad, costo_unitario: costo, activo: true },
    });

    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR_INTERNO" },
      { status: 500 }
    );
  }
}