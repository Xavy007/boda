import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { settingsSchema } from '../../schemas/index.js';
import { DEFAULT_PALETTE, getSettings, invalidateSettingsCache } from '../../services/event.service.js';
import { HttpError } from '../../utils/http.js';
import { utcToZonedLocal, zonedLocalToUtc } from '../../utils/time.js';

export async function getAdminSettings(_req: Request, res: Response) {
  invalidateSettingsCache();
  const s = await getSettings();
  const { eventDate, eventEndDate, rsvpDeadline, ...rest } = s;
  res.json({
    ...rest,
    palette: { ...DEFAULT_PALETTE, ...(s.palette as object) },
    eventDateLocal: utcToZonedLocal(eventDate, s.timezone),
    eventEndDateLocal: eventEndDate ? utcToZonedLocal(eventEndDate, s.timezone) : '',
    rsvpDeadlineLocal: utcToZonedLocal(rsvpDeadline, s.timezone),
  });
}

export async function updateAdminSettings(req: Request, res: Response) {
  const { eventDateLocal, eventEndDateLocal, rsvpDeadlineLocal, ...data } = settingsSchema.parse(req.body);
  const eventDate = zonedLocalToUtc(eventDateLocal, data.timezone);
  const eventEndDate = eventEndDateLocal ? zonedLocalToUtc(eventEndDateLocal, data.timezone) : null;
  const rsvpDeadline = zonedLocalToUtc(rsvpDeadlineLocal, data.timezone);

  if (eventEndDate && eventEndDate <= eventDate) {
    throw new HttpError(400, 'INVALID_DATES', 'La hora de fin debe ser posterior al inicio');
  }

  await prisma.eventSettings.update({
    where: { id: 1 },
    data: { ...data, eventDate, eventEndDate, rsvpDeadline },
  });
  invalidateSettingsCache();
  await getAdminSettings(req, res);
}
