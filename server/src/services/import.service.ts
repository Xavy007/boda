import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http.js';
import { getSettings } from './event.service.js';
import { generateToken } from './token.service.js';

type RawRow = Record<string, unknown>;

const rowSchema = z.object({
  nombre_familia: z.string().trim().min(1, 'nombre_familia es obligatorio').max(120),
  telefono: z.string().trim().max(30).optional(),
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, 'email inválido'),
  cupos: z.coerce.number().int().min(1, 'cupos debe ser ≥ 1').max(30).optional(),
});

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function normalizeRow(row: RawRow): RawRow {
  const out: RawRow = {};
  for (const [k, v] of Object.entries(row)) {
    const value = v == null ? undefined : String(typeof v === 'object' && 'text' in v ? (v as { text: string }).text : v).trim();
    out[normalizeKey(k)] = value === '' ? undefined : value;
  }
  return out;
}

async function readRows(buffer: Buffer, filename: string): Promise<RawRow[]> {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.csv') || lower.endsWith('.txt')) {
    const text = buffer.toString('utf8');
    const delimiter = text.split('\n')[0].includes(';') ? ';' : ',';
    return parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true, delimiter });
  }
  if (lower.endsWith('.xlsx')) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = wb.worksheets[0];
    if (!sheet) return [];
    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell, col) => (headers[col] = String(cell.text)));
    const rows: RawRow[] = [];
    sheet.eachRow((row, idx) => {
      if (idx === 1) return;
      const obj: RawRow = {};
      row.eachCell((cell, col) => {
        if (headers[col]) obj[headers[col]] = cell.text;
      });
      if (Object.keys(obj).length) rows.push(obj);
    });
    return rows;
  }
  throw new HttpError(400, 'UNSUPPORTED_FILE', 'Formato no soportado. Usa .csv o .xlsx');
}

export async function importInvitations(buffer: Buffer, filename: string) {
  const rows = (await readRows(buffer, filename)).map(normalizeRow);
  if (!rows.length) throw new HttpError(400, 'EMPTY_FILE', 'El archivo no contiene filas');
  if (rows.length > 1000) throw new HttpError(400, 'TOO_MANY_ROWS', 'Máximo 1000 filas por importación');

  const { defaultMaxGuests } = await getSettings();
  const errors: { row: number; message: string }[] = [];
  const data: {
    token: string;
    familyName: string;
    contactPhone?: string;
    contactEmail?: string;
    maxGuests: number;
  }[] = [];

  rows.forEach((raw, i) => {
    const parsed = rowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({ row: i + 2, message: parsed.error.issues.map((e) => e.message).join(', ') });
      return;
    }
    data.push({
      token: generateToken(),
      familyName: parsed.data.nombre_familia,
      contactPhone: parsed.data.telefono,
      contactEmail: parsed.data.email,
      maxGuests: parsed.data.cupos ?? defaultMaxGuests,
    });
  });

  const result = data.length ? await prisma.invitation.createMany({ data }) : { count: 0 };
  return { created: result.count, errors };
}
