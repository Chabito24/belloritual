"use client";
// components/HomeFinalCTA.tsx
import Link from "next/link";

export default function HomeFinalCTA() {
  return (
    <section className="mt-12">
      <div className="rounded-3xl border border-[#E9D9C9] bg-white/60 px-6 py-10 text-center">
        <h2 className="text-2xl font-semibold text-[#2B1B14]">
          ¿Lista para tu cambio?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[#6A5A57]">
          Agenda tu cita en minutos y elige el servicio ideal para ti.
        </p>

        <div className="mt-6">
          <Link
            href="/reservar"
            className="inline-flex items-center justify-center rounded-xl bg-[#B68A3A] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Reservar cita →
          </Link>
        </div>
      </div>
    </section>
  );
}