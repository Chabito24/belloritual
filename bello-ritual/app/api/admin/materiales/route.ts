import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEGACY_UNIDADES = ["UNIDAD", "HORA", "MINUTO", "ML", "G"] as const;
type LegacyUnidad = (typeof LEGACY_UNIDADES)[number];

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function esLegacyUnidad(value: string): value is LegacyUnidad {
  return LEGACY_UNIDADES.includes(value as LegacyUnidad);
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

async function resolverUnidadMedida(body: any) {
  const unidadMedidaIdRaw = body?.unidad_medida_id;
  const unidadLegacyRaw = String(body?.unidad ?? "")
    .trim()
    .toUpperCase();

  if (unidadMedidaIdRaw !== undefined && unidadMedidaIdRaw !== null && unidadMedidaIdRaw !== "") {
    const unidad_medida_id = Number(unidadMedidaIdRaw);

    if (!Number.isInteger(unidad_medida_id) || unidad_medida_id <= 0) {
      return { error: "UNIDAD_MEDIDA_INVALIDA" as const };
    }

    const unidadMedida = await prisma.unidades_medida.findUnique({
      where: { id: unidad_medida_id },
      select: { id: true, nombre: true, abreviatura: true, activo: true },
    });

    if (!unidadMedida || !unidadMedida.activo) {
      return { error: "UNIDAD_MEDIDA_NO_EXISTE" as const };
    }

    const unidadLegacy = esLegacyUnidad(unidadMedida.abreviatura)
      ? unidadMedida.abreviatura
      : null;

    return { unidadMedida, unidadLegacy };
  }

  if (unidadLegacyRaw) {
    if (!esLegacyUnidad(unidadLegacyRaw)) {
      return { error: "UNIDAD_INVALIDA" as const };
    }

    const unidadMedida = await prisma.unidades_medida.findFirst({
      where: { abreviatura: unidadLegacyRaw, activo: true },
      select: { id: true, nombre: true, abreviatura: true, activo: true },
    });

    if (!unidadMedida) {
      return { error: "UNIDAD_MEDIDA_NO_EXISTE" as const };
    }

    return { unidadMedida, unidadLegacy: unidadLegacyRaw };
  }

  return { error: "UNIDAD_MEDIDA_REQUERIDA" as const };
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const items = await prisma.materiales.findMany({
      include: {
        unidades_medida: {
          select: {
            id: true,
            nombre: true,
            abreviatura: true,
            activo: true,
          },
        },
      },
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
    const tipo = String(body?.tipo ?? "").trim().toUpperCase();
    const costo_unitario = body?.costo_unitario;

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "NOMBRE_REQUERIDO" }, { status: 400 });
    }

    if (!["FISICO", "TIEMPO"].includes(tipo)) {
      return NextResponse.json({ ok: false, error: "TIPO_INVALIDO" }, { status: 400 });
    }

    const costo = Number(costo_unitario);
    if (!Number.isFinite(costo) || costo < 0) {
      return NextResponse.json({ ok: false, error: "COSTO_INVALIDO" }, { status: 400 });
    }

    const unidadResuelta = await resolverUnidadMedida(body);
    if ("error" in unidadResuelta) {
      return NextResponse.json({ ok: false, error: unidadResuelta.error }, { status: 400 });
    }

    const item = await prisma.materiales.create({
      data: {
        nombre,
        tipo: tipo as "FISICO" | "TIEMPO",
        unidad_medida_id: unidadResuelta.unidadMedida.id,
        unidad: unidadResuelta.unidadLegacy,
        costo_unitario: costo,
        activo: true,
      },
      include: {
        unidades_medida: {
          select: {
            id: true,
            nombre: true,
            abreviatura: true,
            activo: true,
          },
        },
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