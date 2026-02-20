"use client";

// components/HomeBenefits.tsx
export default function HomeBenefits() {
  const items = [
    {
      title: "Higiene y materiales premium",
      desc: "Protocolos de limpieza y productos de calidad para tu tranquilidad.",
      icon: "✨",
    },
    {
      title: "Recordatorios automáticos",
      desc: "Te confirmamos y recordamos tu cita para que no se te pase.",
      icon: "⏰",
    },
    {
      title: "Ambiente relajante",
      desc: "Una experiencia tranquila, cuidada y con atención al detalle.",
      icon: "🌿",
    },
  ];

  return (
    <section className="mt-10">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="rounded-2xl border border-[#E9D9C9] bg-white/60 p-6"
          >
            <div className="text-2xl">{it.icon}</div>
            <h3 className="mt-3 font-semibold text-[#2B1B14]">{it.title}</h3>
            <p className="mt-2 text-sm text-[#6A5A57]">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}