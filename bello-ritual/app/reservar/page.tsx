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

      {/* Política de reserva */}
      <div className="rounded-3xl border border-[#E9D9C9] bg-white/60 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#2B1B14]">Política de reserva</h2>

        <ul className="mt-3 space-y-2 text-sm text-[#5B463D]">
          <li>• Las citas se agendan según disponibilidad confirmada.</li>
          <li>• Si necesitas cancelar o reprogramar, avísanos con mínimo 12 horas de anticipación.</li>
          <li>• Si no asistes y no avisas con tiempo, la próxima cita podrá requerir confirmación previa.</li>
          <li>• El tiempo de espera máximo es de 10 minutos.</li>
        </ul>

        <p className="mt-3 text-xs text-[#6A5A57]">
          Al reservar, aceptas estas condiciones de atención.
        </p>
      </div>
    </section>
  );
}

