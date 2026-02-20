"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ChevronDownIcon from "@/components/ChevronDownIcon";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  // Bloquear scroll cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Cerrar con ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="md:hidden">
      {/* Botón hamburguesa */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E9D9C9] bg-white/70 text-[#B68A3A] hover:border-[#B68A3A]"
      >
        <span className="sr-only">Abrir menú</span>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Overlay + Panel */}
      {open && (
        <div className="fixed inset-0 z-80">
          {/* backdrop */}
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />

          {/* panel */}
          <div className="absolute right-3 top-3 w-[min(92vw,360px)] rounded-2xl border border-[#E9D9C9] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E9D9C9] px-4 py-3">
              <p className="font-semibold text-[#2B1B14]">Menú</p>
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E9D9C9] bg-white/70 text-[#B68A3A] hover:border-[#B68A3A]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav className="px-4 py-3 text-sm">
              <Link
                href="/"
                className="block rounded-xl px-3 py-3 hover:bg-[#FBF7F2]"
                onClick={() => setOpen(false)}
              >
                Inicio
              </Link>

              {/* Servicios dropdown */}
              <details className="group rounded-xl">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-3 hover:bg-[#FBF7F2]">
                  <span>Servicios</span>
                  <ChevronDownIcon className="text-[#B68A3A] transition-transform group-open:rotate-180" />
                </summary>

                <div className="pb-2">
                  <Link
                    href="/servicios/pestanas"
                    className="block rounded-xl px-6 py-2 hover:bg-[#FBF7F2]"
                    onClick={() => setOpen(false)}
                  >
                    Pestañas
                  </Link>
                  <Link
                    href="/servicios/unas"
                    className="block rounded-xl px-6 py-2 hover:bg-[#FBF7F2]"
                    onClick={() => setOpen(false)}
                  >
                    Uñas
                  </Link>
                  <Link
                    href="/servicios/depilacion"
                    className="block rounded-xl px-6 py-2 hover:bg-[#FBF7F2]"
                    onClick={() => setOpen(false)}
                  >
                    Depilación
                  </Link>
                </div>
              </details>

              {/* Reserva dropdown */}
              {/* <details className="group rounded-xl">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-3 hover:bg-[#FBF7F2]">
                  <span>Reserva</span>
                  <ChevronDownIcon className="text-[#B68A3A] transition-transform group-open:rotate-180" />
                </summary>

                <div className="pb-2">
                  <Link
                    href="/contacto?tipo=en-punto#form"
                    className="block rounded-xl px-6 py-2 hover:bg-[#FBF7F2]"
                    onClick={() => setOpen(false)}
                  >
                    En punto
                  </Link>
                  <Link
                    href="/contacto?tipo=domicilio#form"
                    className="block rounded-xl px-6 py-2 hover:bg-[#FBF7F2]"
                    onClick={() => setOpen(false)}
                  >
                    A domicilio
                  </Link>
                </div>
              </details> */}

            <Link href="/reservar" className="hover:text-[#B68A3A]">
                Reserva
            
            </Link>

              

              <Link
                href="/contacto"
                className="block rounded-xl px-3 py-3 hover:bg-[#FBF7F2]"
                onClick={() => setOpen(false)}
              >
                Contacto
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}