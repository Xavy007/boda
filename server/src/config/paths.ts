import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Raíz del repositorio (funciona igual desde src/ con tsx y desde dist/ compilado). */
export const REPO_ROOT = path.resolve(here, '../../..');

/**
 * Carpeta donde se guardan las fotos subidas desde el panel (no van a la base de datos).
 * En Render/Railway debe apuntar a un disco persistente, p. ej. MEDIA_DIR=/var/data/media
 */
export const MEDIA_DIR = path.resolve(process.env.MEDIA_DIR || path.join(REPO_ROOT, 'media'));
export const PHOTOS_DIR = path.join(MEDIA_DIR, 'fotos');
export const PHOTOS_MANIFEST = path.join(MEDIA_DIR, 'photos.json');
