import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, isProd } from './config/env.js';
import { PHOTOS_DIR } from './config/paths.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { adminRouter } from './routes/admin.routes.js';
import { invitationRouter } from './routes/invitation.routes.js';
import { photosRouter } from './routes/photos.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');

export function createApp() {
  const app = express();

  // Render / Railway están detrás de un proxy: necesario para req.ip y rate limit
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'media-src': ["'self'", 'https:', 'blob:'],
          'frame-src': ['https://www.google.com', 'https://maps.google.com'],
          'connect-src': ["'self'"],
          'upgrade-insecure-requests': isProd ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      // no-referrer: el token nunca se filtra a sitios externos (Maps, WhatsApp…)
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/invitation', invitationRouter);
  app.use('/api/photos', photosRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'NOT_FOUND' });
  });

  // Fotos subidas desde el panel (disco del servidor). Nombres únicos → caché de 1 año
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  app.use(
    '/fotos',
    express.static(PHOTOS_DIR, { index: false, maxAge: '365d', immutable: true, fallthrough: false }),
  );

  // En producción Express sirve el build de React
  if (fs.existsSync(clientDist)) {
    // WhatsApp/Facebook exigen URLs absolutas en og:image
    const indexHtml = fs
      .readFileSync(path.join(clientDist, 'index.html'), 'utf8')
      .replace('content="/og-image.jpg"', `content="${env.CLIENT_URL}/og-image.jpg"`);

    app.use(
      express.static(clientDist, {
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      }),
    );
    app.get('/{*splat}', (req, res) => {
      if (req.path.startsWith('/i/') || req.path.startsWith('/admin')) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.type('html').send(indexHtml);
    });
  }

  app.use(errorHandler);
  return app;
}
