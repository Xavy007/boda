/** Código de país por defecto para números locales (Bolivia). */
const DEFAULT_COUNTRY_CODE = '591';

/** Normaliza un teléfono al formato que espera wa.me (solo dígitos con código de país). */
export function toWhatsappNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 8) return `${DEFAULT_COUNTRY_CODE}${digits}`;
  return digits.replace(/^00/, '');
}

/**
 * Link para abrir WhatsApp con el mensaje escrito. Va directo a api.whatsapp.com y no a wa.me:
 * la redirección de wa.me cambia los emojis (💍) por "�".
 */
export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  const number = toWhatsappNumber(phone);
  if (!number) return null;
  return `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(text)}`;
}

/** "Familia Pérez" → "Pérez" (para saludar "Querida familia Pérez" sin duplicar). */
export function cleanFamilyName(name: string): string {
  return name.trim().replace(/^(la\s+)?familia\s+/i, '').trim();
}
