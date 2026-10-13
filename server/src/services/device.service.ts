import type { Invitation } from '@prisma/client';
import { nanoid } from 'nanoid';
import { prisma } from '../lib/prisma.js';

export type DeviceResult =
  | { allowed: true; deviceId: string; matchedBy: 'cookie' | 'fingerprint' | 'new' }
  | { allowed: false; reason: 'DEVICE_LIMIT' };

/**
 * Device binding invisible:
 * 1. La cookie httpOnly firmada coincide con un dispositivo registrado → permitido.
 * 2. Si la cookie se perdió, el fingerprint (SHA-256) coincide → permitido (y se re-emite la cookie).
 * 3. Si queda cupo (maxDevices), se registra el nuevo dispositivo automáticamente.
 * 4. Si no, se bloquea.
 */
export async function bindDevice(
  invitation: Invitation,
  cookieDeviceId: string | null,
  fingerprintHash: string | null,
): Promise<DeviceResult> {
  const now = new Date();

  if (cookieDeviceId) {
    const device = await prisma.invitationDevice.findUnique({
      where: { invitationId_deviceId: { invitationId: invitation.id, deviceId: cookieDeviceId } },
    });
    if (device) {
      await prisma.invitationDevice.update({
        where: { id: device.id },
        data: { lastSeen: now, fingerprintHash: fingerprintHash ?? device.fingerprintHash },
      });
      return { allowed: true, deviceId: device.deviceId, matchedBy: 'cookie' };
    }
  }

  if (fingerprintHash) {
    const device = await prisma.invitationDevice.findFirst({
      where: { invitationId: invitation.id, fingerprintHash },
      orderBy: { lastSeen: 'desc' },
    });
    if (device) {
      await prisma.invitationDevice.update({ where: { id: device.id }, data: { lastSeen: now } });
      return { allowed: true, deviceId: device.deviceId, matchedBy: 'fingerprint' };
    }
  }

  // Reutilizamos el deviceId de la cookie si existe (mismo dispositivo con varias invitaciones)
  const deviceId = cookieDeviceId ?? nanoid(32);

  return prisma.$transaction(async (tx) => {
    const count = await tx.invitationDevice.count({ where: { invitationId: invitation.id } });
    if (count >= invitation.maxDevices) return { allowed: false, reason: 'DEVICE_LIMIT' } as const;
    await tx.invitationDevice.create({
      data: { invitationId: invitation.id, deviceId, fingerprintHash, firstSeen: now, lastSeen: now },
    });
    return { allowed: true, deviceId, matchedBy: 'new' } as const;
  });
}
