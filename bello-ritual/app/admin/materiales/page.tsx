"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TipoMaterial = "FISICO" | "TIEMPO";

type UnidadMedida = {
  id: number;
  nombre: string;
  abreviatura: string;
  activo: boolean;
};

type Material = {
  id: number;
  nombre: string;
  tipo: TipoMaterial;
  unidad_medida_id: number | null;
  unidad: string | null;
  costo_unitario: string | number;
  activo: boolean;
  unidades_medida?: UnidadMedida | null;
};

export default function AdminMaterialesPage() {
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [items, setItems] = useState<Material[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoMaterial>("FISICO");
  const [unidadMedidaId, setUnidadMedidaId] = useState<string>("");
  const [costo, setCosto] = useState<string>("0");
  const [activo, setActivo] = useState(true);

  async function checkSession() {
    const r = await fetch("/api/admin/session", { credentials: "include" });
    if (!r.ok) return false;
    const j = await r.json().catch(() => null);
    return Boolean(j?.ok);
  }

  function limpiarFormulario(unidadesDisponibles: UnidadMedida[] = unidades) {
    setEditingId(null);
    setNombre("");
    setTipo("FISICO");
    setCosto("0");
    setActivo(true);
    setUnidadMedidaId(unidadesDisponibles.length > 0 ? String(unidadesDisponibles[0].id) : "");
  }

  async function loadMateriales() {
    const r = await fetch("/api/admin/materiales", { credentials: "include" });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) throw new Error(j?.error || "ERROR_CARGANDO_MATERIALES");
    setItems(j.items || []);
  }

  async function loadUnidades() {
    const r = await fetch("/api/admin/unidades-medida", { credentials: "include" });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) throw new Error(j?.error || "ERROR_CARGANDO_UNIDADES");

    const activas = (j.items || []).filter((u: UnidadMedida) => u.activo);
    setUnidades(activas);

    setUnidadMedidaId((prev) => {
      if (prev) return prev;
      return activas.length > 0 ? String(activas[0].id) : "";
    });
  }

  async function refresh() {
    setLoading(true);
    setMsg("");
    try {
      await Promise.all([loadMateriales(), loadUnidades()]);
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

      setLoading(true);
      try {
        const r = await fetch("/api/admin/unidades-medida", { credentials: "include" });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.ok) throw new Error(j?.error || "ERROR_CARGANDO_UNIDADES");

        const activas = (j.items || []).filter((u: UnidadMedida) => u.activo);
        setUnidades(activas);
        limpiarFormulario(activas);

        const r2 = await fetch("/api/admin/materiales", { credentials: "include" });
        const j2 = await r2.json().catch(() => null);
        if (!r2.ok || !j2?.ok) throw new Error(j2?.error || "ERROR_CARGANDO_MATERIALES");
        setItems(j2.items || []);
      } catch (e: any) {
        setMsg(e?.message ?? "ERROR_INTERNO");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onGuardar() {
    setMsg("");

    const n = nombre.trim();
    if (!n) return setMsg("NOMBRE_REQUERIDO");
    if (!unidadMedidaId) return setMsg("UNIDAD_MEDIDA_REQUERIDA");

    const costoNumerico = Number(costo);
    if (!Number.isFinite(costoNumerico) || costoNumerico < 0) {
      return setMsg("COSTO_INVALIDO");
    }

    const body = {
      nombre: n,
      tipo,
      unidad_medida_id: Number(unidadMedidaId),
      costo_unitario: costoNumerico,
      activo,
    };

    const url =
      editingId === null
        ? "/api/admin/materiales"
        : `/api/admin/materiales/${editingId}`;

    const method = editingId === null ? "POST" : "PATCH";

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      setMsg(j?.detail || j?.error || `ERROR_HTTP_${r.status}`);
      return;
    }

    await refresh();
    limpiarFormulario();
    setMsg(editingId === null ? "MATERIAL_CREADO" : "MATERIAL_ACTUALIZADO");
  }

  function onEditar(item: Material) {
    setMsg("");
    setEditingId(item.id);
    setNombre(item.nombre);
    setTipo(item.tipo);
    setUnidadMedidaId(item.unidad_medida_id ? String(item.unidad_medida_id) : "");
    setCosto(String(item.costo_unitario ?? "0"));
    setActivo(item.activo);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onToggleActivo(item: Material) {
    setMsg("");

    const r = await fetch(`/api/admin/materiales/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nombre: item.nombre,
        tipo: item.tipo,
        unidad_medida_id: item.unidad_medida_id,
        costo_unitario: Number(item.costo_unitario),
        activo: !item.activo,
      }),
    });

    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      setMsg(j?.detail || j?.error || `ERROR_HTTP_${r.status}`);
      return;
    }

    await refresh();
    setMsg(!item.activo ? "MATERIAL_ACTIVADO" : "MATERIAL_DESACTIVADO");
  }

  async function onEliminar(item: Material) {
    setMsg("");

    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar el material "${item.nombre}"?`
    );
    if (!confirmado) return;

    const r = await fetch(`/api/admin/materiales/${item.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      setMsg(j?.detail || j?.error || `ERROR_HTTP_${r.status}`);
      return;
    }

    if (editingId === item.id) {
      limpiarFormulario();
    }

    await refresh();
    setMsg("MATERIAL_ELIMINADO");
  }

  if (sessionOk === false) {
    return (
      <main style={{ maxWidth: 1100, margin: "30px auto", padding: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Materiales</h1>
        <p style={{ marginTop: 12 }}>No autorizado. Ve a iniciar sesión.</p>
        <Link href="/admin/login">Ir a login</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "30px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Materiales</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        <Link href="/admin">← Volver al panel</Link>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h2 style={{ fontSize: 18, fontWeight: 700 }}>
        {editingId === null ? "Crear material" : `Editar material #${editingId}`}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
          marginTop: 12,
          alignItems: "end",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Removedor"
            style={{ padding: 8, width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMaterial)}
            style={{ padding: 8, width: "100%" }}
          >
            <option value="FISICO">FISICO</option>
            <option value="TIEMPO">TIEMPO</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Unidad de medida</label>
          <select
            value={unidadMedidaId}
            onChange={(e) => setUnidadMedidaId(e.target.value)}
            style={{ padding: 8, width: "100%" }}
          >
            <option value="">Seleccione unidad</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} ({u.abreviatura})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Costo unitario</label>
          <input
            type="number"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            style={{ padding: 8, width: "100%" }}
            min={0}
            step="0.01"
            placeholder="Costo"
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>Activo</label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 38 }}>
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
            {activo ? "Sí" : "No"}
          </label>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <button onClick={onGuardar} style={{ padding: "8px 12px" }} disabled={loading}>
          {editingId === null ? "Crear" : "Guardar cambios"}
        </button>

        <button onClick={refresh} style={{ padding: "8px 12px" }} disabled={loading}>
          Recargar
        </button>

        {editingId !== null ? (
          <button
            onClick={() => {
              limpiarFormulario();
              setMsg("");
            }}
            style={{ padding: "8px 12px" }}
            disabled={loading}
          >
            Cancelar edición
          </button>
        ) : null}

        {loading ? <span>Cargando…</span> : null}
      </div>

      {msg ? <p style={{ marginTop: 12, color: "crimson" }}>{msg}</p> : null}

      <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 700 }}>Listado</h2>

      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>ID</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Nombre</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Tipo</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Unidad</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Costo</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Activo</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id}>
                <td style={{ padding: 8 }}>{m.id}</td>
                <td style={{ padding: 8 }}>{m.nombre}</td>
                <td style={{ padding: 8 }}>{m.tipo}</td>
                <td style={{ padding: 8 }}>
                  {m.unidades_medida
                    ? `${m.unidades_medida.nombre} (${m.unidades_medida.abreviatura})`
                    : m.unidad || "—"}
                </td>
                <td style={{ padding: 8 }}>{String(m.costo_unitario)}</td>
                <td style={{ padding: 8 }}>{m.activo ? "Sí" : "No"}</td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => onEditar(m)} style={{ padding: "6px 10px" }}>
                      Editar
                    </button>

                    <button
                      onClick={() => onToggleActivo(m)}
                      style={{ padding: "6px 10px" }}
                    >
                      {m.activo ? "Desactivar" : "Activar"}
                    </button>

                    <button
                      onClick={() => onEliminar(m)}
                      style={{ padding: "6px 10px" }}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td style={{ padding: 8 }} colSpan={7}>
                  Sin materiales.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}