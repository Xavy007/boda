import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { Lightbox } from '@/components/Lightbox';
import { SectionHeading } from '@/components/Ornaments';
import { ParallaxLayer } from '@/components/ParallaxLayer';
import { SmartImage } from '@/components/SmartImage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Photo } from '@/lib/types';

/** 5 · Galería masonry: cada columna se desplaza a distinta velocidad + lightbox con swipe */
export function Gallery({ photos }: { photos: Photo[] }) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const desktop = useMediaQuery('(min-width: 768px)');
  const columnCount = desktop ? 3 : 2;

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const speeds = [
    useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40]),
    useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-30, 90]),
    useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [70, -70]),
  ];

  // Reparte en columnas manteniendo el índice global (para el lightbox)
  const columns = useMemo(() => {
    const cols: { photo: Photo; index: number }[][] = Array.from({ length: columnCount }, () => []);
    photos.forEach((photo, index) => cols[index % columnCount].push({ photo, index }));
    return cols;
  }, [photos, columnCount]);

  if (!photos.length) return null;

  return (
    <section ref={ref} className="overflow-hidden bg-paper/60 px-3 py-24 sm:px-6 sm:py-32" aria-label="Galería">
      <SectionHeading eyebrow="Momentos" title="Nuestra galería" className="px-3" />
      <div className="mx-auto mt-14 flex max-w-5xl items-start gap-3 sm:gap-4">
        {columns.map((col, c) => (
          <ParallaxLayer key={c} y={speeds[c]} className={`flex flex-1 flex-col gap-3 sm:gap-4 ${c === 1 ? 'pt-12' : ''}`}>
            {col.map(({ photo, index }) => (
              <motion.button
                key={photo.id}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Ver foto: ${photo.alt || `foto ${index + 1}`}`}
                className="group block overflow-hidden rounded-2xl shadow-card"
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileTap={{ scale: 0.97 }}
              >
                <SmartImage
                  photo={photo}
                  sizes="(min-width: 768px) 33vw, 50vw"
                  imgClassName="transition-transform duration-700 group-hover:scale-105"
                />
              </motion.button>
            ))}
          </ParallaxLayer>
        ))}
      </div>
      <Lightbox photos={photos} index={active} onChange={setActive} />
    </section>
  );
}
