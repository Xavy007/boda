import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ADMIN_COOKIE } from '../config/cookies.js';
import { env } from '../config/env.js';

export interface AdminJwtPayload {
  sub: string;
  email: string;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (!token) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as AdminJwtPayload;
    req.adminId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED' });
  }
}
