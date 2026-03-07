"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Categoria = {
  id: number;
  nombre: string;
  slug: string | null;
  activo: boolean;
  es_destacada_home?: boolean;
};

type Subcategoria = {
  id: number;
  nombre: string;
  slug: string | null;
  activo: boolean;
  categoria_id_legacy: number | null;
  categoria_ids: number[];
  categorias: Array<{
    id: number;
    nombre: string;
    slug: string | null;
    activo: boolean;
  }>;
  servicios_count: number;
};

type Servicio = {
  id: number;
  nombre: string;
  duracion_minutos: number | null;
  requiere_materiales: boolean;
  descripcion: string | null;
  margen_porcentaje: string | number;
  precio_venta: string | number | null;
  activo: boolean;

  categoria_id: number | null;
  subcategoria_id: number | null;

  categoria: {
    id: number;
    nombre: string;
    slug: string | null;
    activo: boolean;
  } | null;

  subcategoria: {
    id: number;
    nombre: string;
    slug: string | null;
    activo: boolean;
  } | null;

  materiales_count: number;
  costo_materiales: number;
  precio_sugerido: number;
};

type Material = {
  id: number;
  nombre: string;
  tipo: "FISICO" | "TIEMPO";
  unidad_medida_id: number | null;
  unidad: string | null;
  costo_unitario: string | number;
  activo: boolean;
  unidades_medida?: {
    id: number;
    nombre: string;
    abreviatura: string;
    activo: boolean;
  } | null;
};

type MaterialDraft = {
  uid: string;
  material_id: string;
  cantidad: string;
  nota: string;
};

function formatMoney(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export default function AdminServiciosPage() {
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);

  const [servicioIdEditing, setServicioIdEditing] = useState<number | null>(null);
  const [servicioNombre, setServicioNombre] = useState("");
  const [servicioDuracion, setServicioDuracion] = useState("");
  const [servicioRequiereMateriales, setServicioRequiereMateriales] = useState(false);
  const [servicioDescripcion, setServicioDescripcion] = useState("");
  const [servicioMargen, setServicioMargen] = useState("0");
  const [servicioPrecioVenta, setServicioPrecioVenta] = useState("");
  const [servicioActivo, setServicioActivo] = useState(true);
  const [servicioCategoriaId, setServicioCategoriaId] = useState("");
  const [servicioSubcategoriaId, setServicioSubcategoriaId] = useState("");

  const [materialesDraft, setMaterialesDraft] = useState<MaterialDraft[]>([]);
  const [usarPrecioSugerido, setUsarPrecioSugerido] = useState(true);

  const materialesActivos = useMemo(
    () => materiales.filter((m) => m.activo),
    [materiales]
  );

  const categoriasActivas = useMemo(
    () => categorias.filter((c) => c.activo),
    [categorias]
  );

  const subcategoriasFiltradas = useMemo(() => {
    if (!servicioCategoriaId) return [];

    const categoriaId = Number(servicioCategoriaId);

    return subcategorias
      .filter(
        (s) =>
          s.activo &&
          Array.isArray(s.categoria_ids) &&
          s.categoria_ids.includes(categoriaId)
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [subcategorias, servicioCategoriaId]);

  const resumenMaterialesDraft = useMemo(() => {
    const rows = materialesDraft.map((row) => {
      const materialId =
        row.material_id.trim() === "" ? null : Number(row.material_id);

      const cantidad = row.cantidad.trim() === "" ? NaN : Number(row.cantidad);

      const material = materialesActivos.find((m) => m.id === materialId);

      const costoUnitario = material ? Number(material.costo_unitario) : 0;
      const subtotal =
        material && Number.isFinite(cantidad) && cantidad > 0
          ? costoUnitario * cantidad
          : 0;

      return {
        uid: row.uid,
        material,
        materialId,
        cantidad,
        costoUnitario,
        subtotal,
      };
    });

    const costoBase = rows.reduce((acc, row) => acc + row.subtotal, 0);
    const margen = servicioMargen.trim() === "" ? 0 : Number(servicioMargen);
    const precioSugerido =
      costoBase + costoBase * ((Number.isFinite(margen) ? margen : 0) / 100);

    return {
      rows,
      costoBase,
      precioSugerido,
    };
  }, [materialesDraft, materialesActivos, servicioMargen]);

  async function checkSession() {
    const r = await fetch("/api/admin/session", { credentials: "include" });
    if (!r.ok) return false;
    const j = await r.json().catch(() => null);
    return Boolean(j?.ok);
  }

  async function fetchJson(url: string, init?: RequestInit) {
    const r = await fetch(url, { credentials: "include", ...init });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      throw new Error(j?.detail || j?.error || `ERROR_HTTP_${r.status}`);
    }
    return j;
  }

  function limpiarServicioForm() {
    setServicioIdEditing(null);
    setServicioNombre("");
    setServicioDuracion("");
    setServicioRequiereMateriales(false);
    setServicioDescripcion("");
    setServicioMargen("0");
    setServicioPrecioVenta("");
    setServicioActivo(true);
    setServicioCategoriaId("");
    setServicioSubcategoriaId("");
    setMaterialesDraft([]);
    setUsarPrecioSugerido(true);
  }

  function crearLineaMaterialVacia(): MaterialDraft {
    return {
      uid: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      material_id: "",
      cantidad: "1",
      nota: "",
    };
  }

  function agregarLineaMaterial() {
    setMaterialesDraft((prev) => [...prev, crearLineaMaterialVacia()]);
  }

  function actualizarLineaMaterial(
    uid: string,
    campo: keyof Omit<MaterialDraft, "uid">,
    valor: string
  ) {
    setMaterialesDraft((prev) =>
      prev.map((item) =>
        item.uid === uid ? { ...item, [campo]: valor } : item
      )
    );
  }

  function eliminarLineaMaterial(uid: string) {
    setMaterialesDraft((prev) => prev.filter((item) => item.uid !== uid));
  }

  function prepararMaterialesDraftParaGuardar() {
    if (!servicioRequiereMateriales) {
      return {
        ok: true as const,
        items: [] as Array<{
          material_id: number;
          cantidad: number;
          nota: string;
        }>,
      };
    }

    const rows = materialesDraft.map((row) => ({
      material_id:
        row.material_id.trim() === "" ? null : Number(row.material_id),
      cantidad: row.cantidad.trim() === "" ? NaN : Number(row.cantidad),
      nota: row.nota.trim(),
    }));

    if (rows.length === 0) {
      return { ok: false as const, error: "AGREGA_AL_MENOS_UN_MATERIAL" };
    }

    const usados = new Set<number>();

    for (const row of rows) {
      if (
        row.material_id == null ||
        !Number.isInteger(row.material_id) ||
        row.material_id <= 0
      ) {
        return { ok: false as const, error: "MATERIAL_REQUERIDO_EN_LISTADO" };
      }

      if (!Number.isFinite(row.cantidad) || row.cantidad <= 0) {
        return { ok: false as const, error: "CANTIDAD_INVALIDA_EN_LISTADO" };
      }

      if (usados.has(row.material_id)) {
        return { ok: false as const, error: "MATERIAL_DUPLICADO_EN_LISTADO" };
      }

      usados.add(row.material_id);
    }

    return {
      ok: true as const,
      items: rows.map((row) => ({
        material_id: row.material_id as number,
        cantidad: row.cantidad,
        nota: row.nota,
      })),
    };
  }

  async function loadSubcategorias() {
    const j = await fetchJson("/api/admin/subcategorias");
    setSubcategorias(j.items || []);
  }

  async function loadCategorias() {
    const j = await fetchJson("/api/admin/categorias");
    setCategorias(j.items || []);
  }

  async function loadServicios() {
    const j = await fetchJson("/api/admin/servicios");
    setServicios(j.items || []);
  }

  async function loadMateriales() {
    const j = await fetchJson("/api/admin/materiales");
    setMateriales(j.items || []);
  }

  async function refreshAll() {
    setLoading(true);
    setMsg("");
    try {
      await Promise.all([
        loadCategorias(),
        loadSubcategorias(),
        loadServicios(),
        loadMateriales(),
      ]);
    } catch (e: any) {
      setMsg(e?.message ?? "ERROR_INTERNO");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const ok = await checkSession();
      setSessionOk(ok);
      if (!ok) return;
      await refreshAll();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onGuardarServicio() {
    setMsg("");

    const eraEdicion = servicioIdEditing != null;

    const body: any = {
      ...(eraEdicion ? { id: servicioIdEditing } : {}),
      nombre: servicioNombre.trim(),
      duracion_minutos:
        servicioDuracion.trim() === "" ? null : Number(servicioDuracion),
      requiere_materiales: servicioRequiereMateriales,
      descripcion: servicioDescripcion.trim(),
      margen_porcentaje:
        servicioMargen.trim() === "" ? 0 : Number(servicioMargen),
      activo: servicioActivo,
      categoria_id:
        servicioCategoriaId.trim() === "" ? null : Number(servicioCategoriaId),
      subcategoria_id:
        servicioSubcategoriaId.trim() === ""
          ? null
          : Number(servicioSubcategoriaId),
    };

    if (!body.nombre) return setMsg("NOMBRE_SERVICIO_REQUERIDO");
    if (!body.categoria_id) return setMsg("CATEGORIA_REQUERIDA");
    if (!body.subcategoria_id) return setMsg("SUBCATEGORIA_REQUERIDA");

    const materialesPreparados = eraEdicion
      ? {
          ok: true as const,
          items: [] as Array<{
            material_id: number;
            cantidad: number;
            nota: string;
          }>,
        }
      : prepararMaterialesDraftParaGuardar();

    if (!materialesPreparados.ok) return setMsg(materialesPreparados.error);

    if (!servicioRequiereMateriales) {
      body.precio_venta =
        servicioPrecioVenta.trim() === "" ? null : Number(servicioPrecioVenta);
    } else {
      if (usarPrecioSugerido) {
        body.precio_venta = resumenMaterialesDraft.precioSugerido;
      } else {
        body.precio_venta =
          servicioPrecioVenta.trim() === ""
            ? null
            : Number(servicioPrecioVenta);
      }
    }

    try {
      const j = await fetchJson("/api/admin/servicios", {
        method: eraEdicion ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const servicioId = j?.item?.id ?? servicioIdEditing;
      if (!servicioId) {
        throw new Error("SERVICIO_ID_NO_DISPONIBLE");
      }

      if (!eraEdicion && servicioRequiereMateriales) {
        for (const item of materialesPreparados.items) {
          await fetchJson("/api/admin/servicios/materiales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              servicio_id: servicioId,
              material_id: item.material_id,
              cantidad: item.cantidad,
              nota: item.nota,
            }),
          });
        }
      }

      await refreshAll();
      limpiarServicioForm();

      if (servicioRequiereMateriales) {
        setMsg(
          eraEdicion
            ? "SERVICIO_ACTUALIZADO"
            : "SERVICIO_CREADO_CON_MATERIALES"
        );
      } else {
        setMsg(eraEdicion ? "SERVICIO_ACTUALIZADO" : "SERVICIO_CREADO");
      }
    } catch (e: any) {
      setMsg(e?.message ?? "ERROR_INTERNO");
    }
  }

  function onEditarServicio(item: Servicio) {
    setMsg("");
    setServicioIdEditing(item.id);
    setServicioNombre(item.nombre);
    setServicioDuracion(
      item.duracion_minutos == null ? "" : String(item.duracion_minutos)
    );
    setServicioRequiereMateriales(item.requiere_materiales);
    setServicioDescripcion(item.descripcion ?? "");
    setServicioMargen(String(item.margen_porcentaje ?? "0"));
    setServicioPrecioVenta(
      item.precio_venta == null ? "" : String(item.precio_venta)
    );
    setServicioActivo(item.activo);
    setServicioCategoriaId(
      item.categoria_id == null ? "" : String(item.categoria_id)
    );
    setServicioSubcategoriaId(
      item.subcategoria_id == null ? "" : String(item.subcategoria_id)
    );
    setMaterialesDraft([]);
    setUsarPrecioSugerido(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onToggleServicio(item: Servicio) {
    setMsg("");
    try {
      await fetchJson("/api/admin/servicios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          activo: !item.activo,
        }),
      });
      await refreshAll();
      setMsg(!item.activo ? "SERVICIO_ACTIVADO" : "SERVICIO_INACTIVADO");
    } catch (e: any) {
      setMsg(e?.message ?? "ERROR_INTERNO");
    }
  }

  async function onEliminarServicio(item: Servicio) {
    setMsg("");
    const ok = window.confirm(`¿Eliminar el servicio "${item.nombre}"?`);
    if (!ok) return;

    try {
      await fetchJson(`/api/admin/servicios/${item.id}`, {
        method: "DELETE",
      });
      await refreshAll();
      if (servicioIdEditing === item.id) {
        limpiarServicioForm();
      }
      setMsg("SERVICIO_ELIMINADO");
    } catch (e: any) {
      setMsg(e?.message ?? "ERROR_INTERNO");
    }
  }

  if (sessionOk === false) {
    return (
      <main style={{ maxWidth: 1200, margin: "30px auto", padding: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Servicios</h1>
        <p style={{ marginTop: 12 }}>No autorizado. Ve a iniciar sesión.</p>
        <Link href="/admin/login">Ir a login</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: "30px auto", padding: 16 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700 }}>Servicios</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        <Link href="/admin">← Volver al panel</Link>
        <Link href="/admin/categorias">Categorías</Link>
        <Link href="/admin/subcategorias">Subcategorías</Link>
        <Link href="/admin/unidades-medida">Unidades de medida</Link>
        <Link href="/admin/materiales">Materiales</Link>
      </div>

      {msg ? (
        <p style={{ marginTop: 12, color: "crimson", fontWeight: 600 }}>
          {msg}
        </p>
      ) : null}

      <hr style={{ margin: "20px 0" }} />

      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>
          {servicioIdEditing == null
            ? "Crear servicio"
            : `Editar servicio #${servicioIdEditing}`}
        </h2>

        <div
          style={{
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: servicioIdEditing == null ? "#fff" : "#fff8e1",
            marginTop: 12,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Datos del servicio
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
              alignItems: "end",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Nombre</label>
              <input
                value={servicioNombre}
                onChange={(e) => setServicioNombre(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                placeholder="Ej: Extensiones clásicas"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>
                Duración (minutos)
              </label>
              <input
                type="number"
                value={servicioDuracion}
                onChange={(e) => setServicioDuracion(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                min={1}
                placeholder="90"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>
                Categoría
              </label>
              <select
                value={servicioCategoriaId}
                onChange={(e) => {
                  setServicioCategoriaId(e.target.value);
                  setServicioSubcategoriaId("");
                }}
                style={{ width: "100%", padding: 8 }}
              >
                <option value="">Seleccione categoría</option>
                {categoriasActivas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>
                Subcategoría
              </label>
              <select
                value={servicioSubcategoriaId}
                onChange={(e) => setServicioSubcategoriaId(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                disabled={!servicioCategoriaId}
              >
                <option value="">
                  {servicioCategoriaId
                    ? "Seleccione subcategoría"
                    : "Primero seleccione categoría"}
                </option>
                {subcategoriasFiltradas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Margen %</label>
              <input
                type="number"
                value={servicioMargen}
                onChange={(e) => setServicioMargen(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                min={0}
                step="0.01"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Activo</label>
              <label
                style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 38 }}
              >
                <input
                  type="checkbox"
                  checked={servicioActivo}
                  onChange={(e) => setServicioActivo(e.target.checked)}
                />
                {servicioActivo ? "Sí" : "No"}
              </label>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>
                Usa materiales
              </label>
              <label
                style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 38 }}
              >
                <input
                  type="checkbox"
                  checked={servicioRequiereMateriales}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setServicioRequiereMateriales(checked);

                    if (checked) {
                      setMaterialesDraft((prev) =>
                        prev.length > 0 ? prev : [crearLineaMaterialVacia()]
                      );
                    } else {
                      setMaterialesDraft([]);
                    }
                  }}
                />
                {servicioRequiereMateriales ? "Sí" : "No"}
              </label>
            </div>
          </div>

          {servicioRequiereMateriales ? (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
                Materiales del servicio
              </h3>

              <div style={{ display: "grid", gap: 10 }}>
                {materialesDraft.map((row) => (
                  <div
                    key={row.uid}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 2fr auto auto",
                      gap: 10,
                      alignItems: "end",
                    }}
                  >
                    <div>
                      <label style={{ display: "block", marginBottom: 6 }}>
                        Material
                      </label>
                      <select
                        value={row.material_id}
                        onChange={(e) =>
                          actualizarLineaMaterial(
                            row.uid,
                            "material_id",
                            e.target.value
                          )
                        }
                        style={{ width: "100%", padding: 8 }}
                      >
                        <option value="">Seleccione material</option>
                        {materialesActivos.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: 6 }}>
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.0001"
                        value={row.cantidad}
                        onChange={(e) =>
                          actualizarLineaMaterial(row.uid, "cantidad", e.target.value)
                        }
                        style={{ width: "100%", padding: 8 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: 6 }}>
                        Nota
                      </label>
                      <input
                        type="text"
                        value={row.nota}
                        onChange={(e) =>
                          actualizarLineaMaterial(row.uid, "nota", e.target.value)
                        }
                        style={{ width: "100%", padding: 8 }}
                        placeholder="Opcional"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={agregarLineaMaterial}
                      style={{ padding: "8px 12px", height: 38 }}
                      title="Agregar otra línea"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() => eliminarLineaMaterial(row.uid)}
                      style={{ padding: "8px 12px", height: 38 }}
                      disabled={materialesDraft.length === 1}
                      title="Eliminar línea"
                    >
                      −
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {servicioRequiereMateriales ? (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 8,
                background: "#fafafa",
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
                Precio del servicio
              </h3>

              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <span>
                  <strong>Costo base:</strong>{" "}
                  {formatMoney(resumenMaterialesDraft.costoBase)}
                </span>
                <span>
                  <strong>Precio sugerido:</strong>{" "}
                  {formatMoney(resumenMaterialesDraft.precioSugerido)}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="radio"
                    name="modo_precio_servicio"
                    checked={usarPrecioSugerido}
                    onChange={() => setUsarPrecioSugerido(true)}
                  />
                  Usar precio sugerido
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="radio"
                    name="modo_precio_servicio"
                    checked={!usarPrecioSugerido}
                    onChange={() => setUsarPrecioSugerido(false)}
                  />
                  Asignar precio manual
                </label>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6 }}>
                  Precio venta
                </label>
                <input
                  type="number"
                  value={
                    usarPrecioSugerido
                      ? String(
                          Number(resumenMaterialesDraft.precioSugerido.toFixed(2))
                        )
                      : servicioPrecioVenta
                  }
                  onChange={(e) => {
                    if (!usarPrecioSugerido) {
                      setServicioPrecioVenta(e.target.value);
                    }
                  }}
                  style={{ width: "100%", padding: 8 }}
                  min={0}
                  step="0.01"
                  disabled={usarPrecioSugerido}
                  placeholder="Precio final"
                />
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                Precio venta
              </label>
              <input
                type="number"
                value={servicioPrecioVenta}
                onChange={(e) => setServicioPrecioVenta(e.target.value)}
                style={{ width: "100%", padding: 8 }}
                min={0}
                step="0.01"
                placeholder="Precio final"
              />
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", marginBottom: 6 }}>
              Descripción
            </label>
            <textarea
              value={servicioDescripcion}
              onChange={(e) => setServicioDescripcion(e.target.value)}
              style={{ width: "100%", minHeight: 90, padding: 8 }}
              placeholder="Descripción del servicio"
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button
              onClick={onGuardarServicio}
              style={{ padding: "8px 12px" }}
              disabled={loading}
            >
              {servicioIdEditing == null ? "Guardar servicio" : "Guardar cambios"}
            </button>
            <button
              onClick={refreshAll}
              style={{ padding: "8px 12px" }}
              disabled={loading}
            >
              Recargar
            </button>
            {servicioIdEditing != null ? (
              <button
                onClick={limpiarServicioForm}
                style={{ padding: "8px 12px" }}
                disabled={loading}
              >
                Cancelar edición
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Listado de servicios</h2>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}
                >
                  ID
                </th>
                <th
                  style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}
                >
                  Nombre
                </th>
                <th
                  style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}
                >
                  Subcategoría
                </th>
                <th
                  style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}
                >
                  Duración
                </th>
                <th
                  style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}
                >
                  Usa materiales
                </th>
                <th
                  style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}
                >
                  Costo base
                </th>
                <th
                  style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}
                >
                  Sugerido
                </th>
                <th
                  style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}
                >
                  Venta
                </th>
                <th
                  style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}
                >
                  Activo
                </th>
                <th
                  style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: 8 }}>{s.id}</td>
                  <td style={{ padding: 8 }}>{s.nombre}</td>
                  <td style={{ padding: 8 }}>{s.subcategoria?.nombre || "—"}</td>
                  <td style={{ padding: 8 }}>{s.duracion_minutos ?? "—"}</td>
                  <td style={{ padding: 8 }}>{s.requiere_materiales ? "Sí" : "No"}</td>
                  <td style={{ padding: 8 }}>{formatMoney(s.costo_materiales)}</td>
                  <td style={{ padding: 8 }}>{formatMoney(s.precio_sugerido)}</td>
                  <td style={{ padding: 8 }}>{formatMoney(s.precio_venta)}</td>
                  <td style={{ padding: 8 }}>{s.activo ? "Sí" : "No"}</td>
                  <td style={{ padding: 8 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => onEditarServicio(s)}
                        style={{ padding: "6px 10px" }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onToggleServicio(s)}
                        style={{ padding: "6px 10px" }}
                      >
                        {s.activo ? "Inactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => onEliminarServicio(s)}
                        style={{ padding: "6px 10px" }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {servicios.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 8 }}>
                    Sin servicios.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
