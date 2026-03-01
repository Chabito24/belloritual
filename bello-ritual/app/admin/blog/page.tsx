'use client';

import { useEffect, useState } from "react";

type BlogItem = {
  id: number;
  titulo: string;
  slug: string;
  resumen?: string | null;
  estado: "BORRADOR" | "PUBLICADO" | "ARCHIVADO";
  publicado_en?: string | null;
  creado_en?: string;
};

export default function AdminBlogPage() {
  const [items, setItems] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // form crear
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [resumen, setResumen] = useState("");
  const [estado, setEstado] = useState<"BORRADOR" | "PUBLICADO">("BORRADOR"); // ✅ no permitir ARCHIVADO al crear
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // acciones por fila
  const [changingId, setChangingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/blog", {
      cache: "no-store",
      credentials: "include",
    });

    if (res.status === 401) {
      window.location.href = "/admin/login?next=/admin/blog";
      return;
    }

    const data = await res.json().catch(() => null);
    setItems(data?.items ?? []);
    setLoading(false);
  }

  async function setEstadoItem(id: number, nextEstado: BlogItem["estado"]) {
  setChangingId(id);

  const res = await fetch(`/api/admin/blog`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id, estado: nextEstado }),
  });

  if (res.status === 401) {
    window.location.href = "/admin/login?next=/admin/blog";
    return;
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    alert(data?.error ?? "No se pudo actualizar el estado.");
    setChangingId(null);
    return;
  }

  setChangingId(null);
  await load();
}

  async function deletePost(id: number) {
    const ok = window.confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.");
    if (!ok) return;

    setChangingId(id);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });

      if (res.status === 401) {
        window.location.href = "/admin/login?next=/admin/blog";
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error ?? "No se pudo eliminar.");
        return;
      }

      await load();
    } finally {
      setChangingId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        titulo,
        contenido,
        resumen: resumen.trim() ? resumen.trim() : null,
        estado, // BORRADOR o PUBLICADO
        imagen_url: null,
      }),
    });

    if (res.status === 401) {
      window.location.href = "/admin/login?next=/admin/blog";
      return;
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "No se pudo crear el post.");
      setSaving(false);
      return;
    }

    setTitulo("");
    setContenido("");
    setResumen("");
    setEstado("BORRADOR");
    setSaving(false);
    await load();
  }

  const actionBtnStyle: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "white",
  cursor: "pointer",
};

  return (
    <main style={{ maxWidth: 1100, margin: "30px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Blog</h1>

      <section style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Crear publicación</h2>

        <form onSubmit={createPost} style={{ display: "grid", gap: 10 }}>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título"
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
          />

          <textarea
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            placeholder="Resumen (opcional)"
            rows={2}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
          />

          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Contenido"
            rows={6}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
          />

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ fontSize: 14 }}>Estado:</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
              style={{ padding: 8, border: "1px solid #ddd", borderRadius: 10 }}
            >
              <option value="BORRADOR">BORRADOR</option>
              <option value="PUBLICADO">PUBLICADO</option>
            </select>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginLeft: "auto",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #ddd",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Guardando..." : "Crear"}
            </button>
          </div>

          {error ? <p style={{ color: "crimson", margin: 0 }}>{error}</p> : null}
        </form>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Publicaciones</h2>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["ID", "Título", "Slug", "Estado", "Publicado en", "Acciones"].map((h) => (
                    <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{x.id}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{x.titulo}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{x.slug}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{x.estado}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      {x.publicado_en ? new Date(x.publicado_en).toLocaleString() : "-"}
                    </td>

                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      { x.estado === "BORRADOR" ? (
                        <button
                            onClick={() => setEstadoItem(x.id, "PUBLICADO")}
                            disabled={changingId === x.id}
                            style={actionBtnStyle}
                        >
                            {changingId === x.id ? "..." : "Publicar"}
                        </button>
                        ) : null}

                        { x.estado === "PUBLICADO" ? (
                        <button
                            onClick={() => setEstadoItem(x.id, "ARCHIVADO")}
                            disabled={changingId === x.id}
                            style={actionBtnStyle}
                        >
                            {changingId === x.id ? "..." : "Archivar"}
                        </button>
                        ) : null}

                        { x.estado === "ARCHIVADO" ? (
                        <button
                            onClick={() => setEstadoItem(x.id, "PUBLICADO")}
                            disabled={changingId === x.id}
                            style={actionBtnStyle}
                        >
                            {changingId === x.id ? "..." : "Re-publicar"}
                        </button>
                        ) : null}

                        {x.estado !== "PUBLICADO" ? (
                        <button
                            onClick={() => deletePost(x.id)}
                            disabled={changingId === x.id}
                            style={{ ...actionBtnStyle, marginLeft: 8 }}
                        >
                            Eliminar
                        </button>
                        ) : null}
                    </td>
                  </tr>
                ))}

                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 12 }}>
                      No hay publicaciones aún.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}