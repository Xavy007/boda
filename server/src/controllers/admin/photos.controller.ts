import type { Request, Response } from 'express';
import { z } from 'zod';
import { deletePhoto, listUploadedPhotos, reorderPhotos, SECTIONS, updatePhoto, uploadPhoto } from '../../services/photo.service.js';
import { HttpError } from '../../utils/http.js';

const sectionSchema = z.enum(SECTIONS);
const updateSchema = z.object({ alt: z.string().trim().max(200).optional(), section: sectionSchema.optional() });
const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), section: sectionSchema, order: z.number().int().min(0) })).max(1000),
});

export async function listPhotos(_req: Request, res: Response) {
  res.json(await listUploadedPhotos());
}

export async function uploadPhotos(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw new HttpError(400, 'NO_FILES', 'Adjunta al menos una imagen');
  const section = sectionSchema.parse(req.body.section);

  const created = [];
  const failed: { name: string; message: string }[] = [];
  // Una por una: sharp usa mucha memoria y los servidores pequeños tienen poca RAM
  for (const file of files) {
    try {
      created.push(await uploadPhoto(file.buffer, section, file.originalname));
    } catch (err) {
      failed.push({ name: file.originalname, message: err instanceof Error ? err.message : 'Error' });
    }
  }
  res.status(created.length ? 201 : 400).json({ created: created.length, failed });
}

export async function editPhoto(req: Request, res: Response) {
  res.json(await updatePhoto(String(req.params.id), updateSchema.parse(req.body)));
}

export async function sortPhotos(req: Request, res: Response) {
  await reorderPhotos(reorderSchema.parse(req.body).items);
  res.json(await listUploadedPhotos());
}

export async function removePhoto(req: Request, res: Response) {
  await deletePhoto(String(req.params.id));
  res.status(204).end();
}
