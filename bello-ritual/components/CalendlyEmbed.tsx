"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void;
    };
  }
}

export default function CalendlyEmbed({
  url,
  height = 700,
}: {
  url: string;
  height?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const init = () => {
    if (!hostRef.current || !window.Calendly?.initInlineWidget) return;

    // IMPORTANTE: limpiar para evitar “doble render” o estados raros en dev
    hostRef.current.innerHTML = "";

    window.Calendly.initInlineWidget({
      url,
      parentElement: hostRef.current,
    });
  };

  // Si el script ya existía (navegaste y volvió), inicializa igual
  useEffect(() => {
    if (window.Calendly?.initInlineWidget) setScriptReady(true);
  }, []);

  // Inicializa cada vez que esté listo el script o cambie la URL
  useEffect(() => {
    if (scriptReady) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady, url]);

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-[#E9D9C9] bg-white/70 shadow-sm">
      <div ref={hostRef} className="w-full" style={{ 
        minWidth: 320, 
        height: "calc(100vh - 260px)",
        minHeight: 820
        }} />

      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
    </div>
  );
}