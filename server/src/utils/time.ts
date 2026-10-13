/**
 * Utilidades de zona horaria sin dependencias (Intl).
 * America/La_Paz es UTC-4 sin horario de verano, pero se soporta cualquier zona IANA.
 */

/** Diferencia (ms) entre la hora local de `tz` y UTC en el instante dado. */
export function tzOffsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2027-03-20T16:00" (hora local en `tz`) → Date UTC */
export function zonedLocalToUtc(local: string, tz: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(local);
  if (!m) throw new Error(`Fecha local inválida: ${local}`);
  const [, y, mo, d, h = '0', mi = '0'] = m;
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  let result = guess - tzOffsetMs(new Date(guess), tz);
  // Segunda pasada por si el offset cambia (DST) entre la conjetura y el resultado
  result = guess - tzOffsetMs(new Date(result), tz);
  return new Date(result);
}

/** Date UTC → "2027-03-20T16:00" en hora local de `tz` (para inputs datetime-local) */
export function utcToZonedLocal(date: Date, tz: string): string {
  const local = new Date(date.getTime() + tzOffsetMs(date, tz));
  return local.toISOString().slice(0, 16);
}

/** Hora (local) del día siguiente a la boda en que vencen los links. */
const EXPIRY_HOUR_NEXT_DAY = 6;

/**
 * Los tokens expiran automáticamente al día siguiente de la boda
 * (a las 06:00 hora local, para no cortar el acceso en plena fiesta).
 */
export function invitationExpiresAt(eventDate: Date, tz: string): Date {
  const day = utcToZonedLocal(eventDate, tz).slice(0, 10);
  const next = new Date(`${day}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const hh = String(EXPIRY_HOUR_NEXT_DAY).padStart(2, '0');
  return zonedLocalToUtc(`${next.toISOString().slice(0, 10)}T${hh}:00`, tz);
}
