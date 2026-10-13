/**
 * Fotos de la invitación guardadas en el DISCO del servidor (no en la base de datos):
 *   MEDIA_DIR/fotos/<id>-<ancho>.webp   → archivos optimizados (480/960/1600 px)
 *   MEDIA_DIR/photos.json               → lista de fotos: sección, orden, descripción, tamaños
 */
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import { MEDIA_DIR, PHOTOS_DIR, PHOTOS_MANIFEST } from '../config/paths.js';
import { HttpError } from '../utils/http.js';

export const SECTIONS = ['HERO', 'HISTORIA', 'GALERIA', 'CIERRE'] as const;
export type PhotoSection = (typeof SECTIONS)[number];

const WIDTHS = [480, 960, 1600];
const WEBP_QUALITY = 78;

interface Variant {
  width: number;
  url: string;
  file?: string;
}

export interface StoredPhoto {
  id: string;
  section: PhotoSection;
  order: number;
  alt: string;
  width: number;
  height: number;
  blurDataUrl: string | null;
  variants: Variant[];
  createdAt: string;
}

type Manifest = Record<PhotoSection, StoredPhoto[]>;

const emptyManifest = (): Manifest => ({ HERO: [], HISTORIA: [], GALERIA: [], CIERRE: [] });

// ── Lectura / escritura del índice ───────────────────────────────────────────
async function readManifest(): Promise<Manifest> {
  try {
    const raw = JSON.parse(await readFile(PHOTOS_MANIFEST, 'utf8')) as Partial<Manifest>;
    const m = emptyManifest();
    for (const s of SECTIONS) m[s] = (raw[s] ?? []).sort((a, b) => a.order - b.order);
    return m;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return emptyManifest();
    throw err;
  }
}

async function writeManifest(m: Manifest) {
  await mkdir(MEDIA_DIR, { recursive: true });
  for (const s of SECTIONS) m[s].forEach((p, i) => ((p.order = i), (p.section = s)));
  const tmp = `${PHOTOS_MANIFEST}.tmp`;
  await writeFile(tmp, JSON.stringify(m, null, 2));
  await rename(tmp, PHOTOS_MANIFEST); // escritura atómica
}

// Serializa las modificaciones del índice (evita que dos subidas simultáneas se pisen)
let queue: Promise<unknown> = Promise.resolve();
function withManifest<T>(fn: (m: Manifest) => Promise<T> | T): Promise<T> {
  const run = queue.then(async () => {
    const m = await readManifest();
    const result = await fn(m);
    await writeManifest(m);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

// ── Operaciones ─────────────────────────────────────────────────────────────
/** "03-nuestra-primera-cita.jpg" → "Nuestra primera cita"; nombres de cámara/WhatsApp → "" */
function altFromFilename(filename: string): string {
  const text = path
    .parse(filename)
    .name.replace(/^\d+[\s._-]*/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  if (!/[a-záéíóúñ]{3,}/i.test(text) || /^(img|dsc|pxl|photo|foto|whatsapp|image)\b/i.test(text)) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export async function uploadPhoto(buffer: Buffer, section: PhotoSection, originalName: string): Promise<StoredPhoto> {
  let normalized: Buffer;
  try {
    // Corrige la orientación EXIF y elimina metadatos (GPS, cámara…)
    normalized = await sharp(buffer, { failOn: 'none' }).rotate().toBuffer();
  } catch {
    throw new HttpError(400, 'INVALID_IMAGE', `No se pudo leer "${originalName}". Si es HEIC, expórtala como JPG.`);
  }
  const meta = await sharp(normalized).metadata();
  if (!meta.width || !meta.height) throw new HttpError(400, 'INVALID_IMAGE', `No se pudo leer "${originalName}"`);

  await mkdir(PHOTOS_DIR, { recursive: true });
  const id = nanoid(12);
  const widths = [...new Set(WIDTHS.map((w) => Math.min(w, meta.width!)))];
  const variants: Variant[] = [];
  let height = meta.height;

  for (const w of widths) {
    const file = `${id}-${w}.webp`;
    const info = await sharp(normalized)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(path.join(PHOTOS_DIR, file));
    variants.push({ width: info.width, url: `/fotos/${file}`, file });
    height = info.height;
  }
  const blur = await sharp(normalized).resize({ width: 16 }).webp({ quality: 30 }).toBuffer();
  const largest = variants[variants.length - 1];

  const photo: StoredPhoto = {
    id,
    section,
    order: 0,
    alt: altFromFilename(originalName),
    width: largest.width,
    height,
    blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
    variants,
    createdAt: new Date().toISOString(),
  };

  try {
    return await withManifest((m) => {
      m[section].push(photo);
      return photo;
    });
  } catch (err) {
    await removeFiles(photo);
    throw err;
  }
}

async function removeFiles(photo: StoredPhoto) {
  await Promise.all(
    photo.variants.filter((v) => v.file).map((v) => rm(path.join(PHOTOS_DIR, v.file!), { force: true })),
  );
}

export async function deletePhoto(id: string) {
  const removed = await withManifest((m) => {
    for (const s of SECTIONS) {
      const idx = m[s].findIndex((p) => p.id === id);
      if (idx >= 0) return m[s].splice(idx, 1)[0];
    }
    throw new HttpError(404, 'NOT_FOUND', 'Foto no encontrada');
  });
  await removeFiles(removed);
}

export function updatePhoto(id: string, data: { alt?: string; section?: PhotoSection }) {
  return withManifest((m) => {
    for (const s of SECTIONS) {
      const idx = m[s].findIndex((p) => p.id === id);
      if (idx < 0) continue;
      const photo = m[s][idx];
      if (data.alt !== undefined) photo.alt = data.alt;
      if (data.section && data.section !== s) {
        m[s].splice(idx, 1);
        m[data.section].push(photo);
      }
      return photo;
    }
    throw new HttpError(404, 'NOT_FOUND', 'Foto no encontrada');
  });
}

export function reorderPhotos(items: { id: string; section: PhotoSection; order: number }[]) {
  return withManifest((m) => {
    const all = new Map(SECTIONS.flatMap((s) => m[s]).map((p) => [p.id, p]));
    for (const item of items) {
      const p = all.get(item.id);
      if (p) Object.assign(p, { section: item.section, order: item.order });
    }
    for (const s of SECTIONS) m[s] = [];
    for (const p of [...all.values()].sort((a, b) => a.order - b.order)) m[p.section].push(p);
  });
}

// ── Vistas ──────────────────────────────────────────────────────────────────
function toPublic(p: StoredPhoto) {
  return {
    id: p.id,
    publicUrl: p.variants[p.variants.length - 1]?.url ?? '',
    section: p.section,
    order: p.order,
    alt: p.alt,
    width: p.width,
    height: p.height,
    blurDataUrl: p.blurDataUrl,
    variants: p.variants.map(({ width, url }) => ({ width, url })),
  };
}

/** Para el panel: solo las fotos subidas. */
export async function listUploadedPhotos() {
  const m = await readManifest();
  return Object.fromEntries(SECTIONS.map((s) => [s, m[s].map(toPublic)]));
}

/** Para la invitación: las secciones vacías se completan con fotos de ejemplo. */
export async function listPhotosForInvitation() {
  const m = await readManifest();
  return Object.fromEntries(
    SECTIONS.map((s) => [s, m[s].length ? m[s].map(toPublic) : PLACEHOLDERS[s].map((p, i) => placeholder(s, i, ...p))]),
  );
}

// ── Fotos de ejemplo (Unsplash) para secciones vacías ────────────────────────
type Ph = [id: string, ratio: [number, number], alt: string];
const PLACEHOLDERS: Record<PhotoSection, Ph[]> = {
  HERO: [
    ['1519741497674-611481863552', [2, 3], 'Los novios tomados de la mano'],
    ['1511285560929-80b456fea0bc', [3, 2], 'Los novios al atardecer'],
  ],
  HISTORIA: [
    ['1522673607200-164d1b6ce486', [4, 5], 'Nuestra primera cita'],
    ['1529636798458-92182e662485', [4, 5], 'Viajando juntos'],
    ['1515934751635-c81c6bc9a2d8', [4, 5], 'Los anillos de compromiso'],
    ['1537633552985-df8429e8048b', [4, 5], 'Preparando la boda'],
  ],
  GALERIA: [
    ['1465495976277-4387d4b0b4c6', [3, 4], 'Mesa decorada con flores'],
    ['1460978812857-470ed1c77af0', [4, 5], 'Ramo de novia'],
    ['1469371670807-013ccf25f16a', [3, 2], 'Celebración'],
    ['1520854221256-17451cc331bf', [2, 3], 'Detalle del vestido'],
    ['1507504031003-b417219a0fde', [4, 5], 'Los novios riendo'],
    ['1532712938310-34cb3982ef74', [1, 1], 'Flores blancas'],
    ['1525258946800-98cfd641d0de', [3, 4], 'Paseo en el jardín'],
    ['1583939003579-730e3918a45a', [2, 3], 'Retrato de la novia'],
    ['1591604466107-ec97de577aff', [4, 5], 'Brindis'],
    ['1546032996-6dfacbacbf3f', [3, 2], 'Abrazo'],
    ['1550005809-91ad75fb315f', [3, 4], 'Decoración'],
    ['1606216794074-735e91aa2c92', [4, 5], 'Momento especial'],
  ],
  CIERRE: [['1519225421980-715cb0215aed', [2, 3], 'Mesa de boda decorada']],
};

function unsplash(id: string, w: number, [rw, rh]: [number, number], q = 72) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&fm=webp&q=${q}&w=${w}&h=${Math.round((w * rh) / rw)}`;
}

function placeholder(section: PhotoSection, order: number, id: string, ratio: [number, number], alt: string) {
  const largest = WIDTHS[WIDTHS.length - 1];
  return {
    id: `ejemplo-${id}`,
    publicUrl: unsplash(id, largest, ratio),
    section,
    order,
    alt,
    width: largest,
    height: Math.round((largest * ratio[1]) / ratio[0]),
    blurDataUrl: unsplash(id, 24, ratio, 30),
    variants: WIDTHS.map((w) => ({ width: w, url: unsplash(id, w, ratio) })),
  };
}
