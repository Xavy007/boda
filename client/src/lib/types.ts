export type PhotoSection = 'HERO' | 'HISTORIA' | 'GALERIA' | 'CIERRE';
export type InvitationStatus = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO';

export interface Photo {
  id: string;
  publicUrl: string;
  section: PhotoSection;
  order: number;
  alt: string;
  width: number;
  height: number;
  blurDataUrl: string | null;
  variants: { width: number; url: string }[];
}

export type PhotosBySection = Record<PhotoSection, Photo[]>;

export interface Palette {
  ivory: string;
  sage: string;
  gold: string;
  ink: string;
}

export interface Venue {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
  time?: string | null;
}

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

export interface PublicEvent {
  partnerOneName: string;
  partnerTwoName: string;
  eventDate: string;
  eventEndDate: string;
  timezone: string;
  ceremony: Venue;
  reception: Venue;
  dressCode: string;
  dressCodeNote: string | null;
  dressCodeColors: string[];
  mainPhrase: string;
  quotePhrase: string | null;
  quoteAuthor: string | null;
  closingPhrase: string | null;
  rsvpDeadline: string;
  giftInfo: GiftInfo;
  coupleWhatsapp: string | null;
  palette: Palette;
  musicUrl: string | null;
  storyItems: StoryItem[];
  itinerary: ItineraryItem[];
}

export interface InvitationData {
  invitation: {
    familyName: string;
    maxGuests: number;
    status: InvitationStatus;
    confirmedAt: string | null;
    respondentName: string | null;
    attendingCount: number;
    dietaryNotes: string | null;
    message: string | null;
  };
  event: PublicEvent;
  rsvp: { deadline: string; canEdit: boolean };
  calendar: { google: string; outlook: string; ics: string };
}

export type AccessErrorKind = 'INVALID' | 'DEVICE_LIMIT' | 'EXPIRED' | 'RATE_LIMITED' | 'NETWORK';
