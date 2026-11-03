import { useRef } from 'react';
import { Divider, FloralBranch } from '@/components/Ornaments';
import { ParallaxLayer } from '@/components/ParallaxLayer';
import { Reveal } from '@/components/Reveal';
import { useParallax } from '@/hooks/useParallax';
import { longDate } from '@/lib/format';
import type { PublicEvent } from '@/lib/types';

/** 2 · Saludo personalizado (en singular si la invitación es para una sola persona) */
export function Greeting({ familyName, solo, companions, event }: { familyName: string; solo: boolean; companions: number; event: PublicEvent }) {
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
            {solo ? <span className="text-gold">{familyName}</span> : <>Querida familia <span className="text-gold">{familyName}</span></>}
          </h2>
          {companions > 0 && (
            <p className="mt-2 font-serif text-xl italic text-ink/60">{companions === 1 ? 'y acompañante' : 'y acompañantes'}</p>
          )}
        </Reveal>
        <Reveal delay={0.3}>
          <Divider className="my-7" />
        </Reveal>
        <Reveal delay={0.4}>
          <p className="font-serif text-[1.3rem] leading-relaxed text-ink/80 text-balance">
            {companions > 0
              ? `Con inmensa alegría queremos compartir contigo el día en que uniremos nuestras vidas. Tu presencia y la de ${companions === 1 ? 'tu acompañante' : 'tus acompañantes'} harán de este momento algo aún más especial.`
              : solo
              ? 'Con inmensa alegría queremos compartir contigo el día en que uniremos nuestras vidas. Tu presencia hará de este momento algo aún más especial.'
              : 'Con inmensa alegría queremos compartir con ustedes el día en que uniremos nuestras vidas. Su presencia hará de este momento algo aún más especial.'}
          </p>
        </Reveal>
        {(event.partnerOneParents || event.partnerTwoParents) && (
          <Reveal delay={0.5}>
            <p className="eyebrow mt-10">Con la bendición de nuestros padres</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {[
                { name: event.partnerOneName, parents: event.partnerOneParents },
                { name: event.partnerTwoName, parents: event.partnerTwoParents },
              ]
                .filter((p) => p.parents)
                .map((p) => (
                  <div key={p.name} className={event.partnerOneParents && event.partnerTwoParents ? '' : 'sm:col-span-2'}>
                    <p className="font-serif text-lg leading-snug text-ink/80 text-balance">{p.parents}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink/45">Padres de {p.name}</p>
                  </div>
                ))}
            </div>
          </Reveal>
        )}
        <Reveal delay={0.55}>
          <p className="mt-8 font-serif text-lg capitalize italic text-ink/60">
            {longDate(event.eventDate, event.timezone)}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
