"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Categoria = {
  id: number;
  nombre: string;
  slug: string | null;
  activo: boolean;
};

type Subcategoria = {
  id: number;
  nombre: string;
  slug: string | null;
  activo: boolean;
  categoria_id_legacy: number | null;
  categoria_ids: number[];
  categorias: Categoria[];
  servicios_count: number;
};

export default function AdminSubcategoriasPage() {
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);

  const [subcategoriaIdEditing, setSubcategoriaIdEditing] = useState<number | null>(null);
  const [subcategoriaNombre, setSubcategoriaNombre] = useState("");
  const [subcategoriaSlug, setSubcategoriaSlug] = useState("");
  const [subcategoriaActiva, setSubcategoriaActiva] = useState(true);
  const [subcategoriaCategoriaIds, setSubcategoriaCategoriaIds] = useState<number[]>([]);

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

  function limpiarSubcategoriaForm() {
    setSubcategoriaIdEditing(null);
    setSubcategoriaNombre("");
    setSubcategoriaSlug("");
    setSubcategoriaActiva(true);
    setSubcategoriaCategoriaIds([]);
  }

  async function loadCategorias() {
    const j = await fetchJson("/api/admin/categorias");
    const items = (j.items || []).filter((c: Categoria & { activo?: boolean }) => c.activo);
    setCategorias(items);
  }

  async function loadSubcategorias() {
    const j = await fetchJson("/api/admin/subcategorias");
    setSubcategorias(j.items || []);
  }

  async function refresh() {
    setLoading(true);
    setMsg("");
    try {
      await Promise.all([loadCategorias(), loadSubcategorias()]);
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
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onGuardarSubcategoria() {
    setMsg("");

    const body = {
      ...(subcategoriaIdEditing != null ? { id: subcategoriaIdEditing } : {}),
      nombre: subcategoriaNombre.trim(),
      slug: subcategoriaSlug.trim(),
      activo: subcategoriaActiva,
      categoria_ids: subcategoriaCategoriaIds,
    };

    if (!body.nombre) return setMsg("NOMBRE_SUBCATEGORIA_REQUERIDO");
    if (body.categoria_ids.length === 0) return setMsg("CATEGORIA_REQUERIDA");

    const method = subcategoriaIdEditing == null ? "POST" : "PATCH";

    try {
      await fetchJson("/api/admin/subcategorias", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await refresh();
      const eraEdicion = subcategoriaIdEditing != null;
      limpiarSubcategoriaForm();
      setMsg(eraEdicion ? "SUBCATEGORIA_ACTUALIZADA" : "SUBCATEGORIA_CREADA");
    } catch (e: any) {
      setMsg(e?.message ?? "ERROR_INTERNO");
    }
  }

  function onEditarSubcategoria(item: Subcategoria) {
    setMsg(`Editando subcategoría #${item.id}: ${item.nombre}`);
    setSubcategoriaIdEditing(item.id);
    setSubcategoriaNombre(item.nombre);
    setSubcategoriaSlug(item.slug ?? "");
    setSubcategoriaActiva(item.activo);
    setSubcategoriaCategoriaIds(item.categoria_ids || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onToggleSubcategoria(item: Subcategoria) {
    setMsg("");
    try {
      await fetchJson("/api/admin/subcategorias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          nombre: item.nombre,
          slug: item.slug ?? "",
          activo: !item.activo,
          categoria_ids: item.categoria_ids,
        }),
      });
      await refresh();
      setMsg(!item.activo ? "SUBCATEGORIA_ACTIVADA" : "SUBCATEGORIA_INACTIVADA");
    } catch (e: any) {
      setMsg(e?.message ?? "ERROR_INTERNO");
    }
  }

  async function onEliminarSubcategoria(item: Subcategoria) {
    setMsg("");
    const ok = window.confirm(`¿Eliminar la subcategoría "${item.nombre}"?`);
    if (!ok) return;

    try {
      await fetchJson(`/api/admin/subcategorias?id=${item.id}`, {
        method: "DELETE",
      });
      await refresh();
      if (subcategoriaIdEditing === item.id) {
        limpiarSubcategoriaForm();
      }
      setMsg("SUBCATEGORIA_ELIMINADA");
    } catch (e: any) {
      setMsg(e?.message ?? "ERROR_INTERNO");
    }
  }

  function onChangeCategoriasMultiple(e: React.ChangeEvent<HTMLSelectElement>) {
    const values = Array.from(e.target.selectedOptions).map((opt) => Number(opt.value));
    setSubcategoriaCategoriaIds(values);
  }

  if (sessionOk === false) {
    return (
      <main style={{ maxWidth: 1100, margin: "30px auto", padding: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Subcategorías</h1>
        <p style={{ marginTop: 12 }}>No autorizado. Ve a iniciar sesión.</p>
        <Link href="/admin/login">Ir a login</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "30px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Subcategorías</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        <Link href="/admin">← Volver al panel</Link>
        <Link href="/admin/categorias">Ir a categorías</Link>
        <Link href="/admin/servicios">Ir a servicios</Link>
      </div>

      {msg ? <p style={{ marginTop: 12, color: "crimson", fontWeight: 600 }}>{msg}</p> : null}

      <hr style={{ margin: "20px 0" }} />

      <h2 style={{ fontSize: 20, fontWeight: 700 }}>
        {subcategoriaIdEditing == null
          ? "Crear subcategoría"
          : `Editando subcategoría #${subcategoriaIdEditing}`}
      </h2>

      <div
        style={{
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: subcategoriaIdEditing == null ? "#fff" : "#fff8e1",
          marginTop: 12,
        }}
      >
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
              value={subcategoriaNombre}
              onChange={(e) => setSubcategoriaNombre(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              placeholder="Ej: Extensiones"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Slug</label>
            <input
              value={subcategoriaSlug}
              onChange={(e) => setSubcategoriaSlug(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              placeholder="Ej: extensiones"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Activa</label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 38 }}>
              <input
                type="checkbox"
                checked={subcategoriaActiva}
                onChange={(e) => setSubcategoriaActiva(e.target.checked)}
              />
              {subcategoriaActiva ? "Sí" : "No"}
            </label>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>
            Categorías asociadas (puedes seleccionar una o varias)
          </label>
          <select
            multiple
            value={subcategoriaCategoriaIds.map(String)}
            onChange={onChangeCategoriasMultiple}
            style={{ width: "100%", minHeight: 160, padding: 8 }}
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <p style={{ marginTop: 6, fontSize: 13 }}>
            Mantén presionada la tecla <strong>Ctrl</strong> para seleccionar varias opciones.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <button
            onClick={onGuardarSubcategoria}
            style={{ padding: "8px 12px" }}
            disabled={loading}
          >
            {subcategoriaIdEditing == null ? "Crear subcategoría" : "Guardar cambios"}
          </button>

          <button onClick={refresh} style={{ padding: "8px 12px" }} disabled={loading}>
            Recargar
          </button>

          {subcategoriaIdEditing != null ? (
            <button
              onClick={limpiarSubcategoriaForm}
              style={{ padding: "8px 12px" }}
              disabled={loading}
            >
              Cancelar edición
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>ID</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Nombre</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Slug</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Categorías</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Servicios</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Activo</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {subcategorias.map((s) => (
              <tr key={s.id}>
                <td style={{ padding: 8 }}>{s.id}</td>
                <td style={{ padding: 8 }}>{s.nombre}</td>
                <td style={{ padding: 8 }}>{s.slug || "—"}</td>
                <td style={{ padding: 8 }}>
                  {s.categorias?.length ? s.categorias.map((c) => c.nombre).join(", ") : "—"}
                </td>
                <td style={{ padding: 8 }}>{s.servicios_count}</td>
                <td style={{ padding: 8 }}>{s.activo ? "Sí" : "No"}</td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => onEditarSubcategoria(s)} style={{ padding: "6px 10px" }}>
                      Editar
                    </button>
                    <button
                      onClick={() => onToggleSubcategoria(s)}
                      style={{ padding: "6px 10px" }}
                    >
                      {s.activo ? "Inactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => onEliminarSubcategoria(s)}
                      style={{ padding: "6px 10px" }}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {subcategorias.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 8 }}>
                  Sin subcategorías.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}