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

  const items = await prisma.categorias.findMany({
    orderBy: { nombre: "asc" },
    include: { subcategorias: { orderBy: { nombre: "asc" } } },
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const nombre = String(body?.nombre ?? "").trim();

  if (!nombre) {
    return NextResponse.json({ ok: false, error: "NOMBRE_REQUERIDO" }, { status: 400 });
  }

  let item;
    try {
    item = await prisma.categorias.create({
        data: { nombre, activo: true },
    });
    } catch (e: any) {
    // Prisma unique constraint
    if (e?.code === "P2002") {
        return NextResponse.json(
        { ok: false, error: "CATEGORIA_YA_EXISTE" },
        { status: 409 }
        );
    }
    throw e;
    }

  // Revalida páginas públicas afectadas (si luego usas categorías en /servicios)
  revalidatePath("/servicios");

  return NextResponse.json({ ok: true, item }, { status: 201 });
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

  const item = await prisma.categorias.update({ where: { id }, data });

  revalidatePath("/servicios");

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const id = Number(body?.id);

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });
  }

  // Cascada elimina subcategorías; servicios quedan con subcategoria_id = null (onDelete SetNull)
  await prisma.categorias.delete({ where: { id } });

  revalidatePath("/servicios");

  return NextResponse.json({ ok: true });
}