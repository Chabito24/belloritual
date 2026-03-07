import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function toNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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

function normalizarItem(item: any) {
  const cantidad = toNumber(item.cantidad, 0);
  const costo_unitario = toNumber(item.materiales?.costo_unitario, 0);

  return {
    servicio_id: item.servicio_id,
    material_id: item.material_id,
    cantidad,
    nota: item.nota,
    subtotal: cantidad * costo_unitario,
    material: item.materiales
      ? {
          id: item.materiales.id,
          nombre: item.materiales.nombre,
          tipo: item.materiales.tipo,
          costo_unitario: item.materiales.costo_unitario,
          activo: item.materiales.activo,
          unidad_medida_id: item.materiales.unidad_medida_id,
          unidad_legacy: item.materiales.unidad,
          unidad_medida: item.materiales.unidades_medida
            ? {
                id: item.materiales.unidades_medida.id,
                nombre: item.materiales.unidades_medida.nombre,
                abreviatura: item.materiales.unidades_medida.abreviatura,
                activo: item.materiales.unidades_medida.activo,
              }
            : null,
        }
      : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const servicio_id = Number(searchParams.get("servicio_id"));

    if (!Number.isFinite(servicio_id) || servicio_id <= 0) {
      return NextResponse.json(
        { ok: false, error: "SERVICIO_ID_REQUERIDO" },
        { status: 400 }
      );
    }

    const servicio = await prisma.servicios.findUnique({
      where: { id: servicio_id },
      select: { id: true, nombre: true },
    });

    if (!servicio) {
      return NextResponse.json(
        { ok: false, error: "SERVICIO_NO_EXISTE" },
        { status: 404 }
      );
    }

    const items = await prisma.servicio_materiales.findMany({
      where: { servicio_id },
      include: {
        materiales: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            unidad_medida_id: true,
            unidad: true,
            costo_unitario: true,
            activo: true,
            unidades_medida: {
              select: {
                id: true,
                nombre: true,
                abreviatura: true,
                activo: true,
              },
            },
          },
        },
      },
      orderBy: [{ material_id: "asc" }],
    });

    return NextResponse.json(
      { ok: true, items: items.map(normalizarItem) },
      { status: 200 }
    );
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

    const servicio_id = Number(body?.servicio_id);
    const material_id = Number(body?.material_id);
    const cantidad = Number(body?.cantidad);
    const nota = body?.nota == null ? null : String(body.nota).trim() || null;

    if (!Number.isFinite(servicio_id) || servicio_id <= 0) {
      return NextResponse.json(
        { ok: false, error: "SERVICIO_ID_REQUERIDO" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(material_id) || material_id <= 0) {
      return NextResponse.json(
        { ok: false, error: "MATERIAL_ID_REQUERIDO" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return NextResponse.json(
        { ok: false, error: "CANTIDAD_INVALIDA" },
        { status: 400 }
      );
    }

    const [servicio, material] = await Promise.all([
      prisma.servicios.findUnique({
        where: { id: servicio_id },
        select: { id: true, requiere_materiales: true },
      }),
      prisma.materiales.findUnique({
        where: { id: material_id },
        select: { id: true, activo: true },
      }),
    ]);

    if (!servicio) {
      return NextResponse.json(
        { ok: false, error: "SERVICIO_NO_EXISTE" },
        { status: 404 }
      );
    }

    if (!material) {
      return NextResponse.json(
        { ok: false, error: "MATERIAL_NO_EXISTE" },
        { status: 404 }
      );
    }

    if (!material.activo) {
      return NextResponse.json(
        { ok: false, error: "MATERIAL_INACTIVO" },
        { status: 409 }
      );
    }

    await prisma.servicio_materiales.upsert({
      where: {
        servicio_id_material_id: {
          servicio_id,
          material_id,
        },
      },
      update: {
        cantidad,
        nota,
      },
      create: {
        servicio_id,
        material_id,
        cantidad,
        nota,
      },
    });

    if (!servicio.requiere_materiales) {
      await prisma.servicios.update({
        where: { id: servicio_id },
        data: { requiere_materiales: true },
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR_INTERNO" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const servicio_id = Number(searchParams.get("servicio_id"));
    const material_id = Number(searchParams.get("material_id"));

    if (!Number.isFinite(servicio_id) || servicio_id <= 0) {
      return NextResponse.json(
        { ok: false, error: "SERVICIO_ID_REQUERIDO" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(material_id) || material_id <= 0) {
      return NextResponse.json(
        { ok: false, error: "MATERIAL_ID_REQUERIDO" },
        { status: 400 }
      );
    }

    const actual = await prisma.servicio_materiales.findUnique({
      where: {
        servicio_id_material_id: { servicio_id, material_id },
      },
      select: { servicio_id: true, material_id: true },
    });

    if (!actual) {
      return NextResponse.json(
        { ok: false, error: "ASIGNACION_NO_EXISTE" },
        { status: 404 }
      );
    }

    await prisma.servicio_materiales.delete({
      where: {
        servicio_id_material_id: { servicio_id, material_id },
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR_INTERNO" },
      { status: 500 }
    );
  }
}