import type { EventSettings, Invitation } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      invitation?: Invitation;
      eventSettings?: EventSettings;
      adminId?: string;
    }
  }
}

export {};
