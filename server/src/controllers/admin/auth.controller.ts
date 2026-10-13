import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ADMIN_COOKIE, ADMIN_SESSION_MS, adminCookieOptions } from '../../config/cookies.js';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { loginSchema } from '../../schemas/index.js';
import { HttpError } from '../../utils/http.js';

// Hash ficticio para que el tiempo de respuesta no revele si el email existe
const DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy-password', 12);

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !ok) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email o contraseña incorrectos');

  const token = jwt.sign({ sub: admin.id, email: admin.email }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: Math.floor(ADMIN_SESSION_MS / 1000),
  });
  res.cookie(ADMIN_COOKIE, token, adminCookieOptions);
  res.json({ email: admin.email });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(ADMIN_COOKIE, { ...adminCookieOptions, maxAge: undefined });
  res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  const admin = await prisma.adminUser.findUnique({ where: { id: req.adminId }, select: { email: true } });
  if (!admin) throw new HttpError(401, 'UNAUTHORIZED');
  res.json(admin);
}
