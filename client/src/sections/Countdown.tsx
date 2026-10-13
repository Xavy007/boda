import { AnimatePresence, motion } from 'framer-motion';
import { SectionHeading } from '@/components/Ornaments';
import { Reveal, Stagger, StaggerItem } from '@/components/Reveal';
import { useCountdown } from '@/hooks/useCountdown';
import type { PublicEvent } from '@/lib/types';

function Unit({ value, label }: { value: number; label: string }) {
  const text = String(value).padStart(2, '0');
  return (
    <StaggerItem className="card flex aspect-[4/5] flex-col items-center justify-center !rounded-2xl px-1">
      <span className="relative h-[2.6rem] overflow-hidden font-serif text-[2.4rem] leading-none text-ink sm:h-14 sm:text-5xl">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            className="block tabular-nums"
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">{label}</span>
    </StaggerItem>
  );
}

/** 3 · Cuenta regresiva animada */
export function Countdown({ event }: { event: PublicEvent }) {
  const c = useCountdown(event.eventDate);

  return (
    <section className="bg-sage/10 px-5 py-20 sm:py-28" aria-label="Cuenta regresiva">
      <div className="mx-auto max-w-lg">
        <SectionHeading eyebrow="Falta muy poco" title={c.done ? '¡Llegó el gran día!' : 'Cuenta regresiva'} />
        {!c.done && (
          <Stagger className="mt-10 grid grid-cols-4 gap-2.5 sm:gap-4" stagger={0.1}>
            <Unit value={c.days} label="Días" />
            <Unit value={c.hours} label="Horas" />
            <Unit value={c.minutes} label="Min" />
            <Unit value={c.seconds} label="Seg" />
          </Stagger>
        )}
        <Reveal delay={0.3}>
          <p className="mt-8 text-center font-serif text-lg italic text-ink/60">
            {c.done ? 'Gracias por estar aquí con nosotros.' : 'para decir “sí, acepto”'}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
