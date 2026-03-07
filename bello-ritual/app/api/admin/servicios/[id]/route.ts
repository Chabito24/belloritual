import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

    const actual = await prisma.servicios.findUnique({
      where: { id },
      select: { id: true, nombre: true },
    });

    if (!actual) {
      return NextResponse.json(
        { ok: false, error: "SERVICIO_NO_EXISTE" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.servicio_materiales.deleteMany({
        where: { servicio_id: id },
      });

      await tx.servicios.delete({
        where: { id },
      });
    });

    revalidatePath("/servicios");

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR_INTERNO" },
      { status: 500 }
    );
  }
}