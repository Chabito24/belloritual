// components/ServiceCard.tsx
type Props = {
  title: string;
  durationMin?: number;
  priceFrom: number;
  priceTo: number;
  bullets?: string[];
};

export default function ServiceCard({
  title,
  durationMin,
  priceFrom,
  priceTo,
  bullets,
}: Props) {
  const money = (v: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(v);

  const price =
    priceFrom === priceTo
      ? money(priceFrom)
      : `${money(priceFrom)} – ${money(priceTo)}`;

  return (
    <article className="rounded-2xl border border-[#E9D9C9] bg-white/60 p-5">
      <h3 className="text-lg font-semibold text-[#2B1B14]">{title}</h3>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6A5A57]">
        {durationMin ? <span>{durationMin} min</span> : null}
        <span className="font-medium text-[#2B1B14]">{price}</span>
      </div>

      {bullets?.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#6A5A57]">
          {bullets.map((b, i) => (
            <li key={`${title}-${i}`}>{b}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}