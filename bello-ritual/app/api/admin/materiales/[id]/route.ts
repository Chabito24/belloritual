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

function obtenerId(params: { id: string }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const id = obtenerId(params);
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });
    }

    const actual = await prisma.unidades_medida.findUnique({
      where: { id },
      select: { id: true, activo: true, nombre: true },
    });

    if (!actual) {
      return NextResponse.json(
        { ok: false, error: "UNIDAD_MEDIDA_NO_EXISTE" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const activo = body?.activo;

    if (typeof activo !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "ACTIVO_INVALIDO" },
        { status: 400 }
      );
    }

    // Si se quiere inactivar, primero validar que no esté en uso
    if (activo === false) {
      const uso = await prisma.materiales.count({
        where: { unidad_medida_id: id },
      });

      if (uso > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: "UNIDAD_MEDIDA_EN_USO",
            detail: "No se puede inactivar porque está asociada a uno o más materiales.",
          },
          { status: 409 }
        );
      }
    }

    const item = await prisma.unidades_medida.update({
      where: { id },
      data: { activo },
    });

    return NextResponse.json({ ok: true, item }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR_INTERNO" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const id = obtenerId(params);
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });
    }

    const actual = await prisma.unidades_medida.findUnique({
      where: { id },
      select: { id: true, nombre: true },
    });

    if (!actual) {
      return NextResponse.json(
        { ok: false, error: "UNIDAD_MEDIDA_NO_EXISTE" },
        { status: 404 }
      );
    }

    const uso = await prisma.materiales.count({
      where: { unidad_medida_id: id },
    });

    if (uso > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "UNIDAD_MEDIDA_EN_USO",
          detail: "No se puede eliminar porque está asociada a uno o más materiales.",
        },
        { status: 409 }
      );
    }

    await prisma.unidades_medida.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR_INTERNO" },
      { status: 500 }
    );
  }
}