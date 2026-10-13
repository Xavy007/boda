import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

// ── Público ────────────────────────────────────────────────────────────────
export const rsvpSchema = z
  .object({
    attending: z.boolean(),
    name: z.string().trim().min(3, 'Escribe tu nombre completo').max(120),
    count: z.number().int().min(0).max(30).default(1),
    dietaryNotes: optionalText(300),
    message: optionalText(1000),
  })
  .strict();

// ── Admin ──────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'Contraseña obligatoria').max(200),
});

export const invitationCreateSchema = z.object({
  familyName: z.string().trim().min(1, 'El nombre de la familia es obligatorio').max(120),
  contactPhone: optionalText(30),
  contactEmail: z
    .string()
    .trim()
    .email('Email inválido')
    .max(160)
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  maxGuests: z.coerce.number().int().min(1).max(30).optional(),
  maxDevices: z.coerce.number().int().min(1).max(10).default(2),
  notes: optionalText(2000),
});

export const invitationUpdateSchema = invitationCreateSchema.partial().extend({
  status: z.enum(['PENDIENTE', 'CONFIRMADO', 'RECHAZADO']).optional(),
});

const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Fecha y hora inválidas (AAAA-MM-DDTHH:mm)');
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color HEX inválido (#RRGGBB)');
const optionalUrl = z
  .string()
  .trim()
  .url('URL inválida')
  .max(1000)
  .optional()
  .nullable()
  .or(z.literal('').transform(() => null));

export const settingsSchema = z.object({
  partnerOneName: z.string().trim().min(1).max(60),
  partnerTwoName: z.string().trim().min(1).max(60),
  eventDateLocal: localDateTime,
  eventEndDateLocal: localDateTime.optional().nullable().or(z.literal('').transform(() => null)),
  timezone: z
    .string()
    .trim()
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, 'Zona horaria inválida'),
  ceremonyName: z.string().trim().min(1).max(160),
  ceremonyAddress: z.string().trim().min(1).max(300),
  ceremonyLat: z.coerce.number().min(-90).max(90).optional().nullable(),
  ceremonyLng: z.coerce.number().min(-180).max(180).optional().nullable(),
  ceremonyMapsUrl: optionalUrl,
  receptionName: z.string().trim().min(1).max(160),
  receptionAddress: z.string().trim().min(1).max(300),
  receptionTime: optionalText(10),
  receptionLat: z.coerce.number().min(-90).max(90).optional().nullable(),
  receptionLng: z.coerce.number().min(-180).max(180).optional().nullable(),
  receptionMapsUrl: optionalUrl,
  dressCode: z.string().trim().min(1).max(120),
  dressCodeNote: optionalText(500),
  dressCodeColors: z.array(hex).max(10).default([]),
  mainPhrase: z.string().trim().min(1).max(300),
  quotePhrase: optionalText(400),
  quoteAuthor: optionalText(120),
  closingPhrase: optionalText(400),
  rsvpDeadlineLocal: localDateTime,
  defaultMaxGuests: z.coerce.number().int().min(1).max(30).default(2),
  giftInfo: z
    .object({
      message: z.string().max(600).optional(),
      registryName: z.string().max(120).optional(),
      registryUrl: z.string().max(500).optional(),
      bankName: z.string().max(120).optional(),
      accountHolder: z.string().max(120).optional(),
      accountNumber: z.string().max(60).optional(),
      accountType: z.string().max(60).optional(),
      documentId: z.string().max(60).optional(),
      alias: z.string().max(120).optional(),
    })
    .default({}),
  couplePhone: z.string().trim().min(6).max(30),
  whatsappTemplate: z
    .string()
    .trim()
    .min(10)
    .max(1500)
    .refine((t) => t.includes('{link}'), 'La plantilla debe incluir {link}'),
  palette: z.object({ ivory: hex, sage: hex, gold: hex, ink: hex }),
  musicUrl: optionalUrl,
  storyItems: z
    .array(
      z.object({
        date: z.string().trim().max(60),
        title: z.string().trim().min(1).max(120),
        text: z.string().trim().max(800),
      }),
    )
    .max(20)
    .default([]),
  itinerary: z
    .array(
      z.object({
        time: z.string().trim().max(10),
        title: z.string().trim().min(1).max(120),
        description: z.string().trim().max(300).optional(),
        icon: z.string().trim().max(30),
      }),
    )
    .max(20)
    .default([]),
});
