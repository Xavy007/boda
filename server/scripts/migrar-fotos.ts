/**
 * Migración única: sube a Supabase Storage las fotos de media/ (el sistema anterior, en disco)
 * y las registra en la tabla Photo con su misma sección, orden y descripción.
 *   npm run fotos:migrar -w server
 * Es seguro repetirlo: las fotos que ya están en la tabla se saltan.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/lib/prisma.js';
import { publicUrl, uploadObject } from '../src/lib/storage.js';

const MEDIA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../media');

interface OldPhoto {
  id: string;
  section: string;
  order: number;
  alt: string;
  width: number;
  height: number;
  blurDataUrl: string | null;
  variants: { width: number; file: string }[];
  createdAt: string;
}

const manifest = JSON.parse(await readFile(path.join(MEDIA_DIR, 'photos.json'), 'utf8')) as Record<string, OldPhoto[]>;
let migrated = 0;
let skipped = 0;

for (const [section, photos] of Object.entries(manifest)) {
  for (const p of photos) {
    if (await prisma.photo.findUnique({ where: { id: p.id } })) {
      skipped++;
      continue;
    }
    const variants = [];
    for (const v of p.variants) {
      await uploadObject(v.file, await readFile(path.join(MEDIA_DIR, 'fotos', v.file)), 'image/webp');
      variants.push({ width: v.width, url: publicUrl(v.file), path: v.file });
    }
    await prisma.photo.create({
      data: {
        id: p.id,
        section,
        order: p.order,
        alt: p.alt,
        width: p.width,
        height: p.height,
        blurDataUrl: p.blurDataUrl,
        variants,
        createdAt: new Date(p.createdAt),
      },
    });
    migrated++;
    console.log(`✅ ${section} #${p.order} ${p.id}`);
  }
}

console.log(`\nListo: ${migrated} fotos subidas, ${skipped} ya estaban.`);
await prisma.$disconnect();
