import Link from "next/link";

type Props = {
  searchParams?: { canal?: string; servicio?: string };
};

export default function GraciasPage({ searchParams }: Props) {
  const canal = (searchParams?.canal ?? "contacto").toLowerCase();
  const servicio = searchParams?.servicio;

  const title =
    canal === "calendly"
      ? "¡Cita agendada!"
      : canal === "whatsapp"
        ? "¡Mensaje listo para enviar!"
        : "¡Gracias por escribirnos!";

  const description =
    canal === "calendly"
      ? "Revisa tu correo: allí llega la confirmación y los recordatorios."
      : canal === "whatsapp"
        ? "Si no se abrió WhatsApp, vuelve e intenta de nuevo."
        : "Recibimos tu solicitud. Te responderemos pronto por WhatsApp.";

  return (
    <main className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-slate-600">{description}</p>

      {servicio ? (
        <p className="mt-2 text-slate-600">
          Servicio: <span className="font-medium text-slate-900">{servicio}</span>
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/reservar"
          className="rounded-xl bg-black px-5 py-2.5 text-white hover:opacity-90"
        >
          Ir a Reservar
        </Link>

        <Link
          href="/"
          className="rounded-xl border border-slate-300 px-5 py-2.5 hover:bg-slate-50"
        >
          Volver al inicio
        </Link>

        <Link
          href="/contacto"
          className="rounded-xl border border-slate-300 px-5 py-2.5 hover:bg-slate-50"
        >
          Contacto
        </Link>
      </div>
    </main>
  );
}