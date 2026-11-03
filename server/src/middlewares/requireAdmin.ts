import type { AdminRole } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ADMIN_COOKIE } from '../config/cookies.js';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  iat?: number;
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (!token) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  let payload: AdminJwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as AdminJwtPayload;
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  // El rol se lee de la base en cada request: quitar un usuario o cambiar su rol aplica al instante
  const user = await prisma.adminUser.findUnique({ where: { id: payload.sub }, select: { role: true, passwordChangedAt: true } });
  // Una sesión iniciada antes del último cambio de contraseña ya no vale
  const staleSession = user?.passwordChangedAt && (payload.iat ?? 0) * 1000 < user.passwordChangedAt.getTime() - 1000;
  if (!user || staleSession) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  req.adminId = payload.sub;
  req.adminRole = user.role;
  next();
}

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminRole || !roles.includes(req.adminRole)) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'No tienes permiso para esta acción' });
      return;
    }
    next();
  };
}
