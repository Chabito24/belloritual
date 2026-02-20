// app/servicios/page.tsx
import Link from "next/link";
import { CATEGORIES } from "@/lib/services";

export default function ServiciosPage() {
  const cats = Object.values(CATEGORIES);

  return (
    <section className="py-10">
      <h1 className="text-3xl font-semibold">Nuestros servicios</h1>
      <p className="mt-2 text-sm opacity-80">
        Explora por categoría y reserva tu cita.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cats.map((c) => (
          <Link
            key={c.slug}
            href={`/servicios/${c.slug}`}
            className="rounded-2xl border border-[#E9D9C9] bg-white/70 p-6 shadow-sm hover:border-[#B68A3A]"
          >
            <h2 className="text-xl font-semibold">{c.label}</h2>
            <p className="mt-2 text-sm text-[#5B463D]">{c.subtitle}</p>
            <span className="mt-4 inline-flex text-sm font-medium text-[#B68A3A]">
              Ver más →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}