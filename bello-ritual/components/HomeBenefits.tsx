"use client";

import { ShieldCheck, CalendarClock, Leaf } from "lucide-react";

// components/HomeBenefits.tsx
export default function HomeBenefits() {
  const items = [
    {
      title: "Higiene y materiales premium",
      desc: "Protocolos de limpieza y productos de calidad para tu tranquilidad.",
      Icon: ShieldCheck,
    },
    {
      title: "Recordatorios automáticos",
      desc: "Te confirmamos y recordamos tu cita para que no se te pase.",
      Icon: CalendarClock,
    },
    {
      title: "Ambiente relajante",
      desc: "Una experiencia tranquila, cuidada y con atención al detalle.",
      Icon: Leaf,
    },
  ];

  return (
    <section className="mt-10">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="group rounded-2xl border border-[#E9D9C9] bg-white/60 p-6 text-center transition hover:bg-white/80"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E9D9C9] bg-white/70">
              <it.Icon
                className="h-6 w-6 text-[#6A5A57] transition group-hover:text-[#B68A3A]"
                strokeWidth={1.75}
              />
            </div>

            <h3 className="mt-3 font-semibold text-[#2B1B14]">{it.title}</h3>
            <p className="mt-2 text-sm text-[#6A5A57]">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}