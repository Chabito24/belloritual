import Link from "next/link";
import { TAB_LABEL, type TabSlug } from "@/lib/services";

export default function CategoryTabs({
  basePath,
  tabs,
  activeTab,
}: {
  basePath: string; // ej: "/servicios/pestanas"
  tabs: TabSlug[];
  activeTab: TabSlug;
}) {
  return (
    <div id="tabs" className="mt-6 flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = t === activeTab;
        return (
          <Link
            key={t}
            href={`${basePath}?tab=${t}#tabs`}
            className={[
              "rounded-full border px-4 py-2 text-sm transition",
              active
                ? "border-[#B68A3A] bg-white text-[#2B1B14]"
                : "border-[#E9D9C9] bg-white/60 hover:border-[#B68A3A]",
            ].join(" ")}
          >
            {TAB_LABEL[t]}
          </Link>
        );
      })}
    </div>
  );
}