"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Material = {
  id: number;
  nombre: string;
  tipo: "FISICO" | "TIEMPO";
  unidad: "UNIDAD" | "HORA" | "MINUTO" | "ML" | "G";
  costo_unitario: string | number;
};

type ServicioMaterialItem = {
  servicio_id: number;
  material_id: number;
  cantidad: string | number;
  nota: string | null;
  materiales: Material;
};

export default function AdminServiciosPage() {
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);

  const [servicioId, setServicioId] = useState<number>(1);

  const [materiales, setMateriales] = useState<Material[]>([]);
  const [items, setItems] = useState<ServicioMaterialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [materialId, setMaterialId] = useState<number | "">("");
  const [cantidad, setCantidad] = useState<number>(1);
  const [nota, setNota] = useState<string>("");

  const materialesById = useMemo(() => {
    const m = new Map<number, Material>();
    for (const x of materiales) m.set(x.id, x);
    return m;
  }, [materiales]);

  async function checkSession() {
    const r = await fetch("/api/admin/session", { credentials: "include" });
    if (!r.ok) return false;
    const j = await r.json().catch(() => null);
    return Boolean(j?.ok);
  }

  async function loadMateriales() {
    const r = await fetch("/api/admin/materiales", { credentials: "include" });
    const j = await r.json();
    if (!r.ok || !j?.ok) throw new Error(j?.error || "ERROR_CARGANDO_MATERIALES");
    setMateriales(j.items || []);
  }

  async function loadServicioMateriales(id: number) {
    const r = await fetch(`/api/admin/servicios/materiales?servicio_id=${id}`, {
      credentials: "include",
    });
    const j = await r.json();
    if (!r.ok || !j?.ok) throw new Error(j?.error || "ERROR_CARGANDO_SERVICIO_MATERIALES");
    setItems(j.items || []);
  }

  async function refreshAll(id = servicioId) {
    setLoading(true);
    setMsg("");
    try {
      await Promise.all([loadMateriales(), loadServicioMateriales(id)]);
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
      await refreshAll(servicioId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onBuscar() {
    if (!Number.isFinite(servicioId) || servicioId <= 0) {
      setMsg("SERVICIO_ID_INVALIDO");
      return;
    }
    await refreshAll(servicioId);
  }

  async function onAsignar() {
    setMsg("");
    if (!materialId) return setMsg("MATERIAL_ID_REQUERIDO");
    if (!Number.isFinite(cantidad) || cantidad <= 0) return setMsg("CANTIDAD_INVALIDA");

    const r = await fetch("/api/admin/servicios/materiales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        servicio_id: servicioId,
        material_id: materialId,
        cantidad,
        nota: nota.trim() ? nota.trim() : null,
      }),
    });

    const text = await r.text();
    if (!r.ok) {
      setMsg(text || `ERROR_HTTP_${r.status}`);
      return;
    }

    setMaterialId("");
    setCantidad(1);
    setNota("");
    await refreshAll(servicioId);
  }

  async function onEliminar(mid: number) {
    setMsg("");
    const r = await fetch(
      `/api/admin/servicios/materiales?servicio_id=${servicioId}&material_id=${mid}`,
      { method: "DELETE", credentials: "include" }
    );
    const text = await r.text();
    if (!r.ok) {
      setMsg(text || `ERROR_HTTP_${r.status}`);
      return;
    }
    await refreshAll(servicioId);
  }

  if (sessionOk === false) {
    return (
      <main style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Servicios</h1>
        <p style={{ marginTop: 12 }}>No autorizado. Ve a iniciar sesión.</p>
        <Link href="/admin/login">Ir a login</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Servicios</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        <Link href="/admin">← Volver al panel</Link>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>Servicio ID</span>
          <input
            type="number"
            value={servicioId}
            onChange={(e) => setServicioId(Number(e.target.value))}
            style={{ padding: 8, width: 120 }}
            min={1}
          />
        </label>
        <button onClick={onBuscar} style={{ padding: "8px 12px" }} disabled={loading}>
          Buscar
        </button>
        {loading ? <span>Cargando…</span> : null}
      </div>

      {msg ? (
        <p style={{ marginTop: 12, color: "crimson" }}>
          {msg}
        </p>
      ) : null}

      <h2 style={{ marginTop: 20, fontSize: 18, fontWeight: 700 }}>
        Materiales del servicio
      </h2>

      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Material</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Tipo</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Unidad</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Cantidad</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Nota</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={`${x.servicio_id}-${x.material_id}`}>
                <td style={{ padding: 8 }}>{x.materiales?.nombre ?? `#${x.material_id}`}</td>
                <td style={{ padding: 8 }}>{x.materiales?.tipo}</td>
                <td style={{ padding: 8 }}>{x.materiales?.unidad}</td>
                <td style={{ padding: 8 }}>{String(x.cantidad)}</td>
                <td style={{ padding: 8 }}>{x.nota ?? ""}</td>
                <td style={{ padding: 8, textAlign: "right" }}>
                  <button onClick={() => onEliminar(x.material_id)} style={{ padding: "6px 10px" }}>
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td style={{ padding: 8 }} colSpan={6}>
                  Sin materiales asignados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 20, fontSize: 18, fontWeight: 700 }}>
        Asignar material al servicio
      </h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
        <select
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value ? Number(e.target.value) : "")}
          style={{ padding: 8, minWidth: 260 }}
        >
          <option value="">Selecciona material…</option>
          {materiales.map((m) => (
            <option key={m.id} value={m.id}>
              #{m.id} — {m.nombre} ({m.tipo}/{m.unidad})
            </option>
          ))}
        </select>

        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          min={0.0001}
          step="0.0001"
          style={{ padding: 8, width: 140 }}
          placeholder="Cantidad"
        />

        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          style={{ padding: 8, minWidth: 260, flex: 1 }}
          placeholder="Nota (opcional)"
        />

        <button onClick={onAsignar} style={{ padding: "8px 12px" }} disabled={loading}>
          Asignar
        </button>
      </div>

      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
        Tip: este módulo no crea servicios todavía; trabaja por Servicio ID. Luego en B2 agregamos creación/listado.
      </p>
    </main>
  );
}