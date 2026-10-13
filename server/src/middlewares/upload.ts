import multer from 'multer';
import { HttpError } from '../utils/http.js';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif']);

export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_TYPES.has(file.mimetype) || /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.originalname)) cb(null, true);
    else cb(new HttpError(400, 'INVALID_FILE', `"${file.originalname}" no es una imagen`));
  },
});

export const uploadSpreadsheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/\.(csv|txt|xlsx)$/i.test(file.originalname)) cb(null, true);
    else cb(new HttpError(400, 'INVALID_FILE', 'Sube un archivo .csv o .xlsx'));
  },
});
