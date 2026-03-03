import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// slug básico: "Título X" -> "titulo-x"
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

// evita choque con UNIQUE(slug)
async function makeUniqueSlug(base: string) {
  let slug = base || "post";
  for (let i = 0; i < 20; i++) {
    const exists = await prisma.blog_publicaciones.findFirst({
      where: { slug },
      select: { id: true },
    });
    if (!exists) return slug;
    slug = `${base}-${i + 2}`;
  }
  // último recurso
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

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const items = await prisma.blog_publicaciones.findMany({
    orderBy: { id: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const titulo = String(body?.titulo ?? "").trim();
  const contenido = String(body?.contenido ?? "").trim();
  const resumen = body?.resumen != null ? String(body.resumen).trim() : null;
  const imagen_url = body?.imagen_url != null ? String(body.imagen_url).trim() : null;

  // estado: BORRADOR|PUBLICADO|ARCHIVADO
    const estadoRaw = String(body?.estado ?? "BORRADOR").toUpperCase();
    const estado = estadoRaw === "PUBLICADO" ? "PUBLICADO" : "BORRADOR";

    // ✅ regla: no se permite crear ARCHIVADO directo
    if (estadoRaw === "ARCHIVADO") {
    return NextResponse.json(
        { ok: false, error: "NO_SE_PUEDE_CREAR_ARCHIVADO" },
        { status: 400 }
    );
    }

  const baseSlug = body?.slug ? slugify(String(body.slug)) : slugify(titulo);
  const slug = await makeUniqueSlug(baseSlug);

  const publicado_en = estado === "PUBLICADO" ? new Date() : null;

  const item = await prisma.blog_publicaciones.create({
    data: {
      titulo,
      slug,
      resumen,
      contenido,
      imagen_url,
      estado,
      publicado_en,
      autor_id: admin.id, // usamos el id del admin como autor
    },
  });

  return NextResponse.json({ ok: true, item }, { status: 201 });
}
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const id = Number(body?.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });
  }

  const estadoRaw = String(body?.estado ?? "").toUpperCase();
  const nextEstado =
    estadoRaw === "PUBLICADO" || estadoRaw === "ARCHIVADO" ? estadoRaw : "BORRADOR";

  const current = await prisma.blog_publicaciones.findUnique({
    where: { id },
    select: { estado: true, publicado_en: true },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: "NO_EXISTE" }, { status: 404 });
  }

  // ❌ regla: no se puede archivar si no ha sido publicado
  if (nextEstado === "ARCHIVADO" && current.estado !== "PUBLICADO") {
    return NextResponse.json(
      { ok: false, error: "SOLO_SE_PUEDE_ARCHIVAR_SI_ESTA_PUBLICADO" },
      { status: 400 }
    );
  }

  const data: any = { estado: nextEstado };

  // ✅ al publicar, si no tenía fecha, asignar
  if (nextEstado === "PUBLICADO" && !current.publicado_en) {
    data.publicado_en = new Date();
  }

  // opcional: si vuelve a BORRADOR, quitar fecha
  if (nextEstado === "BORRADOR") {
    data.publicado_en = null;
  }

  const item = await prisma.blog_publicaciones.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, item });
}
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const id = Number(body?.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });
  }

  const current = await prisma.blog_publicaciones.findUnique({
    where: { id },
    select: { estado: true },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: "NO_EXISTE" }, { status: 404 });
  }

  // Regla: NO borrar PUBLICADO (primero archivar)
  if (current.estado === "PUBLICADO") {
    return NextResponse.json(
      { ok: false, error: "NO_SE_PUEDE_ELIMINAR_PUBLICADO" },
      { status: 400 }
    );
  }

  await prisma.blog_publicaciones.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}