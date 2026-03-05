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

  const session = await prisma.admin_sesiones.findFirst({
    where: { token_hash, expira_en: { gt: new Date() } },
    select: { usuario_admin_id: true },
  });

  if (!session) return null;

  const admin = await prisma.usuarios_admin.findUnique({
    where: { id: session.usuario_admin_id },
    select: { id: true, activo: true },
  });

  if (!admin || !admin.activo) return null;
  return admin;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const servicio_id = Number(body?.servicio_id);
  const subcategoria_id = body?.subcategoria_id == null ? null : Number(body.subcategoria_id);

  if (!Number.isFinite(servicio_id) || servicio_id <= 0) {
    return NextResponse.json({ ok: false, error: "SERVICIO_ID_REQUERIDO" }, { status: 400 });
  }
  if (subcategoria_id != null && (!Number.isFinite(subcategoria_id) || subcategoria_id <= 0)) {
    return NextResponse.json({ ok: false, error: "SUBCATEGORIA_ID_INVALIDO" }, { status: 400 });
  }

  // Validar existencia subcategoría si no es null
  if (subcategoria_id != null) {
    const exists = await prisma.subcategorias.findUnique({
      where: { id: subcategoria_id },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ ok: false, error: "SUBCATEGORIA_NO_EXISTE" }, { status: 404 });
    }
  }

  const item = await prisma.servicios.update({
    where: { id: servicio_id },
    data: { subcategoria_id },
  });

  revalidatePath("/servicios");

  return NextResponse.json({ ok: true, item });
}