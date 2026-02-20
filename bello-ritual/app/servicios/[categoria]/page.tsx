// app/servicios/[categoria]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryTabs from "@/components/CategoryTabs";
import ServiceCard from "@/components/ServiceCard";
import {
  CATEGORIES,
  SERVICES,
  DOMICILIO,
  type CategorySlug,
  type TabSlug,
} from "@/lib/services";

function normalizeSlug(value: string) {
  return decodeURIComponent(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita tildes: uñas->unas, depilación->depilacion
}

export function generateStaticParams() {
  return Object.values(CATEGORIES).map((c) => ({ categoria: c.slug }));
}

export default async function CategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { categoria } = await params;
  const { tab } = await searchParams;

  const catSlug = normalizeSlug(categoria) as CategorySlug;
  const cat = CATEGORIES[catSlug];
  if (!cat) return notFound();

  const requestedTab = (tab ? normalizeSlug(tab) : "") as TabSlug;
  const activeTab: TabSlug = cat.tabs.includes(requestedTab)
    ? requestedTab
    : cat.tabs[0];

  const items = SERVICES.filter(
    (s) => s.category === catSlug && s.tab === activeTab
  );

  const money = (v: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <section className="py-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        <header className="rounded-2xl border border-[#E9D9C9] bg-white/60 p-8 text-center">
          <h1 className="text-3xl font-semibold text-[#2B1B14]">
            {cat.label}
          </h1>
          <p className="mt-2 text-sm text-[#6A5A57]">{cat.subtitle}</p>

          <div className="mt-6">
            <Link
              href="/reservar"
              className="inline-flex items-center justify-center rounded-xl bg-[#B68A3A] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Reservar cita →
            </Link>
          </div>
        </header>

        <CategoryTabs
          basePath={`/servicios/${cat.slug}`}
          tabs={cat.tabs}
          activeTab={activeTab}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-[#E9D9C9] bg-white/60 p-6 text-sm text-[#6A5A57]">
              No hay servicios registrados en esta sección.
            </div>
          ) : (
            items.map((s) => (
              <ServiceCard
                key={s.id}
                title={s.title}
                durationMin={s.durationMin}
                priceFrom={s.priceFrom}
                priceTo={s.priceTo}
                bullets={s.bullets}
              />
            ))
          )}
        </div>

        <div className="mt-10 rounded-2xl border border-[#E9D9C9] bg-white/60 p-6">
          <h2 className="text-sm font-semibold text-[#2B1B14]">
            Domicilio (recargo sugerido)
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#6A5A57]">
            {DOMICILIO.map((z) => (
              <li key={z.zone}>
                {z.zone}: <span className="font-medium">{money(z.extra)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}