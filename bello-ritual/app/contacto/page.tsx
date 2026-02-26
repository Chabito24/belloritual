import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import MapEmbedSection from "@/components/MapEmbed";
import BusinessHoursSection from "@/components/BusinessHours";
import { BUSINESS_INFO } from "@/lib/business"; // si tu archivo se llama bussines.ts, vuelve a "@/lib/bussines"
import Image from "next/image";

const WHATSAPP_NUMBER = "573163044957"; // luego lo cambias
// const GOOGLE_FORM_URL =
//   "https://docs.google.com/forms/d/e/1FAIpQLScaaL-vGVjm1Fv6io3RF3L0iZ9h3EYQSYusfEqB__f4h_weAA/viewform?usp=header"; sprint futuro

export default function ContactoPage() {
  return (
    <section className="space-y-10">
      {/* Hero */}
    <div className="relative overflow-hidden rounded-3xl border border-[#E9D9C9] bg-white/60 p-10 text-center shadow-sm min-h-320px">
      <Image
        src="/img/contacto.webp"
        alt="Contáctanos - Bello Ritual"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Overlay para legibilidad */}
      <div className="absolute inset-0 bg-white/60" />

      {/* Tu contenido existente, intacto */}
      <div className="relative z-10">
        <h1 className="text-4xl font-semibold">Contáctanos</h1>
        <p className="mt-3 text-sm text-[#5B463D]">
          Si tienes dudas o quieres más información, escríbenos y te responderemos pronto.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="#form"
            className="inline-flex rounded-full bg-[#B68A3A] px-6 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            Enviar consulta
          </Link>

          <Link
            href="/reservar"
            className="inline-flex rounded-full border border-[#E9D9C9] bg-white/70 px-6 py-3 text-sm font-medium text-[#2B1B14] hover:border-[#B68A3A]"
          >
            Ir a reservas
          </Link>
        </div>
      </div>
    </div>

      {/* Formulario de contacto / lead */}
      <div id="form">
        <ContactForm />
      </div>

      {/* Formulario de seguimiento (Google Form -> Sheets) */}
      {/* <div className="rounded-3xl border border-[#E9D9C9] bg-white/60 p-6 shadow-sm">
  <h2 className="text-xl font-semibold text-[#2B1B14]">
    ¿Prefieres que te contactemos después?
  </h2>

  <p className="mt-2 text-sm text-[#5B463D]">
    Déjanos tus datos en nuestro formulario y te escribimos por WhatsApp.
  </p>

  <a
    href={GOOGLE_FORM_URL}
    target="_blank"
    rel="noreferrer"
    className="mt-4 inline-flex rounded-full border border-[#E9D9C9] bg-white/70 px-6 py-3 text-sm font-medium text-[#2B1B14] hover:border-[#B68A3A]"
  >
    Dejar datos
  </a>

  <p className="mt-3 text-xs text-[#6A5A57]">
    Se abrirá el formulario en una nueva pestaña.
  </p> sprint futuro
</div> */}

      {/* WhatsApp directo */}
      <div className="rounded-3xl border border-[#E9D9C9] bg-white/60 p-6 text-center shadow-sm">
        <p className="text-sm text-[#5B463D]">
          ¿Prefieres escribirnos directamente por WhatsApp?
        </p>
        <a
          className="mt-3 inline-flex rounded-full border border-[#E9D9C9] bg-white/70 px-6 py-3 text-sm font-medium hover:border-[#B68A3A]"
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer"
        >
          Abrir WhatsApp
        </a>

        <p className="mt-3 text-xs text-[#6A5A57]">
          Si ya deseas agendar, también puedes ir directamente a la página de reservas.
        </p>
      </div>

      {/* Ubicación + Horarios */}
      <section id="ubicacion-horarios" className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#2B1B14]">Ubicación y horarios</h2>
          <p className="mt-2 text-sm text-[#5B463D]">
            Encuéntranos fácilmente, revisa nuestros horarios y agenda tu cita.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <MapEmbedSection
            embedUrl={BUSINESS_INFO.mapsEmbedUrl}
            placeUrl={BUSINESS_INFO.mapsPlaceUrl}
            title={`Mapa de ${BUSINESS_INFO.name}`}
          />

          <div className="space-y-4">
            {/* Dirección */}
            <div className="rounded-2xl border border-[#E9D9C9] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-[#2B1B14]">Dirección</h3>

              <p className="mt-3 text-sm text-[#5B463D]">
                {BUSINESS_INFO.addressLine1}
              </p>

              {BUSINESS_INFO.addressLine2 ? (
                <p className="text-sm text-[#5B463D]">
                  {BUSINESS_INFO.addressLine2}
                </p>
              ) : null}

              <a
                href={BUSINESS_INFO.mapsPlaceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full border border-[#E9D9C9] bg-white/70 px-5 py-2 text-sm font-medium text-[#2B1B14] hover:border-[#B68A3A]"
              >
                Ver en Google Maps
              </a>
            </div>

            {/* Horarios */}
            <BusinessHoursSection hours={BUSINESS_INFO.hours} />
          </div>
        </div>
      </section>
    </section>
  );
}