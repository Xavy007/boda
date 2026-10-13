import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/Ornaments';
import { Reveal } from '@/components/Reveal';
import type { PublicEvent } from '@/lib/types';

/** 9 · Dress code con paleta sugerida */
export function DressCode({ event }: { event: PublicEvent }) {
  return (
    <section className="px-6 py-24 text-center sm:py-32" aria-label="Dress code">
      <SectionHeading eyebrow="Código de vestimenta" title="Dress code" />
      <Reveal delay={0.1}>
        <p className="mt-10 font-script text-5xl text-gold">{event.dressCode}</p>
      </Reveal>
      {event.dressCodeNote && (
        <Reveal delay={0.2}>
          <p className="mx-auto mt-5 max-w-sm text-[15px] leading-relaxed text-ink/70 text-balance">{event.dressCodeNote}</p>
        </Reveal>
      )}
      {event.dressCodeColors.length > 0 && (
        <>
          <Reveal delay={0.3}>
            <p className="eyebrow mt-12">Paleta sugerida</p>
          </Reveal>
          <ul className="mx-auto mt-6 flex max-w-sm flex-wrap justify-center gap-4" aria-label="Colores sugeridos">
            {event.dressCodeColors.map((color, i) => (
              <motion.li
                key={color + i}
                className="h-14 w-14 rounded-full shadow-card ring-4 ring-white"
                style={{ background: color }}
                title={color}
                initial={{ scale: 0, rotate: -40 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 220, damping: 15, delay: 0.3 + i * 0.08 }}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
