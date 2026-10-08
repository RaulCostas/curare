/**
 * Normaliza cualquier formato de celular (nacional o internacional) a un JID válido de WhatsApp.
 * Elimina espacios, paréntesis, guiones y caracteres no numéricos.
 * 
 * Casos contemplados:
 * - Bolivia local (8 dígitos, ej: "71234567"): se antepone "591" -> "59171234567@s.whatsapp.net"
 * - Bolivia con código ("+591 71234567", "59171234567"): se mantiene "59171234567@s.whatsapp.net"
 * - EEUU / Canadá ("+1 (301) 455-2980", "13014552980"): -> "13014552980@s.whatsapp.net"
 * - EEUU sin el +1 ("(301) 455-2980" de 10 dígitos): se antepone "1" -> "13014552980@s.whatsapp.net"
 * - Otros países ("+54 9 11 ...", "+51 987 ...", "+34 612 ..."): se limpian símbolos y se mantiene el código de país internacional.
 */
export function formatWhatsAppJid(celular: string): string {
    if (!celular) return '';
    const raw = String(celular).trim();
    const digits = raw.replace(/\D/g, '');

    if (!digits) return '';

    // Si tiene 8 dígitos (celular estándar de Bolivia)
    if (digits.length === 8) {
        return `591${digits}@s.whatsapp.net`;
    }

    // Si tiene 10 dígitos y no empieza con 591 (formato estándar de EE.UU./Canadá sin el prefijo 1)
    if (digits.length === 10 && !digits.startsWith('591')) {
        return `1${digits}@s.whatsapp.net`;
    }

    // Si ya incluye código de país internacional (ej. 13014552980, 59171234567, 54911..., 519...)
    return `${digits}@s.whatsapp.net`;
}
