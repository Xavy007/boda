import { Router } from 'express';
import { login, logout, me } from '../controllers/admin/auth.controller.js';
import {
  createInvitation,
  deleteInvitation,
  getInvitationDetail,
  importFromFile,
  listInvitations,
  markSent,
  regenerateToken,
  resetDevices,
  updateInvitation,
  updateContact,
} from '../controllers/admin/invitations.controller.js';
import { editPhoto, listPhotos, removePhoto, sortPhotos, uploadPhotos } from '../controllers/admin/photos.controller.js';
import { exportExcel, getLogs, getStats } from '../controllers/admin/reports.controller.js';
import { getAdminSettings, getItinerary, updateAdminSettings, updateItinerary } from '../controllers/admin/settings.controller.js';
import { createTeamMember, deleteTeamMember, listTeam } from '../controllers/admin/team.controller.js';
import { adminLimiter, loginLimiter } from '../middlewares/rateLimits.js';
import { requireAdmin, requireRole } from '../middlewares/requireAdmin.js';
import { uploadImages, uploadSpreadsheet } from '../middlewares/upload.js';

export const adminRouter = Router();

adminRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

adminRouter.post('/login', loginLimiter, login);
adminRouter.post('/logout', logout);

adminRouter.use(adminLimiter, requireAdmin);

// ── Todo el equipo: cargar familias, teléfonos y datos de contacto ──────────
adminRouter.get('/me', me);
adminRouter.get('/invitations', listInvitations);
adminRouter.post('/invitations', createInvitation);
adminRouter.post('/invitations/import', uploadSpreadsheet.single('file'), importFromFile);
adminRouter.put('/invitations/:id/contact', updateContact);

// ── Administrador y wedding planner: confirmaciones, enviar links, reporte e itinerario
adminRouter.post('/invitations/:id/mark-sent', requireRole('ADMIN', 'PLANNER'), markSent);
adminRouter.get('/stats', requireRole('ADMIN', 'PLANNER'), getStats);
adminRouter.get('/export', requireRole('ADMIN', 'PLANNER'), exportExcel);
adminRouter.get('/itinerary', requireRole('ADMIN', 'PLANNER'), getItinerary);
adminRouter.put('/itinerary', requireRole('ADMIN', 'PLANNER'), updateItinerary);

// ── Solo el administrador ────────────────────────────────────────────────────
adminRouter.use(requireRole('ADMIN'));

adminRouter.get('/invitations/:id', getInvitationDetail);
adminRouter.put('/invitations/:id', updateInvitation);
adminRouter.delete('/invitations/:id', deleteInvitation);
adminRouter.post('/invitations/:id/reset-devices', resetDevices);
adminRouter.post('/invitations/:id/regenerate-token', regenerateToken);

adminRouter.get('/logs', getLogs);

adminRouter.get('/photos', listPhotos);
adminRouter.post('/photos', uploadImages.array('files', 10), uploadPhotos);
adminRouter.put('/photos/reorder', sortPhotos);
adminRouter.put('/photos/:id', editPhoto);
adminRouter.delete('/photos/:id', removePhoto);

adminRouter.get('/settings', getAdminSettings);
adminRouter.put('/settings', updateAdminSettings);

adminRouter.get('/team', listTeam);
adminRouter.post('/team', createTeamMember);
adminRouter.delete('/team/:id', deleteTeamMember);
