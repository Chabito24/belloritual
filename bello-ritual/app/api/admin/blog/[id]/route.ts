import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function makeUniqueSlug(base: string, excludeId?: number) {
  let slug = base || "post";
  for (let i = 0; i < 20; i++) {
    const exists = await prisma.blog_publicaciones.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!exists) return slug;
    slug = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now()}`;
}

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (!token) return null;

  const token_hash = sha256(token);

  const session = await prisma.admin_sesiones.findFirst({
    where: { token_hash },
    select: { usuario_admin_id: true, expira_en: true },
  });

  if (!session) return null;
  if (session.expira_en && session.expira_en.getTime() <= Date.now()) return null;

  const admin = await prisma.usuarios_admin.findUnique({
    where: { id: session.usuario_admin_id },
    select: { id: true, activo: true },
  });

  if (!admin || !admin.activo) return null;
  return admin;
}

function parseId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const id = parseId(ctx.params.id);
  if (!id) return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });

  const body = await req.json().catch(() => ({}));

  const data: any = {};

  if (body.titulo !== undefined) data.titulo = String(body.titulo ?? "").trim();
  if (body.contenido !== undefined) data.contenido = String(body.contenido ?? "").trim();
  if (body.resumen !== undefined)
    data.resumen = body.resumen == null ? null : String(body.resumen).trim();
  if (body.imagen_url !== undefined)
    data.imagen_url = body.imagen_url == null ? null : String(body.imagen_url).trim();

  if (body.slug !== undefined) {
    const base = slugify(String(body.slug ?? ""));
    data.slug = await makeUniqueSlug(base, id);
  }

  if (body.estado !== undefined) {
    const estadoRaw = String(body.estado ?? "").toUpperCase();
    const estado =
      estadoRaw === "PUBLICADO" || estadoRaw === "ARCHIVADO" ? estadoRaw : "BORRADOR";
    data.estado = estado;

    // regla: si pasa a PUBLICADO y no tiene publicado_en, asignar ahora
    if (estado === "PUBLICADO") {
      const current = await prisma.blog_publicaciones.findUnique({
        where: { id },
        select: { publicado_en: true },
      });
      if (!current?.publicado_en) data.publicado_en = new Date();
    } else {
      data.publicado_en = null;
    }
  }

  // si cambian titulo y no mandan slug, NO lo auto-cambiamos para no romper URLs
  const item = await prisma.blog_publicaciones.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const id = parseId(ctx.params.id);
  if (!id) return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });

  await prisma.blog_publicaciones.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}