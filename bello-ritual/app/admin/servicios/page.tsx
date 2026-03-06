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

type Servicio = {
  id: number;
  nombre: string;
  subcategoria_id: number | null;
  activo: boolean;
};

type Categoria = { 
  id: number; 
  nombre: string 
};

type Subcategoria = { 
  id: number; 
  categoria_id: number; 
  nombre: string; 
  activo: boolean 
};

export default function AdminServiciosPage() {
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);

  // (B3) Nuevo: servicios por subcategoría (por ahora subcategoriaId fijo en 3)
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [subcategoriaId, setSubcategoriaId] = useState<number>(3);

  // Mantengo esto igual (aún manual por ID)
  const [servicioId, setServicioId] = useState<number>(1);

  const [materiales, setMateriales] = useState<Material[]>([]);
  const [items, setItems] = useState<ServicioMaterialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [materialId, setMaterialId] = useState<number | "">("");
  const [cantidad, setCantidad] = useState<number>(1);
  const [nota, setNota] = useState<string>("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState<number>(5);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);

  // No lo usas ahora, pero lo dejo por si luego lo necesitas
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

  async function loadCategorias() {
    const r = await fetch("/api/admin/categorias", { credentials: "include" });
    const j = await r.json();
    if (!r.ok || !j?.ok) throw new Error(j?.error || "ERROR_CARGANDO_CATEGORIAS");
    setCategorias((j.items || []).map((c: any) => ({ id: c.id, nombre: c.nombre })));
  }

  async function loadSubcategorias(catId: number) {
    const r = await fetch(`/api/admin/subcategorias?categoria_id=${catId}`, { credentials: "include" });
    const j = await r.json();
    if (!r.ok || !j?.ok) throw new Error(j?.error || "ERROR_CARGANDO_SUBCATEGORIAS");
    setSubcategorias(j.items || []);
  }

  async function loadServicios(subId: number) {
    const r = await fetch(`/api/admin/servicios?subcategoria_id=${subId}`, {
      credentials: "include",
    });
    const j = await r.json();
    if (!r.ok || !j?.ok) throw new Error(j?.error || "ERROR_CARGANDO_SERVICIOS");
    setServicios(j.items || []);
  }

  async function loadServicioMateriales(id: number) {
    const r = await fetch(`/api/admin/servicios/materiales?servicio_id=${id}`, {
      credentials: "include",
    });
    const j = await r.json();
    if (!r.ok || !j?.ok) throw new Error(j?.error || "ERROR_CARGANDO_SERVICIO_MATERIALES");
    setItems(j.items || []);
  }

  async function refreshAll(
    id = servicioId, 
    catId = categoriaId, 
    subId = subcategoriaId) {
    setLoading(true);
    setMsg("");
    try {
      await loadMateriales();
      await loadCategorias();
      await loadSubcategorias(catId);
      await loadServicios(subId);
      await loadServicioMateriales(id);
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

      await refreshAll(servicioId, categoriaId, subcategoriaId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onBuscar() {
    if (!Number.isFinite(servicioId) || servicioId <= 0) {
      setMsg("SERVICIO_ID_INVALIDO");
      return;
    }
    await refreshAll(servicioId, subcategoriaId);
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
    await refreshAll(servicioId, subcategoriaId);
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
    await refreshAll(servicioId, subcategoriaId);
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
          <span>Categoría</span>
          <select
            value={categoriaId}
            onChange={async (e) => {
              const newCat = Number(e.target.value);
              setCategoriaId(newCat);
              await loadSubcategorias(newCat);
            }}
            style={{ padding: 8, minWidth: 220 }}
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.id} — {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>Subcategoría</span>
          <select
            value={subcategoriaId}
            onChange={async (e) => {
              const newSub = Number(e.target.value);
              setSubcategoriaId(newSub);
              await loadServicios(newSub);
            }}
            style={{ padding: 8, minWidth: 240 }}
          >
            {subcategorias.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.id} — {s.nombre}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>Servicio</span>
          <select
            value={servicioId}
            onChange={(e) => setServicioId(Number(e.target.value))}
            style={{ padding: 8, minWidth: 280 }}
          >
            {servicios.length === 0 ? (
              <option value={servicioId}>Sin servicios cargados</option>
            ) : null}

            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.id} — {s.nombre}
              </option>
            ))}
          </select>
        </label>

        <button onClick={onBuscar} style={{ padding: "8px 12px" }} disabled={loading}>
          Ver materiales
        </button>

        {loading ? <span>Cargando…</span> : null}
      </div>

      {msg ? (
        <p style={{ marginTop: 12, color: "crimson" }}>{msg}</p>
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
        Tip: selecciona Categoría → Subcategoría → Servicio y administra los materiales del servicio desde aquí.
      </p>
    </main>
  );
}