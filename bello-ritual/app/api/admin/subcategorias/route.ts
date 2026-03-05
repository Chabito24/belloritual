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

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const categoria_id = url.searchParams.get("categoria_id");
  const where: any = {};

  if (categoria_id) where.categoria_id = Number(categoria_id);

  const items = await prisma.subcategorias.findMany({
    where,
    orderBy: { nombre: "asc" },
    include: {
      categorias: { select: { id: true, nombre: true } },
    },
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const categoria_id = Number(body?.categoria_id);
  const nombre = String(body?.nombre ?? "").trim();

  if (!Number.isFinite(categoria_id) || categoria_id <= 0) {
    return NextResponse.json({ ok: false, error: "CATEGORIA_ID_REQUERIDO" }, { status: 400 });
  }
  if (!nombre) {
    return NextResponse.json({ ok: false, error: "NOMBRE_REQUERIDO" }, { status: 400 });
  }

  try {
    const item = await prisma.subcategorias.create({
      data: { categoria_id, nombre, activo: true },
    });

    revalidatePath("/servicios");
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "SUBCATEGORIA_YA_EXISTE" },
        { status: 409 }
      );
    }
    throw e;
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const id = Number(body?.id);

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });
  }

  const data: any = {};
  if (body?.nombre != null) data.nombre = String(body.nombre).trim();
  if (body?.activo != null) data.activo = Boolean(body.activo);

  try {
    const item = await prisma.subcategorias.update({ where: { id }, data });
    revalidatePath("/servicios");
    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "SUBCATEGORIA_YA_EXISTE" },
        { status: 409 }
      );
    }
    throw e;
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const id = Number(body?.id);

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });
  }

  await prisma.subcategorias.delete({ where: { id } });
  revalidatePath("/servicios");

  return NextResponse.json({ ok: true });
}