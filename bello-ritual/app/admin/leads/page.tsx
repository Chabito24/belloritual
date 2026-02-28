'use client'

import { useEffect, useState } from "react";

type Lead = {
  id: number;
  nombre?: string | null;
  correo?: string | null;
  telefono?: string | null;
  mensaje?: string | null;
  canal?: string | null;
  createdAt?: string;
};

export default function AdminLeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  (async () => {
    const res = await fetch("/api/admin/leads", {
      cache: "no-store",
      credentials: "include",
    });

    // ✅ AQUÍ va
    if (res.status === 401) {
      window.location.href = "/admin/login?next=/admin/leads";
      return;
    }

    const data = await res.json().catch(() => null);
    setItems(data?.items ?? []);
    setLoading(false);
  })();
}, []);

  return (
    <main style={{ maxWidth: 1100, margin: "30px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Leads</h1>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Fecha", "Nombre", "Correo", "Teléfono", "Canal", "Mensaje"].map((h) => (
                  <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {x.createdAt ? new Date(x.createdAt).toLocaleString() : "-"}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{x.nombre ?? "-"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{x.correo ?? "-"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{x.telefono ?? "-"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{x.canal ?? "-"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{x.mensaje ?? "-"}</td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 12 }}>
                    No hay leads aún.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}