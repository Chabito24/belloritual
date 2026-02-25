import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import DropdownCloser from "@/components/DropdownCloser";
import ChevronDownIcon from "@/components/ChevronDownIcon";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import MobileMenu from "@/components/MobileMenu";
import Image from "next/image";

function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 3v10.2a3.8 3.8 0 1 1-3-3.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 7.2c1.2 1.6 2.8 2.6 5 2.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="16.5" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}

function YouTubeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="8"
        width="14"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M11 10.5l3 1.5-3 1.5v-3z" fill="currentColor" />
    </svg>
  );
}


export const metadata: Metadata = {
  title: "Bello Ritual",
  description: "Lashes, uñas y depilación — reserva tu cita en minutos.",
};

const WHATSAPP_NUMBER = "573163044957"; // cambia luego
const ADDRESS = "Bello, Antioquia - Avenida 40 # 55 - 98"; // cambia luego

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#FBF7F2] text-[#2B1B14]">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-[#E9D9C9] bg-white/70 backdrop-blur">
          {/* Top info bar */}
          <div className="border-b border-[#E9D9C9]/60">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2 text-xs text-[#5B463D] sm:flex-row sm:items-center sm:justify-between">
              <p className="truncate">📍 {ADDRESS}</p>
              <p className="opacity-90">⏰ Lun–Sáb: 9:00 a.m. – 7:00 p.m.</p>
            </div>
          </div>

          {/* Main nav */}
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.webp"
              alt="Bello Ritual"
              width={44}
              height={44}
              className="h-11 w-11 rounded-md object-contain"
              priority
            />

            <div className="leading-tight">
              <p className="text-base font-semibold text-[#2B1B14]">Bello Ritual</p>
              <p className="hidden text-xs text-[#5B463D] sm:block">
                Pestañas • Uñas • Depilación
              </p>
            </div>
          </Link>

            {/* NAV DESKTOP */}
            <nav className="hidden items-center gap-6 text-sm md:flex">
              <Link href="/" className="hover:text-[#B68A3A]">
                Inicio
              </Link>

              {/* Servicios dropdown */}
              <details className="relative group">
                <summary    className="cursor-pointer list-none hover:text-[#B68A3A] flex items-center gap-2">
                  <span>Servicios</span>
                  <ChevronDownIcon className="text-[#B68A3A] transition-transform group-open:rotate-180" />
                </summary>
                <div className="absolute left-0 mt-2 w-52 rounded-xl border border-[#E9D9C9] bg-white shadow-sm p-2">
                  <Link
                    className="block rounded-lg px-3 py-2 hover:bg-[#FBF7F2]"
                    href="/servicios/pestanas"
                  >
                    Pestañas
                  </Link>
                  <Link
                    className="block rounded-lg px-3 py-2 hover:bg-[#FBF7F2]"
                    href="/servicios/unas"
                  >
                    Uñas
                  </Link>
                  <Link
                    className="block rounded-lg px-3 py-2 hover:bg-[#FBF7F2]"
                    href="/servicios/depilacion"
                  >
                    Depilación
                  </Link>
                </div>
              </details>

              {/* Reservar dropdown */}
              {/* <details className="relative group">
                <summary className="cursor-pointer list-none hover:text-[#B68A3A] flex items-center gap-2">
                  <span>Reserva</span>
                  <ChevronDownIcon className="text-[#B68A3A] transition-transform group-open:rotate-180" />
                </summary>
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-[#E9D9C9] bg-white shadow-sm p-2">
                  <Link
                    className="block rounded-lg px-3 py-2 hover:bg-[#FBF7F2]"
                    href="/contacto?tipo=en-punto#form"
                  >
                    En punto
                  </Link>
                  <Link
                    className="block rounded-lg px-3 py-2 hover:bg-[#FBF7F2]"
                    href="/contacto?tipo=domicilio#form"
                  >
                    A domicilio
                  </Link>
                </div>
              </details> */}
              <Link href="/reservar" className="hover:text-[#B68A3A]">
                Reserva
              </Link>

              <Link href="/contacto" className="hover:text-[#B68A3A]">
                Contacto
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              {/* Mobile hamburgesa  */}
              <MobileMenu />
              {/* Iconos redes (header) */}
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                title="TikTok"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E9D9C9] bg-white/70 text-[#B68A3A] hover:border-[#B68A3A]"
              >
                <TikTokIcon className="h-5 w-5" />
              </a>

              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E9D9C9] bg-white/70 text-[#B68A3A] hover:border-[#B68A3A]"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>

              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                title="YouTube"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E9D9C9] bg-white/70 text-[#B68A3A] hover:border-[#B68A3A]"
              >
                <YouTubeIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>

        {/* Footer */}
        <footer className="border-t border-[#E9D9C9] bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-[#5B463D]">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <p className="text-base font-semibold text-[#2B1B14]">
                  Bello Ritual
                </p>
                <p className="mt-2 opacity-90">Pestañas • Uñas • Depilación</p>
              </div>

              <div>
                <p className="font-semibold text-[#2B1B14]">Contacto</p>
                <p className="mt-2">📍 {ADDRESS}</p>
                <p className="mt-1">
                  📱 WhatsApp:{" "}
                  <a
                    className="text-[#B68A3A] hover:underline"
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    (+57) 316 304 49 57 
                  </a>
                </p>
                <p className="mt-1">⏰ Lun–Sáb: 9:00 a.m. – 7:00 p.m.</p>
              </div>

              <div>
                <p className="font-semibold text-[#2B1B14]">Síguenos</p>
                <div className="mt-3 flex items-center gap-3">
                  <a
                    href="#"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E9D9C9] bg-white/70 text-[#B68A3A] hover:border-[#B68A3A]"
                    aria-label="TikTok"
                    title="TikTok"
                  >
                    <TikTokIcon className="h-5 w-5" />
                  </a>

                  <a
                    href="#"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E9D9C9] bg-white/70 text-[#B68A3A] hover:border-[#B68A3A]"
                    aria-label="Instagram"
                    title="Instagram"
                  >
                    <InstagramIcon className="h-5 w-5" />
                  </a>

                  <a
                    href="#"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E9D9C9] bg-white/70 text-[#B68A3A] hover:border-[#B68A3A]"
                    aria-label="YouTube"
                    title="YouTube"
                  >
                    <YouTubeIcon className="h-5 w-5" />
                  </a>
                </div>

                <p className="mt-4 text-xs opacity-80">
                  © {new Date().getFullYear()} Bello Ritual. Todos los derechos
                  reservados.
                </p>
              </div>
            </div>
          </div>
        </footer>
        <WhatsAppFloatingButton
          phone={WHATSAPP_NUMBER}
          message="Hola, quiero agendar una cita en Bello Ritual. ¿Me ayudas?"
/>
        <DropdownCloser />
      </body>      
    </html>
  );
}
