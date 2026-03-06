"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type UnidadMedida = {
  id: number;
  nombre: string;
  abreviatura: string;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
};

export default function AdminUnidadesMedidaPage() {
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [items, setItems] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [nombre, setNombre] = useState("");
  const [abreviatura, setAbreviatura] = useState("");

  async function checkSession() {
    const r = await fetch("/api/admin/session", { credentials: "include" });
    if (!r.ok) return false;
    const j = await r.json().catch(() => null);
    return Boolean(j?.ok);
  }

  async function loadItems() {
    const r = await fetch("/api/admin/unidades-medida", { credentials: "include" });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) throw new Error(j?.error || "ERROR_CARGANDO_UNIDADES");
    setItems(j.items || []);
  }

  async function refresh() {
    setLoading(true);
    setMsg("");
    try {
      await loadItems();
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

  async function onCrear() {
    setMsg("");

    const n = nombre.trim();
    const a = abreviatura.trim().toUpperCase();

    if (!n) return setMsg("NOMBRE_REQUERIDO");
    if (!a) return setMsg("ABREVIATURA_REQUERIDA");

    const r = await fetch("/api/admin/unidades-medida", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nombre: n,
        abreviatura: a,
      }),
    });

    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      setMsg(j?.detail || j?.error || `ERROR_HTTP_${r.status}`);
      return;
    }

    setNombre("");
    setAbreviatura("");
    await refresh();
    setMsg("UNIDAD_MEDIDA_CREADA");
  }

  async function onToggleActivo(item: UnidadMedida) {
    setMsg("");

    const r = await fetch(`/api/admin/unidades-medida/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        activo: !item.activo,
      }),
    });

    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      setMsg(j?.detail || j?.error || `ERROR_HTTP_${r.status}`);
      return;
    }

    await refresh();
    setMsg(!item.activo ? "UNIDAD_MEDIDA_ACTIVADA" : "UNIDAD_MEDIDA_INACTIVADA");
  }

  async function onEliminar(item: UnidadMedida) {
    setMsg("");

    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar la unidad de medida "${item.nombre}"?`
    );
    if (!confirmado) return;

    const r = await fetch(`/api/admin/unidades-medida/${item.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      setMsg(j?.detail || j?.error || `ERROR_HTTP_${r.status}`);
      return;
    }

    await refresh();
    setMsg("UNIDAD_MEDIDA_ELIMINADA");
  }

  if (sessionOk === false) {
    return (
      <main style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Unidades de medida</h1>
        <p style={{ marginTop: 12 }}>No autorizado. Ve a iniciar sesión.</p>
        <Link href="/admin/login">Ir a login</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1000, margin: "30px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Unidades de medida</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        <Link href="/admin">← Volver al panel</Link>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Crear unidad de medida</h2>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 10,
          alignItems: "center",
        }}
      >
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre (ej: Litro)"
          style={{ padding: 8, minWidth: 240, flex: 1 }}
        />

        <input
          value={abreviatura}
          onChange={(e) => setAbreviatura(e.target.value.toUpperCase())}
          placeholder="Abreviatura (ej: LT)"
          style={{ padding: 8, width: 180 }}
        />

        <button onClick={onCrear} style={{ padding: "8px 12px" }} disabled={loading}>
          Crear
        </button>

        <button onClick={refresh} style={{ padding: "8px 12px" }} disabled={loading}>
          Recargar
        </button>

        {loading ? <span>Cargando…</span> : null}
      </div>

      {msg ? <p style={{ marginTop: 12, color: "crimson" }}>{msg}</p> : null}

      <h2 style={{ marginTop: 20, fontSize: 18, fontWeight: 700 }}>Listado</h2>

      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>ID</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Nombre</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Abreviatura</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Activo</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: 8 }}>{u.id}</td>
                <td style={{ padding: 8 }}>{u.nombre}</td>
                <td style={{ padding: 8 }}>{u.abreviatura}</td>
                <td style={{ padding: 8 }}>{u.activo ? "Sí" : "No"}</td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => onToggleActivo(u)}
                      style={{ padding: "6px 10px" }}
                    >
                      {u.activo ? "Inactivar" : "Activar"}
                    </button>

                    <button
                      onClick={() => onEliminar(u)}
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
                <td style={{ padding: 8 }} colSpan={5}>
                  Sin unidades.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}