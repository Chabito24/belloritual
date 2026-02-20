import CalendlyEmbed from "@/components/CalendlyEmbed";

export default function ReservarPage() {
  const url =
    "https://calendly.com/emartinezj1802/30min" +
    "?hide_event_type_details=1" +
    "&hide_gdpr_banner=1" +
    "&background_color=fbf8f3" +
    "&text_color=2b1f1e" +
    "&primary_color=c9a35b";

  return (
    <section className="py-10">
      <h1 className="text-3xl font-semibold">Reserva tu cita</h1>
      <p className="mt-2 text-sm opacity-80">
        Elige el horario y confirma tu reserva.
      </p>

      <CalendlyEmbed url={url} height={700} />
    </section>
  );
}