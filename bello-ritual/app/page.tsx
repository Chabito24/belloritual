import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import HomeFinalCTA from "@/components/HomeFinalCTA";
import HomeBenefitsMod from "../components/HomeBenefits";
import Image from "next/image";

const HomeBenefits = (HomeBenefitsMod as any).default ?? HomeBenefitsMod;

const WHATSAPP_NUMBER = "573163044957"; // luego lo cambias

function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="space-y-16">
        <HomeHero />

        {/* SERVICIOS (3 CARDS) */}
        <section id="servicios" className="scroll-mt-28">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Nuestros Servicios</h2>
              <p className="mt-1 text-sm text-[#5B463D]">
                Extensiones de pestañas, uñas y depilación facial y corporal.
              </p>
            </div>
            <Link
              href="/servicios"
              className="hidden md:inline-flex text-sm text-[#B68A3A] hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {/* Pestañas */}
            <div className="rounded-3xl border border-[#E9D9C9] bg-white/60 p-5 shadow-sm">
              <div className="relative aspect-4/3 rounded-2xl bg-[#FBF7F2] overflow-hidden">
                <Image
                  src="/img/pesta.webp"
                  alt="Pestañas"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Pestañas</h3>
              <p className="mt-1 text-sm text-[#5B463D]">
                Extensiones, lifting y retoques.
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/servicios/pestanas"
                  className="rounded-full bg-[#B68A3A] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Ver más
                </Link>
                <Link
                  href="/reservar"
                  className="rounded-full border border-[#E9D9C9] bg-white/70 px-4 py-2 text-sm font-medium hover:border-[#B68A3A]"
                >
                  Reservar
                </Link>
              </div>
            </div>

            {/* Uñas */}
            <div className="rounded-3xl border border-[#E9D9C9] bg-white/60 p-5 shadow-sm">
              <div className="relative aspect-4/3 rounded-2xl bg-[#FBF7F2] overflow-hidden">
                <Image
                  src="/img/unas.webp"
                  alt="Uñas"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Uñas</h3>
              <p className="mt-1 text-sm text-[#5B463D]">
                Manicure & pedicure, gel y acrílico.
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/servicios/unas"
                  className="rounded-full bg-[#B68A3A] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Ver más
                </Link>
                <Link
                  href="/reservar"
                  className="rounded-full border border-[#E9D9C9] bg-white/70 px-4 py-2 text-sm font-medium hover:border-[#B68A3A]"
                >
                  Reservar
                </Link>
              </div>
            </div>

            {/* Depilación */}
            <div className="rounded-3xl border border-[#E9D9C9] bg-white/60 p-5 shadow-sm">
              <div className="relative aspect-4/3 rounded-2xl bg-[#FBF7F2] overflow-hidden">
                <Image
                  src="/img/depila.webp"
                  alt="Depilación"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Depilación</h3>
              <p className="mt-1 text-sm text-[#5B463D]">Facial y corporal.</p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/servicios/depilacion"
                  className="rounded-full bg-[#B68A3A] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Ver más
                </Link>
                <Link
                  href="/reservar"
                  className="rounded-full border border-[#E9D9C9] bg-white/70 px-4 py-2 text-sm font-medium hover:border-[#B68A3A]"
                >
                  Reservar
                </Link>
              </div>
            </div>
          </div>
        </section>

        <HomeBenefits />
        {/* ✅ HOME FINAL CTA con imagen de fondo (rostro.webp) */}
        <section className="relative overflow-hidden rounded-3xl border border-[#E9D9C9] shadow-sm">
          <Image
            src="/img/rostro.webp"
            alt="Bello Ritual - Lista para tu cambio"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-white/75" />
          <div className="relative z-10">
            <HomeFinalCTA embedded />
          </div>
        </section>

        {/* CONTACTO */}
        <section id="contacto" className="scroll-mt-28">
          {/* ✅ Fondo con mensaje.webp */}
          <div className="relative overflow-hidden rounded-3xl border border-[#E9D9C9] shadow-sm">
            <Image
              src="/img/mensaje.webp"
              alt="Bello Ritual - Contacto"
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-white/75" />

            <div className="relative z-10 rounded-3xl bg-white/60 p-8">
              <h2 className="text-2xl font-semibold">¿Tienes preguntas?</h2>
              <p className="mt-2 text-sm text-[#5B463D]">
                Escríbenos por WhatsApp o usa el formulario en la página de contacto.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/contacto#form"
                  className="rounded-full bg-[#B68A3A] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Ir al formulario
                </Link>
                <a
                  href={waLink("Hola, tengo una pregunta sobre los servicios de Bello Ritual.")}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#E9D9C9] bg-white/70 px-5 py-2.5 text-sm font-medium hover:border-[#B68A3A]"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}