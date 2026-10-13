import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { buildExportWorkbook } from '../../services/export.service.js';

export async function getStats(_req: Request, res: Response) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, sent, opened, byStatus, seats, attending, blockedTotal, blockedWeek, recentBlocked] =
    await Promise.all([
      prisma.invitation.count(),
      prisma.invitation.count({ where: { sentAt: { not: null } } }),
      prisma.invitation.count({ where: { firstOpenedAt: { not: null } } }),
      prisma.invitation.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.invitation.aggregate({ _sum: { maxGuests: true } }),
      prisma.invitation.aggregate({ where: { status: 'CONFIRMADO' }, _sum: { attendingCount: true } }),
      prisma.accessLog.count({ where: { allowed: false } }),
      prisma.accessLog.count({ where: { allowed: false, createdAt: { gte: weekAgo } } }),
      prisma.accessLog.findMany({
        where: { allowed: false, invitationId: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { invitation: { select: { id: true, familyName: true } } },
      }),
    ]);

  const count = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;

  res.json({
    total,
    sent,
    opened,
    confirmed: count('CONFIRMADO'),
    rejected: count('RECHAZADO'),
    pending: count('PENDIENTE'),
    attendingGuests: attending._sum.attendingCount ?? 0,
    seatsAssigned: seats._sum.maxGuests ?? 0,
    blockedTotal,
    blockedWeek,
    recentBlocked,
  });
}

export async function exportExcel(_req: Request, res: Response) {
  const buffer = await buildExportWorkbook();
  const date = new Date().toISOString().slice(0, 10);
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="invitados-boda-${date}.xlsx"`,
  });
  res.send(buffer);
}

export async function getLogs(req: Request, res: Response) {
  const blocked = req.query.blocked === 'true';
  const invitationId = typeof req.query.invitationId === 'string' ? req.query.invitationId : undefined;
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const logs = await prisma.accessLog.findMany({
    where: { ...(blocked ? { allowed: false } : {}), ...(invitationId ? { invitationId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { invitation: { select: { id: true, familyName: true } } },
  });
  res.json(logs);
}
