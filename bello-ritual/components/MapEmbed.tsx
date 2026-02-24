"use client";

interface MapEmbedProps {
  embedUrl: string;
  placeUrl: string;
  title?: string;
}

export default function MapEmbed({
  embedUrl,
  placeUrl,
  title = "Ubicación en Google Maps",
}: MapEmbedProps) {
  return (
    <div className="rounded-2xl border border-[#E9D9C9] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#2B1F1E]">Ubicación</h3>

        <a
          href={placeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-full bg-[#B68A3A] px-4 py-2 text-xs font-medium text-white hover:opacity-90"
        >
          Cómo llegar
        </a>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#F3EDE4]">
        <div className="relative w-full pb-[75%] sm:pb-[60%]">
          <iframe
            title={title}
            src={embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}