"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

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
  redirectOnScheduled = true,
}: {
  url: string;
  height?: number;
  redirectOnScheduled?: boolean;
}) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const redirectedRef = useRef(false);

  const init = () => {
    if (!hostRef.current || !window.Calendly?.initInlineWidget) return;

    // limpiar para evitar doble render / estados raros
    hostRef.current.innerHTML = "";

    window.Calendly.initInlineWidget({
      url,
      parentElement: hostRef.current,
    });
  };

  // Si el script ya existía, inicializa igual
  useEffect(() => {
    if (window.Calendly?.initInlineWidget) setScriptReady(true);
  }, []);

  // Inicializa cada vez que esté listo el script o cambie la URL
  useEffect(() => {
    if (scriptReady) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady, url]);

  // ✅ Listener para detectar "event scheduled" y redirigir desde tu web
  useEffect(() => {
    if (!redirectOnScheduled) return;

    function onMessage(e: MessageEvent) {
      // Calendly normalmente envía desde calendly.com
      const isCalendly =
        typeof e.origin === "string" && e.origin.includes("calendly.com");
      if (!isCalendly) return;

      const data: any = e.data;
      if (data?.event === "calendly.event_scheduled") {
        if (redirectedRef.current) return; // evita doble redirect
        redirectedRef.current = true;

        router.push("/gracias?canal=calendly");
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router, redirectOnScheduled]);

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-[#E9D9C9] bg-white/70 shadow-sm">
      <div ref={hostRef} className="w-full" style={{ minWidth: 320, height }} />

      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
    </div>
  );
}