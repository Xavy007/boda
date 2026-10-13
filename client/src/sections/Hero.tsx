import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { IconChevron } from '@/components/Icons';
import { FloralBranch } from '@/components/Ornaments';
import { ParallaxLayer } from '@/components/ParallaxLayer';
import { SmartImage } from '@/components/SmartImage';
import { shortDate } from '@/lib/format';
import type { Photo, PublicEvent } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as const;

/** 1 · Hero a pantalla completa con parallax de varias capas. */
export function Hero({ event, photo, revealed }: { event: PublicEvent; photo?: Photo; revealed: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const r = (b: number[]) => (reduce ? [b[0], b[0]] : b);

  // Capas a distinta velocidad: fondo lento, texto medio, flores al frente rápidas
  const bgY = useTransform(scrollYProgress, [0, 1], r([0, 240]));
  const bgScale = useTransform(scrollYProgress, [0, 1], r([1.08, 1.2]));
  const textY = useTransform(scrollYProgress, [0, 1], r([0, 140]));
  const textOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const floralFrontY = useTransform(scrollYProgress, [0, 1], r([0, -320]));
  const floralBackY = useTransform(scrollYProgress, [0, 1], r([0, -140]));

  return (
    <section ref={ref} className="relative h-screen min-h-[560px] overflow-hidden bg-[#2b2621]" aria-label="Portada">
      <ParallaxLayer y={bgY} scale={bgScale} className="absolute inset-0">
        {photo ? (
          <SmartImage photo={photo} fill priority sizes="100vw" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-sage/60 via-gold/40 to-ivory" />
        )}
      </ParallaxLayer>

      {/* Overlay degradado para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/65" aria-hidden />

      {/* Flores (fondo): velocidad media */}
      <ParallaxLayer y={floralBackY} className="pointer-events-none absolute -right-16 top-10 w-52 opacity-60 sm:w-72" aria-hidden>
        <FloralBranch flip className="w-full rotate-[200deg] brightness-[1.6]" />
      </ParallaxLayer>

      {/* Texto */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-[18svh] text-center text-white"
      >
        <motion.p
          className="eyebrow text-white/85"
          initial={{ opacity: 0, y: 20 }}
          animate={revealed ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2, ease: EASE }}
        >
          Nos casamos
        </motion.p>
        <motion.h1
          className="mt-4 font-script text-[3.6rem] font-normal leading-[0.95] drop-shadow-[0_2px_12px_rgb(0_0_0/0.35)] sm:text-8xl"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={revealed ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.4, delay: 0.4, ease: EASE }}
        >
          {event.partnerOneName}
          <span className="mx-2 block text-gold sm:inline">&</span>
          {event.partnerTwoName}
        </motion.h1>
        <motion.div
          className="mt-6 flex items-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={revealed ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.9, ease: EASE }}
        >
          <span className="h-px w-10 bg-white/60" />
          <span className="font-serif text-lg tracking-[0.3em]">{shortDate(event.eventDate, event.timezone)}</span>
          <span className="h-px w-10 bg-white/60" />
        </motion.div>
        <motion.p
          className="mt-4 max-w-xs font-serif text-lg italic text-white/85 text-balance"
          initial={{ opacity: 0 }}
          animate={revealed ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 1.2 }}
        >
          {event.mainPhrase}
        </motion.p>
      </motion.div>

      {/* Flores (frente): las más rápidas */}
      <ParallaxLayer y={floralFrontY} className="pointer-events-none absolute -bottom-10 -left-14 z-20 w-56 sm:w-80" aria-hidden>
        <FloralBranch className="w-full drop-shadow-lg" />
      </ParallaxLayer>

      <motion.a
        href="#saludo"
        aria-label="Seguir bajando"
        className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-20 grid h-11 w-11 -translate-x-1/2 place-items-center text-white/80"
        animate={revealed && !reduce ? { y: [0, 8, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <IconChevron dir="down" />
      </motion.a>
    </section>
  );
}
