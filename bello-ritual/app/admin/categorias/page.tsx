"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Categoria = {
  id: number;
  nombre: string;
  slug: string | null;
  activo: boolean;
  es_destacada_home: boolean;
  subcategorias?: Array<{
    id: number;
    nombre: string;
    slug: string | null;
    activo: boolean;
  }>;
};

export default function AdminCategoriasPage() {
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [categoriaIdEditing, setCategoriaIdEditing] = useState<number | null>(null);
  const [categoriaNombre, setCategoriaNombre] = useState("");
  const [categoriaSlug, setCategoriaSlug] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState(true);
  const [categoriaDestacada, setCategoriaDestacada] = useState(false);

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

  function limpiarCategoriaForm() {
    setCategoriaIdEditing(null);
    setCategoriaNombre("");
    setCategoriaSlug("");
    setCategoriaActiva(true);
    setCategoriaDestacada(false);
  }

  async function loadCategorias() {
    const j = await fetchJson("/api/admin/categorias");
    setCategorias(j.items || []);
  }

  async function refresh() {
    setLoading(true);
    setMsg("");
    try {
      await loadCategorias();
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

  async function onGuardarCategoria() {
    setMsg("");

    const body = {
      ...(categoriaIdEditing != null ? { id: categoriaIdEditing } : {}),
      nombre: categoriaNombre.trim(),
      slug: categoriaSlug.trim(),
      activo: categoriaActiva,
      es_destacada_home: categoriaDestacada,
    };

    if (!body.nombre) return setMsg("NOMBRE_CATEGORIA_REQUERIDO");

    const method = categoriaIdEditing == null ? "POST" : "PATCH";

    try {
      await fetchJson("/api/admin/categorias", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await refresh();
      const eraEdicion = categoriaIdEditing != null;
      limpiarCategoriaForm();
      setMsg(eraEdicion ? "CATEGORIA_ACTUALIZADA" : "CATEGORIA_CREADA");
    } catch (e: any) {
      setMsg(e?.message ?? "ERROR_INTERNO");
    }
  }

  function onEditarCategoria(item: Categoria) {
    setMsg(`Editando categoría #${item.id}: ${item.nombre}`);
    setCategoriaIdEditing(item.id);
    setCategoriaNombre(item.nombre);
    setCategoriaSlug(item.slug ?? "");
    setCategoriaActiva(item.activo);
    setCategoriaDestacada(item.es_destacada_home);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onToggleCategoria(item: Categoria) {
    setMsg("");
    try {
      await fetchJson("/api/admin/categorias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          nombre: item.nombre,
          slug: item.slug ?? "",
          activo: !item.activo,
          es_destacada_home: item.es_destacada_home,
        }),
      });
      await refresh();
      setMsg(!item.activo ? "CATEGORIA_ACTIVADA" : "CATEGORIA_INACTIVADA");
    } catch (e: any) {
      setMsg(e?.message ?? "ERROR_INTERNO");
    }
  }

  async function onEliminarCategoria(item: Categoria) {
    setMsg("");
    const ok = window.confirm(
      `¿Seguro que deseas eliminar la categoría "${item.nombre}"?`
    );
    if (!ok) return;

    try {
      await fetchJson("/api/admin/categorias", {
        method: "DELETE",
      });
      await refresh();
      setMsg("CATEGORIA_ELIMINADA");
    } catch (e: any) {
      setMsg(e?.message ?? "ERROR_INTERNO");
    }
  }

  if (sessionOk === false) {
    return (
      <main style={{ maxWidth: 1100, margin: "30px auto", padding: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Categorías</h1>
        <p style={{ marginTop: 12 }}>No autorizado. Ve a iniciar sesión.</p>
        <Link href="/admin/login">Ir a login</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "30px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Categorías</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        <Link href="/admin">← Volver al panel</Link>
        <Link href="/admin/servicios">Ir a servicios</Link>
      </div>

      {msg ? <p style={{ marginTop: 12, color: "crimson", fontWeight: 600 }}>{msg}</p> : null}

      <hr style={{ margin: "20px 0" }} />

      <h2 style={{ fontSize: 20, fontWeight: 700 }}>
        {categoriaIdEditing == null
          ? "Crear categoría"
          : `Editando categoría #${categoriaIdEditing}`}
      </h2>

      <div
        style={{
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: categoriaIdEditing == null ? "#fff" : "#fff8e1",
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
              value={categoriaNombre}
              onChange={(e) => setCategoriaNombre(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              placeholder="Ej: Pestañas"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Slug</label>
            <input
              value={categoriaSlug}
              onChange={(e) => setCategoriaSlug(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              placeholder="Ej: pestanas"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Activa</label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 38 }}>
              <input
                type="checkbox"
                checked={categoriaActiva}
                onChange={(e) => setCategoriaActiva(e.target.checked)}
              />
              {categoriaActiva ? "Sí" : "No"}
            </label>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Destacada en home</label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 38 }}>
              <input
                type="checkbox"
                checked={categoriaDestacada}
                onChange={(e) => setCategoriaDestacada(e.target.checked)}
              />
              {categoriaDestacada ? "Sí" : "No"}
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <button onClick={onGuardarCategoria} style={{ padding: "8px 12px" }} disabled={loading}>
            {categoriaIdEditing == null ? "Crear categoría" : "Guardar cambios"}
          </button>
          <button onClick={refresh} style={{ padding: "8px 12px" }} disabled={loading}>
            Recargar
          </button>
          {categoriaIdEditing != null ? (
            <button
              onClick={limpiarCategoriaForm}
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
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Home</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Activo</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Subcategorías</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id}>
                <td style={{ padding: 8 }}>{c.id}</td>
                <td style={{ padding: 8 }}>{c.nombre}</td>
                <td style={{ padding: 8 }}>{c.slug || "—"}</td>
                <td style={{ padding: 8 }}>{c.es_destacada_home ? "Sí" : "No"}</td>
                <td style={{ padding: 8 }}>{c.activo ? "Sí" : "No"}</td>
                <td style={{ padding: 8 }}>
                  {c.subcategorias?.length
                    ? c.subcategorias.map((s) => s.nombre).join(", ")
                    : "—"}
                </td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => onEditarCategoria(c)} style={{ padding: "6px 10px" }}>
                      Editar
                    </button>
                    <button
                      onClick={() => onToggleCategoria(c)}
                      style={{ padding: "6px 10px" }}
                    >
                      {c.activo ? "Inactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => onEliminarCategoria(c)}
                      style={{ padding: "6px 10px" }}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categorias.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 8 }}>
                  Sin categorías.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}