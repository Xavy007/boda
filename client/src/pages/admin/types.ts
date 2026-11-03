import type { InvitationStatus, Palette, GiftInfo, ItineraryItem, StoryItem } from '@/lib/types';

export type AdminRole = 'ADMIN' | 'PLANNER' | 'NOVIOS';

export interface AdminMe {
  email: string;
  role: AdminRole;
}

export interface TeamMember {
  id: string;
  email: string;
  role: Exclude<AdminRole, 'ADMIN'>;
  createdAt: string;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: 'Administrador',
  PLANNER: 'Wedding planner',
  NOVIOS: 'Novios',
};

export type DisplayStatus = 'NO_ENVIADO' | 'ENVIADO' | 'ABIERTO' | 'CONFIRMADO' | 'RECHAZADO';

/** token, link, whatsapp* y la respuesta llegan vacíos para los novios (solo cargan datos) */
export interface AdminInvitation {
  id: string;
  token: string | null;
  familyName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  maxGuests: number;
  maxDevices: number;
  status: InvitationStatus;
  displayStatus: DisplayStatus;
  sentAt: string | null;
  firstOpenedAt: string | null;
  confirmedAt: string | null;
  notes: string | null;
  respondentName: string | null;
  attendingCount: number;
  dietaryNotes: string | null;
  message: string | null;
  deviceCount: number;
  blockedCount: number;
  link: string | null;
  whatsappUrl: string | null;
  whatsappText: string | null;
  createdAt: string;
}

export interface AccessLogRow {
  id: string;
  invitationId: string | null;
  ip: string | null;
  userAgent: string | null;
  fingerprintHash: string | null;
  allowed: boolean;
  reason: string | null;
  createdAt: string;
  invitation?: { id: string; familyName: string } | null;
}

export interface InvitationDetail {
  id: string;
  token: string;
  familyName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  maxGuests: number;
  maxDevices: number;
  status: InvitationStatus;
  displayStatus: DisplayStatus;
  sentAt: string | null;
  firstOpenedAt: string | null;
  confirmedAt: string | null;
  message: string | null;
  notes: string | null;
  link: string;
  respondentName: string | null;
  attendingCount: number;
  dietaryNotes: string | null;
  devices: { id: string; deviceId: string; fingerprintHash: string | null; firstSeen: string; lastSeen: string }[];
  accessLogs: AccessLogRow[];
}

export interface Stats {
  total: number;
  sent: number;
  opened: number;
  confirmed: number;
  rejected: number;
  pending: number;
  attendingGuests: number;
  seatsAssigned: number;
  blockedTotal: number;
  blockedWeek: number;
  recentBlocked: AccessLogRow[];
}

export interface AdminSettings {
  partnerOneName: string;
  partnerTwoName: string;
  eventDateLocal: string;
  eventEndDateLocal: string;
  timezone: string;
  ceremonyName: string;
  ceremonyAddress: string;
  ceremonyLat: number | null;
  ceremonyLng: number | null;
  ceremonyMapsUrl: string | null;
  receptionName: string;
  receptionAddress: string;
  receptionTime: string | null;
  receptionLat: number | null;
  receptionLng: number | null;
  receptionMapsUrl: string | null;
  dressCode: string;
  dressCodeNote: string | null;
  mainPhrase: string;
  quotePhrase: string | null;
  quoteAuthor: string | null;
  closingPhrase: string | null;
  rsvpDeadlineLocal: string;
  defaultMaxGuests: number;
  giftInfo: GiftInfo;
  couplePhone: string;
  whatsappTemplate: string;
  palette: Palette;
  musicUrl: string | null;
  storyItems: StoryItem[];
  itinerary: ItineraryItem[];
}

export const STATUS_META: Record<DisplayStatus | 'BLOQUEADO', { label: string; className: string }> = {
  NO_ENVIADO: { label: 'No enviado', className: 'bg-ink/[0.06] text-ink/60' },
  ENVIADO: { label: 'Enviado', className: 'bg-sky-100 text-sky-700' },
  ABIERTO: { label: 'Abierto', className: 'bg-amber-100 text-amber-700' },
  CONFIRMADO: { label: 'Confirmado', className: 'bg-emerald-100 text-emerald-700' },
  RECHAZADO: { label: 'No asiste', className: 'bg-rose-100 text-rose-700' },
  BLOQUEADO: { label: 'Bloqueado', className: 'bg-red-600 text-white' },
};

export const fmtDateTime = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
    : '—';
