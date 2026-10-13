import { motion } from 'framer-motion';
import type { AccessErrorKind } from '@/lib/types';
import { IconWhatsapp } from './Icons';
import { Divider, FloralBranch } from './Ornaments';

const COPY: Record<AccessErrorKind, { title: string; text: string }> = {
  INVALID: {
    title: 'Invitación no válida',
    text: 'El enlace que abriste no corresponde a ninguna invitación. Revisa que esté completo o pide uno nuevo a quien te lo envió.',
  },
  DEVICE_LIMIT: {
    title: 'Esta invitación es personal',
    text: 'Esta invitación es personal y ya fue abierta en otro dispositivo. Si eres el invitado, escribe a los novios.',
  },
  EXPIRED: {
    title: 'Esta invitación ha finalizado',
    text: 'La celebración ya pasó. ¡Gracias de corazón por acompañarnos!',
  },
  RATE_LIMITED: {
    title: 'Demasiados intentos',
    text: 'Por seguridad pausamos el acceso unos minutos. Vuelve a intentarlo más tarde.',
  },
  NETWORK: {
    title: 'Sin conexión',
    text: 'No pudimos cargar tu invitación. Revisa tu conexión a internet e inténtalo de nuevo.',
  },
};

export function StatusScreen({ kind, contactUrl }: { kind: AccessErrorKind; contactUrl?: string | null }) {
  const copy = COPY[kind];
  return (
    <main className="paper-texture relative grid min-h-dscreen place-items-center overflow-hidden bg-ivory px-6 py-16">
      <FloralBranch className="pointer-events-none absolute -left-10 -top-6 w-48 rotate-180 opacity-70" />
      <FloralBranch className="pointer-events-none absolute -bottom-6 -right-10 w-48 opacity-70" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="card relative w-full max-w-sm px-7 py-10 text-center"
      >
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border border-gold/50 font-script text-3xl text-gold">
          {kind === 'EXPIRED' ? '♡' : '✉'}
        </div>
        <h1 className="font-serif text-3xl leading-tight text-ink text-balance">{copy.title}</h1>
        <Divider className="my-5" />
        <p className="text-[15px] leading-relaxed text-ink/70 text-balance">{copy.text}</p>
        {kind === 'DEVICE_LIMIT' && contactUrl && (
          <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8 w-full">
            <IconWhatsapp className="h-5 w-5" />
            Escribir a los novios
          </a>
        )}
        {kind === 'NETWORK' && (
          <button type="button" onClick={() => window.location.reload()} className="btn-outline mt-8 w-full">
            Reintentar
          </button>
        )}
      </motion.div>
    </main>
  );
}
