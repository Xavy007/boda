import { motion } from 'framer-motion';
import { useRef } from 'react';
import { SectionHeading } from '@/components/Ornaments';
import { ParallaxLayer } from '@/components/ParallaxLayer';
import { Reveal } from '@/components/Reveal';
import { SmartImage } from '@/components/SmartImage';
import { useParallax } from '@/hooks/useParallax';
import type { Photo, StoryItem } from '@/lib/types';

function TimelineEntry({ item, photo, index }: { item: StoryItem; photo?: Photo; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const imgY = useParallax(ref, 24);
  const fromLeft = index % 2 === 0;

  return (
    <li ref={ref} className="relative pl-12 md:grid md:grid-cols-2 md:gap-14 md:pl-0">
      {/* Punto en la línea */}
      <motion.span
        className="absolute left-[11px] top-2 h-[18px] w-[18px] rounded-full border-2 border-gold bg-ivory md:left-1/2 md:-ml-[9px]"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        aria-hidden
      />

      <Reveal from={fromLeft ? 'left' : 'right'} className={`${fromLeft ? 'md:order-1' : 'md:order-2'}`}>
        {photo && (
          <div className="relative overflow-hidden rounded-[22px] p-1.5 shadow-card ring-1 ring-gold/25">
            <div className="overflow-hidden rounded-[18px]">
              <ParallaxLayer y={imgY} scale={1.12}>
                <SmartImage photo={photo} sizes="(min-width: 768px) 360px, 85vw" className="aspect-[4/5]" />
              </ParallaxLayer>
            </div>
          </div>
        )}
      </Reveal>

      <Reveal
        from={fromLeft ? 'right' : 'left'}
        delay={0.15}
        className={`mt-5 md:mt-0 md:self-center ${fromLeft ? 'md:order-2 md:text-left' : 'md:order-1 md:text-right'}`}
      >
        <p className="eyebrow">{item.date}</p>
        <h3 className="mt-2 font-serif text-[1.9rem] leading-tight text-ink">{item.title}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{item.text}</p>
      </Reveal>
    </li>
  );
}

/** 4 · Nuestra historia: timeline vertical con fotos que entran desde los lados */
export function Story({ items, photos }: { items: StoryItem[]; photos: Photo[] }) {
  if (!items.length) return null;

  return (
    <section className="overflow-hidden px-6 py-24 sm:py-32" aria-label="Nuestra historia">
      <SectionHeading eyebrow="Cómo empezó todo" title="Nuestra historia" />
      <div className="relative mx-auto mt-16 max-w-4xl">
        <motion.span
          className="absolute bottom-0 left-[19px] top-0 w-px origin-top bg-gradient-to-b from-gold/0 via-gold/60 to-gold/0 md:left-1/2"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          aria-hidden
        />
        <ol className="space-y-16 md:space-y-24">
          {items.map((item, i) => (
            <TimelineEntry key={i} item={item} photo={photos[i]} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}
