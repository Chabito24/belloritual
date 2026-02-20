import Link from "next/link";
import ContactForm from "@/components/ContactForm";

const WHATSAPP_NUMBER = "573163044957"; // luego lo cambias

export default function ContactoPage() {
  return (
    <section className="space-y-10">
      {/* Hero */}
      <div className="rounded-3xl border border-[#E9D9C9] bg-white/60 p-10 text-center shadow-sm">
        <h1 className="text-4xl font-semibold">Contáctanos</h1>
        <p className="mt-3 text-sm text-[#5B463D]">
          Cuéntanos qué necesitas y te responderemos pronto.
        </p>

        <Link
          href="#form"
          className="mt-6 inline-flex rounded-full bg-[#B68A3A] px-6 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Reservar cita
        </Link>
      </div>

      {/* Form */}
      <ContactForm />

      {/* WhatsApp directo */}
      <div className="rounded-3xl border border-[#E9D9C9] bg-white/60 p-6 text-center shadow-sm">
        <p className="text-sm text-[#5B463D]">¿Prefieres escribirnos por WhatsApp?</p>
        <a
          className="mt-3 inline-flex rounded-full border border-[#E9D9C9] bg-white/70 px-6 py-3 text-sm font-medium hover:border-[#B68A3A]"
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer"
        >
          Abrir WhatsApp
        </a>
      </div>
    </section>
  );
}
