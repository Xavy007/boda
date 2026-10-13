import { Router } from 'express';
import { downloadCalendar, getInvitation, submitRsvp } from '../controllers/invitation.controller.js';
import { invitationAccess } from '../middlewares/invitationAccess.js';
import { invitationFailLimiter, invitationLimiter } from '../middlewares/rateLimits.js';

export const invitationRouter = Router();

invitationRouter.use(invitationLimiter, invitationFailLimiter);

invitationRouter.get('/:token', invitationAccess, getInvitation);
invitationRouter.post('/:token/rsvp', invitationAccess, submitRsvp);
invitationRouter.get('/:token/calendar.ics', invitationAccess, downloadCalendar);
