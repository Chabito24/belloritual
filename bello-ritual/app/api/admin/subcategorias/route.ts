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

function normalizarCategoriaIds(body: any): number[] {
  const fromArray = Array.isArray(body?.categoria_ids) ? body.categoria_ids : [];
  const fromSingle =
    body?.categoria_id != null && body?.categoria_id !== ""
      ? [body.categoria_id]
      : [];

  const ids = [...fromArray, ...fromSingle]
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v) && v > 0);

  return [...new Set(ids)];
}

async function validarCategoriasExisten(categoriaIds: number[]) {
  if (categoriaIds.length === 0) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: "CATEGORIA_REQUERIDA" },
        { status: 400 }
      ),
    };
  }

  const categorias = await prisma.categorias.findMany({
    where: { id: { in: categoriaIds } },
    select: { id: true, nombre: true, activo: true },
  });

  if (categorias.length !== categoriaIds.length) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: "CATEGORIA_NO_EXISTE" },
        { status: 404 }
      ),
    };
  }

  return {
    ok: true as const,
    categorias,
  };
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const items = await prisma.subcategorias.findMany({
      orderBy: [{ nombre: "asc" }],
      include: {
        subcategoria_categorias: {
          include: {
            categorias: {
              select: {
                id: true,
                nombre: true,
                slug: true,
                activo: true,
              },
            },
          },
        },
        _count: {
          select: {
            servicios: true,
          },
        },
      },
    });

    const normalizados = items.map((sub) => {
      const categorias = sub.subcategoria_categorias
        .map((rel) => rel.categorias)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

      return {
        id: sub.id,
        nombre: sub.nombre,
        slug: sub.slug,
        activo: sub.activo,
        categoria_id_legacy: sub.categoria_id,
        categoria_ids: categorias.map((c) => c.id),
        categorias,
        servicios_count: sub._count.servicios,
        creado_en: sub.creado_en,
        actualizado_en: sub.actualizado_en,
      };
    });

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
    const categoriaIds = normalizarCategoriaIds(body);

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "NOMBRE_REQUERIDO" }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ ok: false, error: "SLUG_REQUERIDO" }, { status: 400 });
    }

    const validacionCategorias = await validarCategoriasExisten(categoriaIds);
    if (!validacionCategorias.ok) return validacionCategorias.response;

    const categoriaIdLegacy = categoriaIds[0];

    const item = await prisma.$transaction(async (tx) => {
      const creada = await tx.subcategorias.create({
        data: {
          nombre,
          slug,
          activo,
          categoria_id: categoriaIdLegacy,
        },
      });

      await tx.subcategoria_categorias.createMany({
        data: categoriaIds.map((categoriaId) => ({
          subcategoria_id: creada.id,
          categoria_id: categoriaId,
        })),
      });

      return tx.subcategorias.findUnique({
        where: { id: creada.id },
        include: {
          subcategoria_categorias: {
            include: {
              categorias: {
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
    });

    revalidatePath("/servicios");

    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "SUBCATEGORIA_DUPLICADA" },
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

    const actual = await prisma.subcategorias.findUnique({
      where: { id },
      include: {
        subcategoria_categorias: {
          select: { categoria_id: true },
        },
      },
    });

    if (!actual) {
      return NextResponse.json(
        { ok: false, error: "SUBCATEGORIA_NO_EXISTE" },
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

    const categoriaIdsBody = normalizarCategoriaIds(body);
    const categoriaIdsActuales = actual.subcategoria_categorias.map((x) => x.categoria_id);
    const categoriaIds =
      categoriaIdsBody.length > 0 ? categoriaIdsBody : categoriaIdsActuales;

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "NOMBRE_REQUERIDO" }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ ok: false, error: "SLUG_REQUERIDO" }, { status: 400 });
    }

    const validacionCategorias = await validarCategoriasExisten(categoriaIds);
    if (!validacionCategorias.ok) return validacionCategorias.response;

    const categoriaIdLegacy = categoriaIds[0];

    const item = await prisma.$transaction(async (tx) => {
      await tx.subcategorias.update({
        where: { id },
        data: {
          nombre,
          slug,
          activo,
          categoria_id: categoriaIdLegacy,
        },
      });

      await tx.subcategoria_categorias.deleteMany({
        where: { subcategoria_id: id },
      });

      await tx.subcategoria_categorias.createMany({
        data: categoriaIds.map((categoriaId) => ({
          subcategoria_id: id,
          categoria_id: categoriaId,
        })),
      });

      return tx.subcategorias.findUnique({
        where: { id },
        include: {
          subcategoria_categorias: {
            include: {
              categorias: {
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
    });

    revalidatePath("/servicios");

    return NextResponse.json({ ok: true, item }, { status: 200 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "SUBCATEGORIA_DUPLICADA" },
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

    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });
    }

    const actual = await prisma.subcategorias.findUnique({
      where: { id },
      select: { id: true, nombre: true },
    });

    if (!actual) {
      return NextResponse.json(
        { ok: false, error: "SUBCATEGORIA_NO_EXISTE" },
        { status: 404 }
      );
    }

    const uso = await prisma.servicios.count({
      where: { subcategoria_id: id },
    });

    if (uso > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "SUBCATEGORIA_EN_USO",
          detail: "No se puede eliminar porque está asociada a uno o más servicios.",
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.subcategoria_categorias.deleteMany({
        where: { subcategoria_id: id },
      });

      await tx.subcategorias.delete({
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