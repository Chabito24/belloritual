import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// COPIA AQUÍ tu requireAdmin EXACTO desde app/api/admin/materiales/route.ts

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const servicio_id = Number(searchParams.get("servicio_id"));

    if (!Number.isFinite(servicio_id) || servicio_id <= 0) {
      return NextResponse.json({ ok: false, error: "SERVICIO_ID_REQUERIDO" }, { status: 400 });
    }

    const items = await prisma.servicio_materiales.findMany({
      where: { servicio_id },
      include: {
        materiales: {
          select: { id: true, nombre: true, tipo: true, unidad: true, costo_unitario: true },
        },
      },
      orderBy: { material_id: "asc" },
    });

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "ERROR_INTERNO" }, { status: 500 });
  }
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
    const nota = body?.nota == null ? null : String(body.nota);

    if (!Number.isFinite(servicio_id) || servicio_id <= 0) {
      return NextResponse.json({ ok: false, error: "SERVICIO_ID_REQUERIDO" }, { status: 400 });
    }
    if (!Number.isFinite(material_id) || material_id <= 0) {
      return NextResponse.json({ ok: false, error: "MATERIAL_ID_REQUERIDO" }, { status: 400 });
    }
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return NextResponse.json({ ok: false, error: "CANTIDAD_INVALIDA" }, { status: 400 });
    }

    // Inserta o actualiza (PK compuesta: servicio_id + material_id)
    await prisma.$executeRaw`
      INSERT INTO servicio_materiales (servicio_id, material_id, cantidad, nota)
      VALUES (${servicio_id}, ${material_id}, ${cantidad}, ${nota})
      ON DUPLICATE KEY UPDATE
        cantidad = VALUES(cantidad),
        nota = VALUES(nota)
    `;

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
      return NextResponse.json({ ok: false, error: "SERVICIO_ID_REQUERIDO" }, { status: 400 });
    }
    if (!Number.isFinite(material_id) || material_id <= 0) {
      return NextResponse.json({ ok: false, error: "MATERIAL_ID_REQUERIDO" }, { status: 400 });
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