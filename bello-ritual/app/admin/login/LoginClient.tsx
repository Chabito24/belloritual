"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginClient() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/admin";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Error al iniciar sesión");
      return;
    }

    window.location.href = nextUrl;
  }

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin Login</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <input
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <button disabled={loading} style={{ padding: 10, borderRadius: 8 }}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      </form>
    </main>
  );
}