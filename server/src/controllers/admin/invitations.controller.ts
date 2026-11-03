import type { AdminRole, GuestSide } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { invitationContactSchema, invitationCreateSchema, invitationUpdateSchema } from '../../schemas/index.js';
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

/** La novia y el novio solo cargan invitados de su lado: el lado no lo eligen ellos */
export function forcedSide(role: AdminRole | undefined): GuestSide | undefined {
  return role === 'NOVIA' || role === 'NOVIO' ? role : undefined;
}

/** Invitaciones que puede ver cada rol: la novia y el novio, las de su lado y las de los dos */
function visibleTo(role: AdminRole | undefined) {
  const side = forcedSide(role);
  return side ? { side: { in: [side, 'AMBOS' as const] } } : {};
}

function fillTemplate(template: string, inv: { familyName: string; maxGuests: number; token: string }) {
  return template
    .replaceAll('{nombre_familia}', cleanFamilyName(inv.familyName))
    .replaceAll('{cupos}', String(inv.maxGuests))
    .replaceAll('{link}', invitationUrl(inv.token));
}

export async function listInvitations(req: Request, res: Response) {
  // Los novios solo cargan datos: no ven los links privados ni las respuestas
  const canSend = !forcedSide(req.adminRole);
  const [invitations, blocked, settings] = await Promise.all([
    prisma.invitation.findMany({
      where: visibleTo(req.adminRole),
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
        token: canSend ? inv.token : null,
        familyName: inv.familyName,
        isPerson: inv.isPerson,
        side: inv.side,
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
        respondentName: canSend ? inv.respondentName : null,
        attendingCount: canSend ? inv.attendingCount : 0,
        dietaryNotes: canSend ? inv.dietaryNotes : null,
        message: canSend ? inv.message : null,
        deviceCount: inv._count.devices,
        blockedCount: blockedMap.get(inv.id) ?? 0,
        link: canSend ? invitationUrl(inv.token) : null,
        whatsappUrl: canSend && number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null,
        whatsappText: canSend ? text : null,
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
  const { maxDevices, ...data } = invitationCreateSchema.parse(req.body);
  // El máximo de dispositivos es una medida de seguridad: solo lo elige el administrador
  const devices = req.adminRole === 'ADMIN' ? maxDevices : undefined;
  const maxGuests = data.maxGuests ?? (await getSettings()).defaultMaxGuests;
  const side = forcedSide(req.adminRole) ?? data.side;
  const inv = await prisma.invitation.create({ data: { ...data, side, maxGuests, maxDevices: devices, token: generateToken() } });
  res.status(201).json(inv);
}

export async function updateInvitation(req: Request, res: Response) {
  const data = invitationUpdateSchema.parse(req.body);
  const inv = await prisma.invitation.update({ where: { id: String(req.params.id) }, data });
  res.json(inv);
}

/** Nombre, teléfono y email: lo único que la planner y los novios pueden editar */
export async function updateContact(req: Request, res: Response) {
  const data = invitationContactSchema.parse(req.body);
  if (forcedSide(req.adminRole)) delete data.side;
  const own = await prisma.invitation.findFirst({ where: { id: String(req.params.id), ...visibleTo(req.adminRole) }, select: { id: true } });
  if (!own) throw new HttpError(404, 'NOT_FOUND', 'Invitación no encontrada');
  const inv = await prisma.invitation.update({
    where: { id: own.id },
    data,
    select: { familyName: true, isPerson: true, side: true, contactPhone: true, contactEmail: true },
  });
  res.json(inv);
}

export async function deleteInvitation(req: Request, res: Response) {
  await prisma.invitation.delete({ where: { id: String(req.params.id) } });
  res.status(204).end();
}

export async function importFromFile(req: Request, res: Response) {
  if (!req.file) throw new HttpError(400, 'NO_FILE', 'Adjunta un archivo .csv o .xlsx');
  const result = await importInvitations(req.file.buffer, req.file.originalname, forcedSide(req.adminRole));
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
