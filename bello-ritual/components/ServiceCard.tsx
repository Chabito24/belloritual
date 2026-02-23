type Props = {
  title: string;
  durationMin?: number;
  priceFrom: number;
  priceTo: number;
  benefit?: string;
  bullets?: string[];
  whatsappHref?: string;
};

export default function ServiceCard({
  title,
  durationMin,
  priceFrom,
  priceTo,
  benefit,
  bullets,
  whatsappHref,
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
    <article className="rounded-2xl border border-[#E9D9C9] bg-white/60 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[#2B1B14]">{title}</h3>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6A5A57]">
        {durationMin ? <span>Duración aprox. {durationMin} min</span> : null}
        <span className="font-medium text-[#2B1B14]">{price}</span>
      </div>

      {benefit ? (
        <p className="mt-3 text-sm text-[#5B463D]">{benefit}</p>
      ) : null}

      {bullets?.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#6A5A57]">
          {bullets.map((b, i) => (
            <li key={`${title}-${i}`}>{b}</li>
          ))}
        </ul>
      ) : null}

      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-full border border-[#E9D9C9] bg-white/80 px-4 py-2 text-sm font-medium text-[#2B1B14] hover:border-[#B68A3A]"
        >
          Agendar por WhatsApp
        </a>
      ) : null}
    </article>
  );
}