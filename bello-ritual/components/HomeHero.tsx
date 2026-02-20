"use client";
// components/HomeHero.tsx
import Link from "next/link";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#E9D9C9] bg-white/60">
      {/* Placeholder imagen (luego lo reemplazas por <Image />) */}
      <div className="absolute inset-0 opacity-25">
        <div className="h-full w-full bg-linear-to-br from-[#E7D2A6] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-14 text-center">
        <h1 className="text-4xl font-semibold text-[#2B1B14]">
          Realza tu belleza con nosotros
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-[#6A5A57]">
          Pestañas, uñas y depilación con atención cuidadosa, materiales de calidad y resultados naturales.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/reservar"
            className="inline-flex items-center justify-center rounded-xl bg-[#B68A3A] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Reservar cita →
          </Link>

          <Link
            href="/servicios"
            className="inline-flex items-center justify-center rounded-xl border border-[#E9D9C9] bg-white/70 px-6 py-3 text-sm font-medium text-[#2B1B14] transition hover:bg-white"
          >
            Ver servicios
          </Link>
        </div>
      </div>
    </section>
  );
}