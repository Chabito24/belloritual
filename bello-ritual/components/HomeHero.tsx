"use client";
// components/HomeHero.tsx
import Link from "next/link";
import Image from "next/image";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#E9D9C9] bg-white/60 min-h-300px">
      <Image
        src="/img/hero.webp"
        alt="Bello Ritual"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Overlay recomendado */}
      <div className="absolute inset-0 bg-white/60" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 text-center">
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
            Reservar
          </Link>

          <Link
            href="/servicios"
            className="inline-flex items-center justify-center rounded-xl border border-[#E9D9C9] bg-white/70 px-6 py-3 text-sm font-medium text-[#2B1B14] transition hover:bg-white"
          >
            Servicios
          </Link>
        </div>
      </div>
    </section>
  );
}