import { useRef } from 'react';
import { ParallaxLayer } from '@/components/ParallaxLayer';
import { Reveal } from '@/components/Reveal';
import { SmartImage } from '@/components/SmartImage';
import { useParallax } from '@/hooks/useParallax';
import type { Photo } from '@/lib/types';

/** 6 · Frase destacada sobre foto a pantalla completa con parallax */
export function Quote({ phrase, author, photo }: { phrase: string | null; author: string | null; photo?: Photo }) {
  const ref = useRef<HTMLElement>(null);
  const bgY = useParallax(ref, 110);
  if (!phrase) return null;

  return (
    <section ref={ref} className="relative grid min-h-screen place-items-center overflow-hidden bg-[#2b2621] px-8 py-24" aria-label="Frase">
      {/* La capa sobresale arriba y abajo para que el desplazamiento nunca deje bordes vacíos */}
      <ParallaxLayer y={bgY} className="absolute inset-x-0 -bottom-[18%] -top-[18%]">
        {photo ? (
          <SmartImage photo={photo} fill sizes="100vw" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-sage to-gold" />
        )}
      </ParallaxLayer>
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/60" aria-hidden />

      <figure className="relative z-10 mx-auto max-w-xl text-center text-white">
        <Reveal from="scale">
          <span className="block font-serif text-8xl leading-none text-gold/90" aria-hidden>
            “
          </span>
        </Reveal>
        <Reveal delay={0.2}>
          <blockquote className="-mt-6 font-serif text-[1.85rem] italic leading-snug text-balance sm:text-4xl">
            {phrase}
          </blockquote>
        </Reveal>
        {author && (
          <Reveal delay={0.45}>
            <figcaption className="eyebrow mt-8 text-white/80">— {author}</figcaption>
          </Reveal>
        )}
      </figure>
    </section>
  );
}
