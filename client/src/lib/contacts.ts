export interface PickedContact {
  name: string;
  phone: string;
}

interface ContactsManager {
  select(props: ('name' | 'tel')[], opts?: { multiple?: boolean }): Promise<{ name?: string[]; tel?: string[] }[]>;
}

/** Contact Picker API: Chrome en Android. Safari (iPhone) no la tiene: ahí se sube el .vcf */
export const canPickContacts = typeof navigator !== 'undefined' && 'contacts' in navigator && typeof window !== 'undefined' && 'ContactsManager' in window;

/** Celular o tablet: en la computadora no se ofrece importar contactos, se escribe el número */
export const isMobileDevice =
  typeof navigator !== 'undefined' &&
  (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));

const cleanPhone = (tel: string) => tel.replace(/[^\d+]/g, '');

export async function pickContact(): Promise<PickedContact | null> {
  const contacts = (navigator as Navigator & { contacts: ContactsManager }).contacts;
  const [c] = await contacts.select(['name', 'tel'], { multiple: false });
  if (!c) return null;
  return { name: c.name?.[0]?.trim() ?? '', phone: cleanPhone(c.tel?.[0] ?? '') };
}

/** Primer contacto de un archivo .vcf (el que genera "Compartir contacto" en el celular) */
export function parseVcard(text: string): PickedContact | null {
  // Las líneas largas continúan en la siguiente con un espacio al inicio
  const lines = text.replace(/\r\n[ \t]/g, '').split(/\r?\n/);
  let name = '';
  let phone = '';
  let mobile = '';
  for (const line of lines) {
    const sep = line.indexOf(':');
    if (sep < 0) continue;
    const key = line.slice(0, sep).toUpperCase();
    const value = line.slice(sep + 1).trim();
    if (key === 'END' && value.toUpperCase() === 'VCARD' && (name || phone)) break;
    if (key.startsWith('FN')) name = value;
    else if (key.startsWith('N') && !key.startsWith('NOTE') && !key.startsWith('NICKNAME') && !name) {
      // N:Apellido;Nombre;Segundo;Prefijo;Sufijo
      const [last = '', first = ''] = value.split(';');
      name = `${first} ${last}`.trim();
    } else if (key.startsWith('TEL') || key.includes('.TEL')) {
      if (!phone) phone = value;
      if (!mobile && /CELL|MOBILE|IPHONE/.test(key)) mobile = value;
    }
  }
  if (!name && !phone) return null;
  return { name: name.replace(/\\,/g, ',').replace(/\\;/g, ';'), phone: cleanPhone(mobile || phone) };
}
