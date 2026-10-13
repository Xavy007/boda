import type { EventSettings } from '@prisma/client';
import { createEvent, type DateArray } from 'ics';
import { coupleNames, eventEnd } from './event.service.js';

function mapsLink(s: EventSettings): string | null {
  if (s.ceremonyMapsUrl) return s.ceremonyMapsUrl;
  if (s.ceremonyLat != null && s.ceremonyLng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${s.ceremonyLat},${s.ceremonyLng}`;
  }
  return null;
}

function eventInfo(s: EventSettings, inviteUrl: string) {
  const title = `Boda de ${coupleNames(s)}`;
  const location = `${s.ceremonyName}, ${s.ceremonyAddress}`;
  const maps = mapsLink(s);
  const lines = [
    `¡Nos casamos! Te esperamos para celebrar juntos.`,
    `Ceremonia: ${s.ceremonyName} — ${s.ceremonyAddress}`,
    maps ? `Cómo llegar: ${maps}` : null,
    `Recepción: ${s.receptionName} — ${s.receptionAddress}`,
    s.receptionMapsUrl ? `Cómo llegar a la recepción: ${s.receptionMapsUrl}` : null,
    `Dress code: ${s.dressCode}`,
    `Invitación: ${inviteUrl}`,
  ].filter(Boolean);
  return { title, location, description: lines.join('\n'), start: s.eventDate, end: eventEnd(s) };
}

/** 2027-03-20T20:00:00.000Z → 20270320T200000Z */
function toCalendarUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function calendarLinks(s: EventSettings, inviteUrl: string) {
  const e = eventInfo(s, inviteUrl);

  const google = new URL('https://calendar.google.com/calendar/render');
  google.searchParams.set('action', 'TEMPLATE');
  google.searchParams.set('text', e.title);
  google.searchParams.set('dates', `${toCalendarUtc(e.start)}/${toCalendarUtc(e.end)}`);
  google.searchParams.set('details', e.description);
  google.searchParams.set('location', e.location);
  google.searchParams.set('ctz', s.timezone);

  const outlook = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  outlook.searchParams.set('path', '/calendar/action/compose');
  outlook.searchParams.set('rru', 'addevent');
  outlook.searchParams.set('subject', e.title);
  outlook.searchParams.set('startdt', e.start.toISOString());
  outlook.searchParams.set('enddt', e.end.toISOString());
  outlook.searchParams.set('body', e.description);
  outlook.searchParams.set('location', e.location);

  return { google: google.toString(), outlook: outlook.toString() };
}

function toDateArray(d: Date): DateArray {
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];
}

export function buildIcs(s: EventSettings, inviteUrl: string): string {
  const e = eventInfo(s, inviteUrl);
  const geo =
    s.ceremonyLat != null && s.ceremonyLng != null ? { lat: s.ceremonyLat, lon: s.ceremonyLng } : undefined;

  const { error, value } = createEvent({
    uid: `boda-${s.eventDate.getTime()}@invitacion`,
    title: e.title,
    description: e.description,
    location: e.location,
    url: mapsLink(s) ?? inviteUrl,
    geo,
    start: toDateArray(e.start),
    startInputType: 'utc',
    startOutputType: 'utc',
    end: toDateArray(e.end),
    endInputType: 'utc',
    endOutputType: 'utc',
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    productId: 'boda-invitacion/ics',
    alarms: [
      { action: 'display', description: `Mañana: ${e.title}`, trigger: { days: 1, before: true } },
    ],
  });

  if (error || !value) throw error ?? new Error('No se pudo generar el archivo .ics');
  return value;
}
