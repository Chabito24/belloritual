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

function toNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function calcularCostoMateriales(
  servicio_materiales: Array<{
    cantidad: any;
    materiales: { costo_unitario: any } | null;
  }>
) {
  return servicio_materiales.reduce((acc, item) => {
    const cantidad = toNumber(item.cantidad, 0);
    const costo_unitario = toNumber(item.materiales?.costo_unitario, 0);
    return acc + cantidad * costo_unitario;
  }, 0);
}

function normalizarServicio(item: any) {
  const costo_materiales = calcularCostoMateriales(item.servicio_materiales || []);
  const margen_porcentaje = toNumber(item.margen_porcentaje, 0);
  const precio_sugerido = costo_materiales + costo_materiales * (margen_porcentaje / 100);

  return {
    id: item.id,
    nombre: item.nombre,
    duracion_minutos: item.duracion_minutos,
    requiere_materiales: item.requiere_materiales,
    descripcion: item.descripcion,
    margen_porcentaje: item.margen_porcentaje,
    precio_venta: item.precio_venta,
    activo: item.activo,

    categoria_id: item.categoria_id,
    subcategoria_id: item.subcategoria_id,

    creado_en: item.creado_en,
    actualizado_en: item.actualizado_en,

    categoria: item.categorias
      ? {
          id: item.categorias.id,
          nombre: item.categorias.nombre,
          slug: item.categorias.slug,
          activo: item.categorias.activo,
        }
      : null,

    subcategoria: item.subcategorias
      ? {
          id: item.subcategorias.id,
          nombre: item.subcategorias.nombre,
          slug: item.subcategorias.slug,
          activo: item.subcategorias.activo,
        }
      : null,

    materiales_count: item.servicio_materiales?.length ?? 0,
    costo_materiales,
    precio_sugerido,
  };
}

async function resolverYValidarCategoriaSubcategoria(
  categoria_id: number | null,
  subcategoria_id: number | null
) {
  if (categoria_id != null) {
    const categoria = await prisma.categorias.findUnique({
      where: { id: categoria_id },
      select: { id: true, activo: true },
    });

    if (!categoria) {
      return {
        error: NextResponse.json(
          { ok: false, error: "CATEGORIA_NO_EXISTE" },
          { status: 404 }
        ),
      };
    }
  }

  if (subcategoria_id == null) {
    return { categoria_id };
  }

  const sub = await prisma.subcategorias.findUnique({
    where: { id: subcategoria_id },
    select: {
      id: true,
      activo: true,
      categoria_id: true,
      subcategoria_categorias: {
        select: { categoria_id: true },
      },
    },
  });

  if (!sub) {
    return {
      error: NextResponse.json(
        { ok: false, error: "SUBCATEGORIA_NO_EXISTE" },
        { status: 404 }
      ),
    };
  }

  const categoriaIdsRelacionadas = Array.from(
    new Set([sub.categoria_id, ...sub.subcategoria_categorias.map((x) => x.categoria_id)])
  ).filter((x): x is number => Number.isInteger(x) && x > 0);

  if (categoria_id == null) {
    return {
      categoria_id: categoriaIdsRelacionadas[0] ?? sub.categoria_id ?? null,
    };
  }

  if (!categoriaIdsRelacionadas.includes(categoria_id)) {
    return {
      error: NextResponse.json(
        { ok: false, error: "SUBCATEGORIA_NO_PERTENECE_A_CATEGORIA" },
        { status: 409 }
      ),
    };
  }

  return { categoria_id };
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const categoriaParam = searchParams.get("categoria_id");
    const subcategoriaParam = searchParams.get("subcategoria_id");

    const categoria_id =
      categoriaParam && Number.isFinite(Number(categoriaParam))
        ? Number(categoriaParam)
        : null;

    const subcategoria_id =
      subcategoriaParam && Number.isFinite(Number(subcategoriaParam))
        ? Number(subcategoriaParam)
        : null;

    const where = {
      ...(categoria_id && categoria_id > 0 ? { categoria_id } : {}),
      ...(subcategoria_id && subcategoria_id > 0 ? { subcategoria_id } : {}),
    };

    const items = await prisma.servicios.findMany({
      where,
      orderBy: { nombre: "asc" },
      include: {

        categorias: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            activo: true,
          },
        },

        subcategorias: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            activo: true,
          },
        },
        servicio_materiales: {
          include: {
            materiales: {
              select: {
                id: true,
                nombre: true,
                costo_unitario: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { ok: true, items: items.map(normalizarServicio) },
      { status: 200 }
    );
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

    const body = await req.json().catch(() => ({}));

    const nombre = String(body?.nombre ?? "").trim();
    const duracion_minutos =
      body?.duracion_minutos == null || body?.duracion_minutos === ""
        ? null
        : Number(body.duracion_minutos);

    const requiere_materiales = Boolean(body?.requiere_materiales);
    const descripcion =
      body?.descripcion == null ? null : String(body.descripcion).trim() || null;
    const margen_porcentaje = toNumber(body?.margen_porcentaje, 0);
    const precio_venta =
      body?.precio_venta == null || body?.precio_venta === ""
        ? null
        : Number(body.precio_venta);

    const activo = body?.activo == null ? true : Boolean(body.activo);

    const categoria_id =
      body?.categoria_id == null || body?.categoria_id === ""
        ? null
        : Number(body.categoria_id);

    const subcategoria_id =
      body?.subcategoria_id == null || body?.subcategoria_id === ""
        ? null
        : Number(body.subcategoria_id);

    if (
      categoria_id != null &&
      (!Number.isInteger(categoria_id) || categoria_id <= 0)
    ) {
      return NextResponse.json(
        { ok: false, error: "CATEGORIA_ID_INVALIDO" },
        { status: 400 }
      );
    }

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "NOMBRE_REQUERIDO" }, { status: 400 });
    }

    if (
      duracion_minutos != null &&
      (!Number.isInteger(duracion_minutos) || duracion_minutos <= 0)
    ) {
      return NextResponse.json(
        { ok: false, error: "DURACION_INVALIDA" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(margen_porcentaje) || margen_porcentaje < 0) {
      return NextResponse.json(
        { ok: false, error: "MARGEN_INVALIDO" },
        { status: 400 }
      );
    }

    if (
      precio_venta != null &&
      (!Number.isFinite(precio_venta) || precio_venta < 0)
    ) {
      return NextResponse.json(
        { ok: false, error: "PRECIO_VENTA_INVALIDO" },
        { status: 400 }
      );
    }

    if (
      subcategoria_id != null &&
      (!Number.isInteger(subcategoria_id) || subcategoria_id <= 0)
    ) {
      return NextResponse.json(
        { ok: false, error: "SUBCATEGORIA_ID_INVALIDO" },
        { status: 400 }
      );
    }

    const validacionRelacion = await resolverYValidarCategoriaSubcategoria(
      categoria_id,
      subcategoria_id
    );

if (validacionRelacion.error) return validacionRelacion.error;


    const item = await prisma.servicios.create({
      data: {
        nombre,
        duracion_minutos,
        requiere_materiales,
        descripcion,
        margen_porcentaje,
        precio_venta,
        activo,
        categoria_id: validacionRelacion.categoria_id,
        subcategoria_id,
      },
      include: {
        categorias: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            activo: true,
          },
        },
        subcategorias: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            activo: true,
          },
        },
        servicio_materiales: {
          include: {
            materiales: {
              select: {
                id: true,
                nombre: true,
                costo_unitario: true,
              },
            },
          },
        },
      },
    });



    revalidatePath("/servicios");

    return NextResponse.json(
      { ok: true, item: normalizarServicio(item) },
      { status: 201 }
    );
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "SERVICIO_DUPLICADO" },
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

    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: "ID_INVALIDO" }, { status: 400 });
    }

    const actual = await prisma.servicios.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        duracion_minutos: true,
        requiere_materiales: true,
        descripcion: true,
        margen_porcentaje: true,
        precio_venta: true,
        activo: true,
        categoria_id: true,
        subcategoria_id: true,
      },
    });


    if (!actual) {
      return NextResponse.json(
        { ok: false, error: "SERVICIO_NO_EXISTE" },
        { status: 404 }
      );
    }

    const nombre =
      body?.nombre != null ? String(body.nombre).trim() : actual.nombre;

    const duracion_minutos =
      body?.duracion_minutos != null
        ? body?.duracion_minutos === ""
          ? null
          : Number(body.duracion_minutos)
        : actual.duracion_minutos;

    const requiere_materiales =
      body?.requiere_materiales != null
        ? Boolean(body.requiere_materiales)
        : actual.requiere_materiales;

    const descripcion =
      body?.descripcion != null
        ? String(body.descripcion).trim() || null
        : actual.descripcion;

    const margen_porcentaje =
      body?.margen_porcentaje != null
        ? Number(body.margen_porcentaje)
        : toNumber(actual.margen_porcentaje, 0);

    const precio_venta =
      body?.precio_venta != null
        ? body?.precio_venta === ""
          ? null
          : Number(body.precio_venta)
        : actual.precio_venta;

    const activo =
      body?.activo != null ? Boolean(body.activo) : actual.activo;

    const categoria_id =
      body?.categoria_id != null
        ? body?.categoria_id === ""
          ? null
          : Number(body.categoria_id)
        : actual.categoria_id;

    if (
      categoria_id != null &&
      (!Number.isInteger(categoria_id) || categoria_id <= 0)
    ) {
      return NextResponse.json(
        { ok: false, error: "CATEGORIA_ID_INVALIDO" },
        { status: 400 }
      );
    }

    const subcategoria_id =
      body?.subcategoria_id != null
        ? body?.subcategoria_id === ""
          ? null
          : Number(body.subcategoria_id)
        : actual.subcategoria_id;

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "NOMBRE_REQUERIDO" }, { status: 400 });
    }

    if (
      duracion_minutos != null &&
      (!Number.isInteger(duracion_minutos) || duracion_minutos <= 0)
    ) {
      return NextResponse.json(
        { ok: false, error: "DURACION_INVALIDA" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(margen_porcentaje) || margen_porcentaje < 0) {
      return NextResponse.json(
        { ok: false, error: "MARGEN_INVALIDO" },
        { status: 400 }
      );
    }

    if (
      precio_venta != null &&
      (!Number.isFinite(Number(precio_venta)) || Number(precio_venta) < 0)
    ) {
      return NextResponse.json(
        { ok: false, error: "PRECIO_VENTA_INVALIDO" },
        { status: 400 }
      );
    }

    if (
      subcategoria_id != null &&
      (!Number.isInteger(subcategoria_id) || subcategoria_id <= 0)
    ) {
      return NextResponse.json(
        { ok: false, error: "SUBCATEGORIA_ID_INVALIDO" },
        { status: 400 }
      );
    }

    const validacionRelacion = await resolverYValidarCategoriaSubcategoria(
      categoria_id,
      subcategoria_id
    );

    if (validacionRelacion.error) return validacionRelacion.error;

   const item = await prisma.servicios.update({
    where: { id },
    data: {
      nombre,
      duracion_minutos,
      requiere_materiales,
      descripcion,
      margen_porcentaje,
      precio_venta,
      activo,
      categoria_id: validacionRelacion.categoria_id,
      subcategoria_id,
    },
      include: {
        categorias: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            activo: true,
          },
        },
        subcategorias: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            activo: true,
          },
        },
        servicio_materiales: {
          include: {
            materiales: {
              select: {
                id: true,
                nombre: true,
                costo_unitario: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/servicios");

    return NextResponse.json(
      { ok: true, item: normalizarServicio(item) },
      { status: 200 }
    );
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "SERVICIO_DUPLICADO" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR_INTERNO" },
      { status: 500 }
    );
  }
}