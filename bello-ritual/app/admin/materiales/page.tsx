"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Material = {
  id: number;
  nombre: string;
  tipo: "FISICO" | "TIEMPO";
  unidad: "UNIDAD" | "HORA" | "MINUTO" | "ML" | "G";
  costo_unitario: string | number;
  activo: boolean;
};

export default function AdminMaterialesPage() {
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // form
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<Material["tipo"]>("FISICO");
  const [unidad, setUnidad] = useState<Material["unidad"]>("UNIDAD");
  const [costo, setCosto] = useState<number>(0);

  async function checkSession() {
    const r = await fetch("/api/admin/session", { credentials: "include" });
    if (!r.ok) return false;
    const j = await r.json().catch(() => null);
    return Boolean(j?.ok);
  }

  async function loadMateriales() {
    const r = await fetch("/api/admin/materiales", { credentials: "include" });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) throw new Error(j?.error || "ERROR_CARGANDO_MATERIALES");
    setItems(j.items || []);
  }

  async function refresh() {
    setLoading(true);
    setMsg("");
    try {
      await loadMateriales();
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
    if (!n) return setMsg("NOMBRE_REQUERIDO");
    if (!Number.isFinite(costo) || costo < 0) return setMsg("COSTO_INVALIDO");

    const r = await fetch("/api/admin/materiales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nombre: n,
        tipo,
        unidad,
        costo_unitario: costo,
      }),
    });

    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      setMsg(j?.error || `ERROR_HTTP_${r.status}`);
      return;
    }

    setNombre("");
    setCosto(0);
    await refresh();
  }

  if (sessionOk === false) {
    return (
      <main style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Materiales</h1>
        <p style={{ marginTop: 12 }}>No autorizado. Ve a iniciar sesión.</p>
        <Link href="/admin/login">Ir a login</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Materiales</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        <Link href="/admin">← Volver al panel</Link>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Crear material</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre (ej: Removedor)"
          style={{ padding: 8, minWidth: 240, flex: 1 }}
        />

        <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} style={{ padding: 8 }}>
          <option value="FISICO">FISICO</option>
          <option value="TIEMPO">TIEMPO</option>
        </select>

        <select value={unidad} onChange={(e) => setUnidad(e.target.value as any)} style={{ padding: 8 }}>
          <option value="UNIDAD">UNIDAD</option>
          <option value="HORA">HORA</option>
          <option value="MINUTO">MINUTO</option>
          <option value="ML">ML</option>
          <option value="G">G</option>
        </select>

        <input
          type="number"
          value={costo}
          onChange={(e) => setCosto(Number(e.target.value))}
          style={{ padding: 8, width: 140 }}
          min={0}
          step="0.01"
          placeholder="Costo"
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
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Tipo</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Unidad</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Costo</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Activo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id}>
                <td style={{ padding: 8 }}>{m.id}</td>
                <td style={{ padding: 8 }}>{m.nombre}</td>
                <td style={{ padding: 8 }}>{m.tipo}</td>
                <td style={{ padding: 8 }}>{m.unidad}</td>
                <td style={{ padding: 8 }}>{String(m.costo_unitario)}</td>
                <td style={{ padding: 8 }}>{m.activo ? "Sí" : "No"}</td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td style={{ padding: 8 }} colSpan={6}>
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