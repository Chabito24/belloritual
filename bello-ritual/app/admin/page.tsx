'use client'

import Link from "next/link";

export default function AdminPage() {
  return (
    <main style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Panel Admin</h1>

      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <Link href="/admin/leads">Leads</Link>
        <Link href="/admin/servicios">Servicios</Link>
        <Link href="/admin/materiales">Materiales</Link>
        <Link href="/admin/blog">Blog</Link>
        <Link href="/admin/clientes">Clientes</Link>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <button
        onClick={async () => {
          await fetch("/api/admin/logout", { method: "POST" });
          window.location.href = "/admin/login";
        }}
      >
        Cerrar sesión
      </button>
    </main>
  );
}