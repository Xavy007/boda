import { Router } from 'express';
import { publicApiLimiter } from '../middlewares/rateLimits.js';
import { listPhotosForInvitation } from '../services/photo.service.js';

export const photosRouter = Router();

photosRouter.get('/', publicApiLimiter, async (_req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json(await listPhotosForInvitation());
});
