import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { HttpError } from '../utils/http.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.code, message: err.message, ...err.extra });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: err.issues[0]?.message ?? 'Datos inválidos',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo es demasiado grande' : err.message;
    res.status(400).json({ error: 'UPLOAD_ERROR', message });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Registro no encontrado' });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'CONFLICT', message: 'El registro ya existe' });
      return;
    }
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'INVALID_JSON', message: 'JSON inválido' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado' });
}
