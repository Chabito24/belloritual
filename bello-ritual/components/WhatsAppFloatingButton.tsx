function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.669.15-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.148-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.569-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347M12.051 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.83 9.83 0 0 1 6.99 2.9 9.86 9.86 0 0 1 2.897 6.99c-.002 5.45-4.437 9.884-9.891 9.884M20.464 3.488A11.815 11.815 0 0 0 12.05.002C5.495.002.16 5.335.158 11.892c0 2.096.547 4.142 1.588 5.946L0 24l6.305-1.654a11.87 11.87 0 0 0 5.74 1.464h.005c6.557 0 11.892-5.335 11.895-11.893a11.82 11.82 0 0 0-3.481-8.429z" />
    </svg>
  );
}

export default function WhatsAppFloatingButton({
  phone,
  message,
}: {
  phone: string;
  message: string;
}) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Escríbenos por WhatsApp"
      title="WhatsApp"
      className="fixed bottom-5 right-5 z-60 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:opacity-90"
    >
      {/* ✅ sin translate; block evita ajustes por baseline */}
      <WhatsAppIcon className="block h-8 w-8" />
    </a>
  );
}