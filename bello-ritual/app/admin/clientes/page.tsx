"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminClientesPage() {
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/session", { credentials: "include" });
      const j = await r.json().catch(() => null);
      setSessionOk(Boolean(j?.ok));
    })();
  }, []);

  if (sessionOk === false) {
    return (
      <main style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Clientes</h1>
        <p style={{ marginTop: 12 }}>No autorizado. Ve a iniciar sesión.</p>
        <Link href="/admin/login">Ir a login</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Clientes</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        <Link href="/admin">← Volver al panel</Link>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <p>
        Esta página aún no tiene CRUD. Próximo paso: definir la tabla <b>clientes</b> (o <b>leads</b> → <b>clientes</b>)
        y crear endpoints + UI.
      </p>
    </main>
  );
}