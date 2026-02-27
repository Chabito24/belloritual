"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const WA_PHONE = "573163044957"; // cámbialo luego

function buildWaLink(message: string) {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`;
}

// ✅ NUEVO: guarda el lead sin bloquear el flujo
function saveLead(payload: {
  nombre: string;
  telefono: string;
  mensaje: string;
  canal: string;
}) {
  try {
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // no-op
  }
}

export default function ContactForm() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const text =
      `Hola, soy ${nombre || "___"}.\n` +
      `Mi WhatsApp: ${telefono || "___"}\n` +
      (mensaje ? `Mensaje: ${mensaje}` : "Quiero más información sobre sus servicios.");

    // ✅ NUEVO: guarda lead (no bloquea)
    saveLead({
      nombre,
      telefono,
      mensaje,
      canal: "contacto",
    });

    // ✅ Mantiene tu comportamiento actual
    window.open(buildWaLink(text), "_blank", "noopener,noreferrer");

    // ✅ Mantiene tu comportamiento actual
    router.push("/gracias?canal=contacto");
  }

  return (
    <form
      id="form"
      onSubmit={onSubmit}
      className="rounded-3xl border border-[#E9D9C9] bg-white/60 p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold">Envíanos un mensaje</h2>
      <p className="mt-1 text-sm text-[#5B463D]">
        Te responderemos pronto por WhatsApp.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm">Nombre *</span>
          <input
            className="w-full rounded-xl border border-[#E9D9C9] bg-white/70 px-3 py-2 outline-none focus:border-[#B68A3A]"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Teléfono (WhatsApp) *</span>
          <input
            className="w-full rounded-xl border border-[#E9D9C9] bg-white/70 px-3 py-2 outline-none focus:border-[#B68A3A]"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+57 3xx xxx xxxx"
            required
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Mensaje *</span>
          <textarea
            className="w-full min-h-30 rounded-xl border border-[#E9D9C9] bg-white/70 px-3 py-2 outline-none focus:border-[#B68A3A]"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Cuéntanos qué necesitas..."
            required
          />
        </label>

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center justify-self-center rounded-full bg-[#B68A3A] px-6 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Enviar
        </button>
      </div>
    </form>
  );
}