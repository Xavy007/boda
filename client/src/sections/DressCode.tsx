import { SectionHeading } from '@/components/Ornaments';
import { Reveal } from '@/components/Reveal';
import type { PublicEvent } from '@/lib/types';

/** 9 · Dress code */
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
    </section>
  );
}
