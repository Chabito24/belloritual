"use client";

type HourRow = {
  day: string;
  time: string;
};

interface BusinessHoursProps {
  hours: HourRow[];
}

export default function BusinessHours({ hours }: BusinessHoursProps) {
  return (
    <div className="rounded-2xl border border-[#E9D9C9] bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[#2B1F1E]">Horarios de atención</h3>

      <ul className="mt-4 space-y-2 text-sm text-[#5B463D]">
        {hours.map((row) => (
          <li
            key={row.day}
            className="flex items-start justify-between gap-4 border-b border-[#F3EDE4] pb-2 last:border-b-0 last:pb-0"
          >
            <span className="font-medium">{row.day}</span>
            <span className="text-right">{row.time}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-[#6A5A57]">
        * Horarios sujetos a disponibilidad y reservas previas.
      </p>
    </div>
  );
}