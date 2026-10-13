import type { EventSettings } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http.js';
import { whatsappLink } from '../utils/phone.js';

export interface Palette {
  ivory: string;
  sage: string;
  gold: string;
  ink: string;
}

export const DEFAULT_PALETTE: Palette = {
  ivory: '#FAF7F2',
  sage: '#9CAF88',
  gold: '#C9A96E',
  ink: '#3A3A3A',
};

export interface GiftInfo {
  message?: string;
  registryName?: string;
  registryUrl?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  accountType?: string;
  documentId?: string;
  alias?: string;
}

export interface StoryItem {
  date: string;
  title: string;
  text: string;
}

export interface ItineraryItem {
  time: string;
  title: string;
  description?: string;
  icon: string;
}

const CACHE_TTL_MS = 30_000;
let cache: { value: EventSettings; at: number } | null = null;

export async function getSettings(): Promise<EventSettings> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.value;
  const settings = await prisma.eventSettings.findUnique({ where: { id: 1 } });
  if (!settings) throw new HttpError(503, 'NOT_CONFIGURED', 'El evento aún no está configurado. Ejecuta el seed.');
  cache = { value: settings, at: Date.now() };
  return settings;
}

export function invalidateSettingsCache() {
  cache = null;
}

export function eventEnd(settings: EventSettings): Date {
  return settings.eventEndDate ?? new Date(settings.eventDate.getTime() + 8 * 60 * 60 * 1000);
}

export function coupleNames(settings: EventSettings): string {
  return `${settings.partnerOneName} & ${settings.partnerTwoName}`;
}

/** Link de WhatsApp a los novios SIN datos personales (para la pantalla de bloqueo). */
export function blockedContactLink(settings: EventSettings | null): string | null {
  if (!settings) return null;
  return whatsappLink(
    settings.couplePhone,
    'Hola 👋 Intento abrir mi invitación y me aparece que ya fue abierta en otro dispositivo. ¿Me ayudan?',
  );
}

/** Datos del evento que se envían a invitados autorizados (nunca la plantilla de WhatsApp ni notas internas). */
export function toPublicEvent(s: EventSettings) {
  return {
    partnerOneName: s.partnerOneName,
    partnerTwoName: s.partnerTwoName,
    eventDate: s.eventDate.toISOString(),
    eventEndDate: eventEnd(s).toISOString(),
    timezone: s.timezone,
    ceremony: {
      name: s.ceremonyName,
      address: s.ceremonyAddress,
      lat: s.ceremonyLat,
      lng: s.ceremonyLng,
      mapsUrl: s.ceremonyMapsUrl,
    },
    reception: {
      name: s.receptionName,
      address: s.receptionAddress,
      time: s.receptionTime,
      lat: s.receptionLat,
      lng: s.receptionLng,
      mapsUrl: s.receptionMapsUrl,
    },
    dressCode: s.dressCode,
    dressCodeNote: s.dressCodeNote,
    dressCodeColors: (s.dressCodeColors as string[] | null) ?? [],
    mainPhrase: s.mainPhrase,
    quotePhrase: s.quotePhrase,
    quoteAuthor: s.quoteAuthor,
    closingPhrase: s.closingPhrase,
    rsvpDeadline: s.rsvpDeadline.toISOString(),
    giftInfo: (s.giftInfo as GiftInfo | null) ?? {},
    coupleWhatsapp: whatsappLink(s.couplePhone, `Hola ${coupleNames(s)} 💍`),
    palette: { ...DEFAULT_PALETTE, ...((s.palette as Partial<Palette> | null) ?? {}) },
    musicUrl: s.musicUrl,
    storyItems: (s.storyItems as StoryItem[] | null) ?? [],
    itinerary: (s.itinerary as ItineraryItem[] | null) ?? [],
  };
}
