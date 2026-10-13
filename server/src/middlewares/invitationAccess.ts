import type { NextFunction, Request, Response } from 'express';
import { DEVICE_COOKIE, deviceCookieOptions } from '../config/cookies.js';
import { prisma } from '../lib/prisma.js';
import { bindDevice } from '../services/device.service.js';
import { blockedContactLink, getSettings } from '../services/event.service.js';
import { TOKEN_REGEX } from '../services/token.service.js';
import { getClientIp } from '../utils/http.js';
import { invitationExpiresAt } from '../utils/time.js';

const FINGERPRINT_REGEX = /^[a-f0-9]{64}$/;

function readFingerprint(req: Request): string | null {
  const raw = req.get('x-device-fingerprint') ?? (typeof req.query.fp === 'string' ? req.query.fp : '');
  const value = raw.trim().toLowerCase();
  return FINGERPRINT_REGEX.test(value) ? value : null;
}

function readDeviceCookie(req: Request): string | null {
  const value = req.signedCookies?.[DEVICE_COOKIE];
  return typeof value === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(value) ? value : null;
}

/**
 * Valida token + dispositivo en CADA request de /api/invitation/:token/*.
 * Si algo falla, responde sin revelar ningún dato del evento ni de la familia.
 */
export async function invitationAccess(req: Request, res: Response, next: NextFunction) {
  const token = String(req.params.token ?? '');
  const fingerprintHash = readFingerprint(req);
  const log = (invitationId: string | null, allowed: boolean, reason?: string) =>
    prisma.accessLog
      .create({
        data: {
          invitationId,
          allowed,
          reason,
          fingerprintHash,
          ip: getClientIp(req.ip),
          userAgent: req.get('user-agent')?.slice(0, 500) ?? null,
        },
      })
      .catch((err) => console.error('No se pudo registrar el AccessLog', err));

  res.set('Cache-Control', 'no-store');

  if (!TOKEN_REGEX.test(token)) {
    await log(null, false, 'INVALID_TOKEN');
    res.status(404).json({ error: 'INVALID' });
    return;
  }

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) {
    await log(null, false, 'INVALID_TOKEN');
    res.status(404).json({ error: 'INVALID' });
    return;
  }

  const settings = await getSettings();
  if (Date.now() > invitationExpiresAt(settings.eventDate, settings.timezone).getTime()) {
    await log(invitation.id, false, 'EXPIRED');
    res.status(410).json({ error: 'EXPIRED' });
    return;
  }

  const cookieDeviceId = readDeviceCookie(req);
  const result = await bindDevice(invitation, cookieDeviceId, fingerprintHash);

  if (!result.allowed) {
    await log(invitation.id, false, result.reason);
    // Solo el link para escribir a los novios; nada de nombres, dirección ni datos del evento.
    res.status(403).json({ error: 'DEVICE_LIMIT', contact: blockedContactLink(settings) });
    return;
  }

  await log(invitation.id, true, result.matchedBy);

  if (result.deviceId !== cookieDeviceId) {
    res.cookie(DEVICE_COOKIE, result.deviceId, deviceCookieOptions);
  }

  req.invitation = invitation.firstOpenedAt
    ? invitation
    : await prisma.invitation.update({ where: { id: invitation.id }, data: { firstOpenedAt: new Date() } });
  req.eventSettings = settings;
  next();
}
