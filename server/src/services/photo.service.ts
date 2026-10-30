/**
 * Fotos de la invitación:
 *   Supabase Storage, bucket `fotos` → <id>-<ancho>.webp (480/960/1600 px), servidas por su CDN
 *   Tabla Photo (Postgres)           → sección, orden, descripción y URLs de cada foto
 * Así no se pierden aunque el disco del servidor se borre (plan gratis de Render).
 */
import path from 'node:path';
import type { Photo } from '@prisma/client';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import { prisma } from '../lib/prisma.js';
import { publicUrl, removeObjects, uploadObject } from '../lib/storage.js';
import { HttpError } from '../utils/http.js';

export const SECTIONS = ['HERO', 'HISTORIA', 'GALERIA', 'CIERRE'] as const;
export type PhotoSection = (typeof SECTIONS)[number];

const WIDTHS = [480, 960, 1600];
const WEBP_QUALITY = 78;

interface Variant {
  width: number;
  url: string;
  /** Ruta dentro del bucket */
  path: string;
}

const variantsOf = (p: Photo) => p.variants as unknown as Variant[];

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

export async function uploadPhoto(buffer: Buffer, section: PhotoSection, originalName: string) {
  let normalized: Buffer;
  try {
    // Corrige la orientación EXIF y elimina metadatos (GPS, cámara…)
    normalized = await sharp(buffer, { failOn: 'none' }).rotate().toBuffer();
  } catch {
    throw new HttpError(400, 'INVALID_IMAGE', `No se pudo leer "${originalName}". Si es HEIC, expórtala como JPG.`);
  }
  const meta = await sharp(normalized).metadata();
  if (!meta.width || !meta.height) throw new HttpError(400, 'INVALID_IMAGE', `No se pudo leer "${originalName}"`);

  const id = nanoid(12);
  const widths = [...new Set(WIDTHS.map((w) => Math.min(w, meta.width!)))];
  const variants: Variant[] = [];
  let height = meta.height;

  try {
    for (const w of widths) {
      const { data, info } = await sharp(normalized)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer({ resolveWithObject: true });
      const objectPath = `${id}-${info.width}.webp`;
      await uploadObject(objectPath, data, 'image/webp');
      variants.push({ width: info.width, url: publicUrl(objectPath), path: objectPath });
      height = info.height;
    }
    const blur = await sharp(normalized).resize({ width: 16 }).webp({ quality: 30 }).toBuffer();
    const largest = variants[variants.length - 1];

    return await prisma.photo.create({
      data: {
        id,
        section,
        order: await prisma.photo.count({ where: { section } }),
        alt: altFromFilename(originalName),
        width: largest.width,
        height,
        blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
        variants: variants as object[],
      },
    });
  } catch (err) {
    await removeObjects(variants.map((v) => v.path)).catch(() => undefined);
    throw err;
  }
}

async function findPhoto(id: string) {
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) throw new HttpError(404, 'NOT_FOUND', 'Foto no encontrada');
  return photo;
}

export async function deletePhoto(id: string) {
  const photo = await findPhoto(id);
  await removeObjects(variantsOf(photo).map((v) => v.path));
  await prisma.photo.delete({ where: { id } });
}

export async function updatePhoto(id: string, data: { alt?: string; section?: PhotoSection }) {
  const photo = await findPhoto(id);
  const moving = data.section && data.section !== photo.section;
  const updated = await prisma.photo.update({
    where: { id },
    data: {
      alt: data.alt,
      // Al cambiar de sección pasa al final de la nueva
      ...(moving && { section: data.section, order: await prisma.photo.count({ where: { section: data.section } }) }),
    },
  });
  return toPublic(updated);
}

export async function reorderPhotos(items: { id: string; section: PhotoSection; order: number }[]) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.photo.updateMany({ where: { id: item.id }, data: { section: item.section, order: item.order } }),
    ),
  );
}

// ── Vistas ──────────────────────────────────────────────────────────────────
function toPublic(p: Photo) {
  const variants = variantsOf(p);
  return {
    id: p.id,
    publicUrl: variants[variants.length - 1]?.url ?? '',
    section: p.section as PhotoSection,
    order: p.order,
    alt: p.alt,
    width: p.width,
    height: p.height,
    blurDataUrl: p.blurDataUrl,
    variants: variants.map(({ width, url }) => ({ width, url })),
  };
}

async function photosBySection() {
  const all = await prisma.photo.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
  return Object.fromEntries(SECTIONS.map((s) => [s, all.filter((p) => p.section === s).map(toPublic)])) as Record<
    PhotoSection,
    ReturnType<typeof toPublic>[]
  >;
}

/** Para el panel: solo las fotos subidas. */
export function listUploadedPhotos() {
  return photosBySection();
}

/** Para la invitación: las secciones vacías se completan con fotos de ejemplo. */
export async function listPhotosForInvitation() {
  const m = await photosBySection();
  return Object.fromEntries(
    SECTIONS.map((s) => [s, m[s].length ? m[s] : PLACEHOLDERS[s].map((p, i) => placeholder(s, i, ...p))]),
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
