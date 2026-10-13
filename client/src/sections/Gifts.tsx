import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { IconCheck, IconCopy, IconGift } from '@/components/Icons';
import { SectionHeading } from '@/components/Ornaments';
import { Reveal } from '@/components/Reveal';
import { copyText } from '@/lib/format';
import type { GiftInfo } from '@/lib/types';

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (await copyText(value)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink/[0.06] py-3 last:border-0">
      <div className="min-w-0 text-left">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink/50">{label}</p>
        <p className="truncate font-medium text-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copiar ${label}`}
        className="relative grid h-11 min-w-[44px] shrink-0 place-items-center rounded-full border border-gold/40 px-3 text-gold transition hover:bg-gold/10"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1 text-xs font-medium">
              <IconCheck className="h-4 w-4" /> Copiado
            </motion.span>
          ) : (
            <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1 text-xs font-medium">
              <IconCopy className="h-4 w-4" /> Copiar
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

/** 10 · Mesa de regalos / transferencia (solo llega a dispositivos autorizados) */
export function Gifts({ gift }: { gift: GiftInfo }) {
  const rows = [
    ['Banco', gift.bankName],
    ['Titular', gift.accountHolder],
    ['Nº de cuenta', gift.accountNumber],
    ['Tipo de cuenta', gift.accountType],
    ['Documento', gift.documentId],
    ['Alias', gift.alias],
  ].filter((r): r is [string, string] => Boolean(r[1]));

  if (!rows.length && !gift.registryUrl && !gift.message) return null;

  return (
    <section className="bg-paper/60 px-5 py-24 sm:py-32" aria-label="Mesa de regalos">
      <SectionHeading eyebrow="Con cariño" title="Mesa de regalos" />
      <Reveal delay={0.1} className="card mx-auto mt-12 max-w-md p-6 text-center sm:p-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold/15 text-gold">
          <IconGift className="h-7 w-7" />
        </span>
        {gift.message && <p className="mt-5 font-serif text-xl leading-relaxed text-ink/80 text-balance">{gift.message}</p>}
        {gift.registryUrl && (
          <a href={gift.registryUrl} target="_blank" rel="noopener noreferrer" className="btn-gold mt-6 w-full">
            Ver {gift.registryName || 'mesa de regalos'}
          </a>
        )}
        {rows.length > 0 && (
          <div className="mt-6 rounded-2xl bg-ivory px-4">
            {rows.map(([label, value]) => (
              <CopyRow key={label} label={label} value={value} />
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}
