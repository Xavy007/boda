import { useRef } from 'react';
import { Divider, FloralBranch } from '@/components/Ornaments';
import { ParallaxLayer } from '@/components/ParallaxLayer';
import { Reveal } from '@/components/Reveal';
import { useParallax } from '@/hooks/useParallax';
import { longDate } from '@/lib/format';
import type { PublicEvent } from '@/lib/types';

/** 2 · Saludo personalizado */
export function Greeting({ familyName, event }: { familyName: string; event: PublicEvent }) {
  const ref = useRef<HTMLElement>(null);
  const floralY = useParallax(ref, 60);

  return (
    <section id="saludo" ref={ref} className="paper-texture relative overflow-hidden px-6 py-24 text-center sm:py-32">
      <ParallaxLayer y={floralY} className="pointer-events-none absolute -right-14 top-6 w-40 opacity-50" aria-hidden>
        <FloralBranch flip className="w-full rotate-180" />
      </ParallaxLayer>

      <div className="mx-auto max-w-md">
        <Reveal>
          <p className="eyebrow">Con todo nuestro cariño</p>
        </Reveal>
        <Reveal delay={0.15}>
          <h2 className="mt-5 font-script text-[2.9rem] leading-tight text-ink sm:text-6xl">
            Querida familia <span className="text-gold">{familyName}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.3}>
          <Divider className="my-7" />
        </Reveal>
        <Reveal delay={0.4}>
          <p className="font-serif text-[1.3rem] leading-relaxed text-ink/80 text-balance">
            Con inmensa alegría queremos compartir con ustedes el día en que uniremos nuestras vidas. Su presencia hará
            de este momento algo aún más especial.
          </p>
        </Reveal>
        <Reveal delay={0.55}>
          <p className="mt-8 font-serif text-lg capitalize italic text-ink/60">
            {longDate(event.eventDate, event.timezone)}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
