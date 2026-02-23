export const WHATSAPP_NUMBER = "573163044957";

export function buildWhatsAppUrl(message: string, phone = WHATSAPP_NUMBER) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function serviceWhatsAppMessage(serviceTitle: string) {
  return `Hola, me interesa el servicio de ${serviceTitle}. Quisiera agendar una cita, ¿qué horarios tienen disponibles?`;
}