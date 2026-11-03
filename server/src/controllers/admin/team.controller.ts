import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { teamMemberCreateSchema } from '../../schemas/index.js';
import { HttpError } from '../../utils/http.js';

const TEAM_ROLES = ['PLANNER', 'NOVIOS'] as const;
const select = { id: true, email: true, role: true, createdAt: true } as const;

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
