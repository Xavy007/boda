import 'dotenv/config';
import { z } from 'zod';

// Una variable vacía (VAR="") se trata como no definida
const optionalString = z.string().optional().transform((v) => v || undefined);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET debe tener al menos 32 caracteres'),
  CLIENT_URL: z.string().url().transform((url) => url.replace(/\/+$/, '')),
  // Fotos en Supabase Storage (Project Settings → API Keys → Secret key)
  SUPABASE_URL: z
    .string()
    .url()
    .transform((url) => url.replace(/\/+$/, ''))
    .optional(),
  SUPABASE_SECRET_KEY: optionalString,
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
