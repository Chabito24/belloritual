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

    const items = await prisma.unidades_medida.findMany({
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
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
    const abreviatura = String(body?.abreviatura ?? "")
      .trim()
      .toUpperCase();

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "NOMBRE_REQUERIDO" }, { status: 400 });
    }

    if (!abreviatura) {
      return NextResponse.json({ ok: false, error: "ABREVIATURA_REQUERIDA" }, { status: 400 });
    }

    if (nombre.length > 40) {
      return NextResponse.json({ ok: false, error: "NOMBRE_DEMASIADO_LARGO" }, { status: 400 });
    }

    if (abreviatura.length > 15) {
      return NextResponse.json(
        { ok: false, error: "ABREVIATURA_DEMASIADO_LARGA" },
        { status: 400 }
      );
    }

    if (!/^[A-Z0-9]+$/.test(abreviatura)) {
      return NextResponse.json(
        { ok: false, error: "ABREVIATURA_INVALIDA" },
        { status: 400 }
      );
    }

    const existente = await prisma.unidades_medida.findFirst({
      where: {
        OR: [{ nombre }, { abreviatura }],
      },
      select: { id: true },
    });

    if (existente) {
      return NextResponse.json(
        { ok: false, error: "UNIDAD_MEDIDA_DUPLICADA" },
        { status: 409 }
      );
    }

    const item = await prisma.unidades_medida.create({
      data: {
        nombre,
        abreviatura,
        activo: true,
      },
    });

    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR_INTERNO" },
      { status: 500 }
    );
  }
}