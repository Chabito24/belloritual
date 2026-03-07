import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
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

async function validarMaximoDestacadas({
  quiereDestacar,
  categoriaIdActual,
}: {
  quiereDestacar: boolean;
  categoriaIdActual?: number;
}) {
  if (!quiereDestacar) return null;

  const total = await prisma.categorias.count({
    where: {
      es_destacada_home: true,
      ...(categoriaIdActual ? { id: { not: categoriaIdActual } } : {}),
    },
  });

  if (total >= 3) {
    return NextResponse.json(
      {
        ok: false,
        error: "MAXIMO_CATEGORIAS_DESTACADAS",
        detail: "Solo se permiten 3 categorías destacadas para el home.",
      },
      { status: 409 }
    );
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const items = await prisma.categorias.findMany({
      orderBy: [{ es_destacada_home: "desc" }, { nombre: "asc" }],
      include: {
        subcategoria_categorias: {
          include: {
            subcategorias: {
              select: {
                id: true,
                nombre: true,
                slug: true,
                activo: true,
              },
            },
          },
        },
      },
    });

    const normalizados = items.map((cat) => ({
      id: cat.id,
      nombre: cat.nombre,
      slug: cat.slug,
      activo: cat.activo,
      es_destacada_home: cat.es_destacada_home,
      creado_en: cat.creado_en,
      actualizado_en: cat.actualizado_en,
      subcategorias: cat.subcategoria_categorias
        .map((rel) => rel.subcategorias)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    }));

    return NextResponse.json({ ok: true, items: normalizados }, { status: 200 });
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

    const body = await req.json().catch(() => ({} as any));

    const nombre = String(body?.nombre ?? "").trim();
    const slugEntrada = String(body?.slug ?? "").trim();
    const slug = slugify(slugEntrada || nombre);
    const activo = body?.activo == null ? true : Boolean(body.activo);
    const es_destacada_home = Boolean(body?.es_destacada_home);

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "NOMBRE_REQUERIDO" }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ ok: false, error: "SLUG_REQUERIDO" }, { status: 400 });
    }

    const bloqueoDestacadas = await validarMaximoDestacadas({
      quiereDestacar: es_destacada_home,
    });
    if (bloqueoDestacadas) return bloqueoDestacadas;

    const item = await prisma.categorias.create({
      data: {
        nombre,
        slug,
        activo,
        es_destacada_home,
      },
    });

    revalidatePath("/");
    revalidatePath("/servicios");

    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "CATEGORIA_DUPLICADA" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR_INTERNO" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const id = Number(body?.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });
    }

    const actual = await prisma.categorias.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        slug: true,
        activo: true,
        es_destacada_home: true,
      },
    });

    if (!actual) {
      return NextResponse.json(
        { ok: false, error: "CATEGORIA_NO_EXISTE" },
        { status: 404 }
      );
    }

    const nombre =
      body?.nombre != null ? String(body.nombre).trim() : actual.nombre;

    const slugEntrada =
      body?.slug != null ? String(body.slug).trim() : "";

    const slug =
      body?.slug != null
        ? slugify(slugEntrada)
        : body?.nombre != null
        ? slugify(nombre)
        : actual.slug;

    const activo =
      body?.activo != null ? Boolean(body.activo) : actual.activo;

    const es_destacada_home =
      body?.es_destacada_home != null
        ? Boolean(body.es_destacada_home)
        : actual.es_destacada_home;

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "NOMBRE_REQUERIDO" }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ ok: false, error: "SLUG_REQUERIDO" }, { status: 400 });
    }

    const bloqueoDestacadas = await validarMaximoDestacadas({
      quiereDestacar: es_destacada_home,
      categoriaIdActual: id,
    });
    if (bloqueoDestacadas) return bloqueoDestacadas;

    const item = await prisma.categorias.update({
      where: { id },
      data: {
        nombre,
        slug,
        activo,
        es_destacada_home,
      },
    });

    revalidatePath("/");
    revalidatePath("/servicios");

    return NextResponse.json({ ok: true, item }, { status: 200 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "CATEGORIA_DUPLICADA" },
        { status: 409 }
      );
    }

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

    return NextResponse.json(
      {
        ok: false,
        error: "ELIMINACION_BLOQUEADA_TRANSICION_MODELO",
        detail:
          "La eliminación de categorías está bloqueada temporalmente mientras subcategorías termina de migrarse al modelo N:M.",
      },
      { status: 409 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR_INTERNO" },
      { status: 500 }
    );
  }
}