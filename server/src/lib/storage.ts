/**
 * Cliente mínimo de Supabase Storage (API REST, sin dependencias).
 * Las fotos van a un bucket público: las URLs se sirven desde el CDN de Supabase.
 */
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

export const BUCKET = 'fotos';

function config() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new HttpError(
      500,
      'STORAGE_NOT_CONFIGURED',
      'Faltan SUPABASE_URL y SUPABASE_SECRET_KEY para guardar las fotos en Supabase Storage',
    );
  }
  const key = env.SUPABASE_SECRET_KEY;
  // Las keys nuevas (sb_secret_…) van solo en `apikey`; la service_role antigua (JWT) también como Bearer
  const headers: Record<string, string> = { apikey: key };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  return { base: `${env.SUPABASE_URL}/storage/v1`, headers };
}

async function call(path: string, init: RequestInit & { headers?: Record<string, string> } = {}) {
  const { base, headers } = config();
  const res = await fetch(`${base}${path}`, { ...init, headers: { ...headers, ...init.headers } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new HttpError(502, 'STORAGE_ERROR', `Supabase Storage respondió ${res.status}: ${body.slice(0, 200)}`);
  }
  return res;
}

export function publicUrl(objectPath: string) {
  return `${env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

let bucketReady: Promise<void> | null = null;

/** Crea el bucket público la primera vez (si ya existe, no hace nada). */
export function ensureBucket() {
  bucketReady ??= (async () => {
    const { base, headers } = config();
    const res = await fetch(`${base}/bucket/${BUCKET}`, { headers });
    if (res.ok) return;
    await call('/bucket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, allowed_mime_types: ['image/webp'] }),
    });
  })().catch((err) => {
    bucketReady = null;
    throw err;
  });
  return bucketReady;
}

export async function uploadObject(objectPath: string, body: Buffer, contentType: string) {
  await ensureBucket();
  await call(`/object/${BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: { 'Content-Type': contentType, 'Cache-Control': 'max-age=31536000', 'x-upsert': 'true' },
    body: new Uint8Array(body),
  });
}

export async function removeObjects(objectPaths: string[]) {
  if (!objectPaths.length) return;
  await call(`/object/${BUCKET}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: objectPaths }),
  });
}
