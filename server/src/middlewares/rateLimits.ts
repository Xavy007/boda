import rateLimit from 'express-rate-limit';

const FIFTEEN_MIN = 15 * 60 * 1000;
const common = { standardHeaders: 'draft-7' as const, legacyHeaders: false };

/** Límite general de uso de la invitación (navegación normal). */
export const invitationLimiter = rateLimit({
  ...common,
  windowMs: FIFTEEN_MIN,
  limit: 150,
  message: { error: 'RATE_LIMITED' },
});

/** Anti fuerza bruta: solo cuenta respuestas fallidas (404/403/410) por IP. */
export const invitationFailLimiter = rateLimit({
  ...common,
  windowMs: FIFTEEN_MIN,
  limit: 15,
  skipSuccessfulRequests: true,
  message: { error: 'RATE_LIMITED' },
});

export const loginLimiter = rateLimit({
  ...common,
  windowMs: FIFTEEN_MIN,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { error: 'RATE_LIMITED', message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

export const publicApiLimiter = rateLimit({
  ...common,
  windowMs: FIFTEEN_MIN,
  limit: 300,
  message: { error: 'RATE_LIMITED' },
});

export const adminLimiter = rateLimit({
  ...common,
  windowMs: FIFTEEN_MIN,
  limit: 1500,
  message: { error: 'RATE_LIMITED' },
});
