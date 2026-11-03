import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { customAlphabet } from 'nanoid';
import { prisma } from '../../lib/prisma.js';
import { teamMemberCreateSchema } from '../../schemas/index.js';
import { HttpError } from '../../utils/http.js';

const TEAM_ROLES = ['PLANNER', 'NOVIA', 'NOVIO'] as const;
const select = { id: true, email: true, role: true, createdAt: true } as const;
// Sin caracteres que se confunden al copiarlos a mano (0/O, 1/l/I)
const newPassword = customAlphabet('abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789', 12);

export async function listTeam(_req: Request, res: Response) {
  const team = await prisma.adminUser.findMany({
    where: { role: { in: [...TEAM_ROLES] } },
    orderBy: { createdAt: 'asc' },
    select,
  });
  res.json(team);
}

export async function createTeamMember(req: Request, res: Response) {
  const { email, password, role } = teamMemberCreateSchema.parse(req.body);
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, 'EMAIL_TAKEN', 'Ya existe un usuario con ese email');
  const member = await prisma.adminUser.create({
    data: { email, passwordHash: await bcrypt.hash(password, 12), role },
    select,
  });
  res.status(201).json(member);
}

export async function deleteTeamMember(req: Request, res: Response) {
  // Solo se quitan planners y novios: los administradores no se borran desde el panel
  const { count } = await prisma.adminUser.deleteMany({
    where: { id: String(req.params.id), role: { in: [...TEAM_ROLES] } },
  });
  if (!count) throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado');
  res.status(204).end();
}

/** Asigna una contraseña nueva y cierra sus sesiones. Se devuelve una sola vez para que el admin la envíe. */
export async function resetTeamPassword(req: Request, res: Response) {
  const member = await prisma.adminUser.findFirst({
    where: { id: String(req.params.id), role: { in: [...TEAM_ROLES] } },
    select: { id: true },
  });
  if (!member) throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado');

  const password = newPassword();
  await prisma.adminUser.update({
    where: { id: member.id },
    data: { passwordHash: await bcrypt.hash(password, 12), passwordChangedAt: new Date() },
  });
  res.json({ password });
}
