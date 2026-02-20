"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const WA_PHONE = "573163044957"; // cámbialo luego

const LABELS: Record<string, string> = {
  pestanas: "Pestañas",
  unas: "Uñas",
  depilacion: "Depilación",
};

function buildWaLink(message: string) {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`;
}

export default function ContactForm() {
  const sp = useSearchParams();

  const presetServicio = useMemo(() => {
    const raw = sp.get("servicio") ?? "";
    const slug = decodeURIComponent(raw).toLowerCase();
    if (slug in LABELS) return slug;
    return "pestanas";
  }, [sp]);

  const presetTipo = useMemo(() => {
    const raw = sp.get("tipo") ?? "";
    const slug = decodeURIComponent(raw).toLowerCase();
    if (slug === "domicilio" || slug === "en-punto") return slug;
    return "en-punto";
  }, [sp]);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [servicio, setServicio] = useState(presetServicio);
  const [tipo, setTipo] = useState(presetTipo);
  const [fecha, setFecha] = useState("");
  const [mensaje, setMensaje] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const servicioLabel = LABELS[servicio] ?? servicio;
    const tipoLabel = tipo === "domicilio" ? "A domicilio" : "En punto";

    const text =
      `Hola, soy ${nombre || "___"}.\n` +
      `Quiero: ${servicioLabel}\n` +
      `Modalidad: ${tipoLabel}\n` +
      `Mi WhatsApp: ${telefono || "___"}\n` +
      (fecha ? `Fecha preferida: ${fecha}\n` : "") +
      (mensaje ? `Mensaje: ${mensaje}` : "");

    window.open(buildWaLink(text), "_blank", "noopener,noreferrer");
  }

  return (
    <form id="form" onSubmit={onSubmit} className="rounded-3xl border border-[#E9D9C9] bg-white/60 p-6 shadow-sm">
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
          <span className="text-sm">Teléfono (WhatsApp)</span>
          <input
            className="w-full rounded-xl border border-[#E9D9C9] bg-white/70 px-3 py-2 outline-none focus:border-[#B68A3A]"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+57 3xx xxx xxxx"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm">Servicio</span>
            <select
              className="w-full rounded-xl border border-[#E9D9C9] bg-white/70 px-3 py-2 outline-none focus:border-[#B68A3A]"
              value={servicio}
              onChange={(e) => setServicio(e.target.value)}
            >
              <option value="pestanas">Pestañas</option>
              <option value="unas">Uñas</option>
              <option value="depilacion">Depilación</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Modalidad</span>
            <select
              className="w-full rounded-xl border border-[#E9D9C9] bg-white/70 px-3 py-2 outline-none focus:border-[#B68A3A]"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="en-punto">En punto</option>
              <option value="domicilio">A domicilio</option>
            </select>
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-sm">Fecha preferida (opcional)</span>
          <input
            className="w-full rounded-xl border border-[#E9D9C9] bg-white/70 px-3 py-2 outline-none focus:border-[#B68A3A]"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            placeholder="Ej: Sábado 3:00 p.m."
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Mensaje</span>
          <textarea
            className="w-full min-h-120px rounded-xl border border-[#E9D9C9] bg-white/70 px-3 py-2 outline-none focus:border-[#B68A3A]"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Cuéntanos qué necesitas..."
          />
        </label>

        <button
          type="submit"
          className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#B68A3A] px-5 py-3 text-sm font-medium text-white hover:opacity-90 md:w-auto md:self-center"
        >
          Enviar por WhatsApp
        </button>
      </div>
    </form>
  );
}
