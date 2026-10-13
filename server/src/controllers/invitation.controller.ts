import type { EventSettings, Invitation } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { rsvpSchema } from '../schemas/index.js';
import { buildIcs, calendarLinks } from '../services/calendar.service.js';
import { toPublicEvent } from '../services/event.service.js';
import { invitationUrl } from '../services/token.service.js';
import { HttpError } from '../utils/http.js';
import { cleanFamilyName } from '../utils/phone.js';

function view(inv: Invitation, settings: EventSettings) {
  const canEdit = Date.now() <= settings.rsvpDeadline.getTime();
  return {
    invitation: {
      familyName: cleanFamilyName(inv.familyName),
      maxGuests: inv.maxGuests,
      status: inv.status,
      confirmedAt: inv.confirmedAt?.toISOString() ?? null,
      respondentName: inv.respondentName,
      attendingCount: inv.attendingCount,
      dietaryNotes: inv.dietaryNotes,
      message: inv.message,
    },
    event: toPublicEvent(settings),
    rsvp: { deadline: settings.rsvpDeadline.toISOString(), canEdit },
    calendar: {
      ...calendarLinks(settings, invitationUrl(inv.token)),
      ics: `/api/invitation/${inv.token}/calendar.ics`,
    },
  };
}

export async function getInvitation(req: Request, res: Response) {
  res.json(view(req.invitation!, req.eventSettings!));
}

export async function submitRsvp(req: Request, res: Response) {
  const inv = req.invitation!;
  const settings = req.eventSettings!;
  const body = rsvpSchema.parse(req.body);

  if (Date.now() > settings.rsvpDeadline.getTime()) {
    throw new HttpError(409, 'RSVP_CLOSED', 'La fecha límite para confirmar ya pasó');
  }
  if (body.attending && (body.count < 1 || body.count > inv.maxGuests)) {
    throw new HttpError(400, 'INVALID_COUNT', `Puedes confirmar entre 1 y ${inv.maxGuests} personas`);
  }

  const updated = await prisma.invitation.update({
    where: { id: inv.id },
    data: {
      status: body.attending ? 'CONFIRMADO' : 'RECHAZADO',
      confirmedAt: new Date(),
      respondentName: body.name,
      attendingCount: body.attending ? body.count : 0,
      dietaryNotes: body.attending ? body.dietaryNotes : null,
      message: body.message,
    },
  });

  res.json(view(updated, settings));
}

export async function downloadCalendar(req: Request, res: Response) {
  const inv = req.invitation!;
  const ics = buildIcs(req.eventSettings!, invitationUrl(inv.token));
  res.set({
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': 'attachment; filename="nuestra-boda.ics"',
  });
  res.send(ics);
}
