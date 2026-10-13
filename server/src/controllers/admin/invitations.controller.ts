import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { invitationCreateSchema, invitationUpdateSchema } from '../../schemas/index.js';
import { getSettings } from '../../services/event.service.js';
import { importInvitations } from '../../services/import.service.js';
import { generateToken, invitationUrl } from '../../services/token.service.js';
import { HttpError } from '../../utils/http.js';
import { cleanFamilyName, toWhatsappNumber } from '../../utils/phone.js';

type DisplayStatus = 'NO_ENVIADO' | 'ENVIADO' | 'ABIERTO' | 'CONFIRMADO' | 'RECHAZADO';

function displayStatus(inv: { status: string; sentAt: Date | null; firstOpenedAt: Date | null }): DisplayStatus {
  if (inv.status === 'CONFIRMADO') return 'CONFIRMADO';
  if (inv.status === 'RECHAZADO') return 'RECHAZADO';
  if (inv.firstOpenedAt) return 'ABIERTO';
  if (inv.sentAt) return 'ENVIADO';
  return 'NO_ENVIADO';
}

function fillTemplate(template: string, inv: { familyName: string; maxGuests: number; token: string }) {
  return template
    .replaceAll('{nombre_familia}', cleanFamilyName(inv.familyName))
    .replaceAll('{cupos}', String(inv.maxGuests))
    .replaceAll('{link}', invitationUrl(inv.token));
}

export async function listInvitations(_req: Request, res: Response) {
  const [invitations, blocked, settings] = await Promise.all([
    prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { devices: true } } },
    }),
    prisma.accessLog.groupBy({
      by: ['invitationId'],
      where: { allowed: false, invitationId: { not: null } },
      _count: { _all: true },
    }),
    getSettings(),
  ]);
  const blockedMap = new Map(blocked.map((b) => [b.invitationId, b._count._all]));

  res.json(
    invitations.map((inv) => {
      const text = fillTemplate(settings.whatsappTemplate, inv);
      const number = toWhatsappNumber(inv.contactPhone);
      return {
        id: inv.id,
        token: inv.token,
        familyName: inv.familyName,
        contactPhone: inv.contactPhone,
        contactEmail: inv.contactEmail,
        maxGuests: inv.maxGuests,
        maxDevices: inv.maxDevices,
        status: inv.status,
        displayStatus: displayStatus(inv),
        sentAt: inv.sentAt,
        firstOpenedAt: inv.firstOpenedAt,
        confirmedAt: inv.confirmedAt,
        notes: inv.notes,
        respondentName: inv.respondentName,
        attendingCount: inv.attendingCount,
        deviceCount: inv._count.devices,
        blockedCount: blockedMap.get(inv.id) ?? 0,
        link: invitationUrl(inv.token),
        whatsappUrl: number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null,
        whatsappText: text,
        createdAt: inv.createdAt,
      };
    }),
  );
}

export async function getInvitationDetail(req: Request, res: Response) {
  const inv = await prisma.invitation.findUnique({
    where: { id: String(req.params.id) },
    include: {
      devices: { orderBy: { firstSeen: 'asc' } },
      accessLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });
  if (!inv) throw new HttpError(404, 'NOT_FOUND', 'Invitación no encontrada');
  res.json({ ...inv, displayStatus: displayStatus(inv), link: invitationUrl(inv.token) });
}

export async function createInvitation(req: Request, res: Response) {
  const data = invitationCreateSchema.parse(req.body);
  const maxGuests = data.maxGuests ?? (await getSettings()).defaultMaxGuests;
  const inv = await prisma.invitation.create({ data: { ...data, maxGuests, token: generateToken() } });
  res.status(201).json(inv);
}

export async function updateInvitation(req: Request, res: Response) {
  const data = invitationUpdateSchema.parse(req.body);
  const inv = await prisma.invitation.update({ where: { id: String(req.params.id) }, data });
  res.json(inv);
}

export async function deleteInvitation(req: Request, res: Response) {
  await prisma.invitation.delete({ where: { id: String(req.params.id) } });
  res.status(204).end();
}

export async function importFromFile(req: Request, res: Response) {
  if (!req.file) throw new HttpError(400, 'NO_FILE', 'Adjunta un archivo .csv o .xlsx');
  const result = await importInvitations(req.file.buffer, req.file.originalname);
  res.status(201).json(result);
}

export async function markSent(req: Request, res: Response) {
  const inv = await prisma.invitation.update({
    where: { id: String(req.params.id) },
    data: { sentAt: new Date() },
  });
  res.json({ sentAt: inv.sentAt });
}

export async function resetDevices(req: Request, res: Response) {
  const id = String(req.params.id);
  const { count } = await prisma.invitationDevice.deleteMany({ where: { invitationId: id } });
  res.json({ removed: count });
}

export async function regenerateToken(req: Request, res: Response) {
  const id = String(req.params.id);
  const [, inv] = await prisma.$transaction([
    prisma.invitationDevice.deleteMany({ where: { invitationId: id } }),
    prisma.invitation.update({ where: { id }, data: { token: generateToken(), sentAt: null } }),
  ]);
  res.json({ token: inv.token, link: invitationUrl(inv.token) });
}
