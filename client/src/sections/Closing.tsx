import { useRef } from 'react';
import { FloralBranch } from '@/components/Ornaments';
import { ParallaxLayer } from '@/components/ParallaxLayer';
import { Reveal } from '@/components/Reveal';
import { SmartImage } from '@/components/SmartImage';
import { useParallax } from '@/hooks/useParallax';
import { shortDate } from '@/lib/format';
import type { Photo, PublicEvent } from '@/lib/types';

/** 12 · Cierre con foto final a pantalla completa */
export function Closing({ event, photo }: { event: PublicEvent; photo?: Photo }) {
  const ref = useRef<HTMLElement>(null);
  const bgY = useParallax(ref, 120);
  const floralY = useParallax(ref, -90);

  return (
    <>
      <section ref={ref} className="relative grid min-h-screen place-items-end overflow-hidden bg-[#2b2621]" aria-label="Cierre">
        <ParallaxLayer y={bgY} className="absolute inset-x-0 -bottom-[18%] -top-[18%]">
          {photo ? <SmartImage photo={photo} fill sizes="100vw" /> : <div className="h-full w-full bg-gradient-to-br from-sage to-gold" />}
        </ParallaxLayer>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/75" aria-hidden />
        <ParallaxLayer y={floralY} className="pointer-events-none absolute -right-12 bottom-24 z-10 w-48 opacity-80" aria-hidden>
          <FloralBranch flip className="w-full" />
        </ParallaxLayer>

        <div className="relative z-10 w-full px-8 pb-[14svh] text-center text-white">
          {event.closingPhrase && (
            <Reveal>
              <p className="mx-auto max-w-sm font-serif text-2xl italic leading-snug text-balance">{event.closingPhrase}</p>
            </Reveal>
          )}
          <Reveal delay={0.25}>
            <p className="mt-8 font-script text-6xl leading-none sm:text-7xl">
              {event.partnerOneName} <span className="text-gold">&</span> {event.partnerTwoName}
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <p className="mt-5 font-serif tracking-[0.3em] text-white/85">{shortDate(event.eventDate, event.timezone)}</p>
          </Reveal>
        </div>
      </section>
      <footer className="bg-ivory px-6 pb-24 pt-10 text-center text-xs tracking-[0.2em] text-ink/40">
        HECHO CON <span className="text-gold">♡</span> PARA NUESTRA FAMILIA Y AMIGOS
      </footer>
    </>
  );
}
