import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';
import { useLockBodyScroll } from '@/hooks/useMediaQuery';
import type { Photo } from '@/lib/types';
import { IconChevron, IconClose } from './Icons';

interface Props {
  photos: Photo[];
  index: number | null;
  onChange: (index: number | null) => void;
}

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 400;

export function Lightbox({ photos, index, onChange }: Props) {
  const open = index !== null;
  const direction = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  useLockBodyScroll(open);

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      direction.current = delta;
      onChange((index + delta + photos.length) % photos.length);
    },
    [index, onChange, photos.length],
  );

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChange(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go, onChange]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) go(1);
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) go(-1);
    else if (info.offset.y > 120) onChange(null);
  };

  const photo = index !== null ? photos[index] : null;
  const largest = photo?.variants[photo.variants.length - 1]?.url ?? photo?.publicUrl;

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#16130f]/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Galería de fotos"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onChange(null)}
        >
          <AnimatePresence initial={false} custom={direction.current} mode="popLayout">
            <motion.img
              key={photo.id}
              src={largest}
              alt={photo.alt}
              custom={direction.current}
              className="max-h-[82dvh] max-w-[94vw] touch-pan-y select-none rounded-sm object-contain shadow-2xl"
              variants={{
                enter: (d: number) => ({ x: d >= 0 ? 120 : -120, opacity: 0, scale: 0.96 }),
                center: { x: 0, opacity: 1, scale: 1 },
                exit: (d: number) => ({ x: d >= 0 ? -120 : 120, opacity: 0, scale: 0.96 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              drag
              dragSnapToOrigin
              dragElastic={0.6}
              onDragEnd={onDragEnd}
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          </AnimatePresence>

          <button
            ref={closeRef}
            type="button"
            onClick={() => onChange(null)}
            aria-label="Cerrar"
            className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white"
          >
            <IconClose />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => (e.stopPropagation(), go(-1))}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white sm:grid"
              >
                <IconChevron dir="left" />
              </button>
              <button
                type="button"
                onClick={(e) => (e.stopPropagation(), go(1))}
                aria-label="Foto siguiente"
                className="absolute right-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white sm:grid"
              >
                <IconChevron />
              </button>
            </>
          )}

          <p className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-0 right-0 text-center text-xs tracking-[0.25em] text-white/70">
            {index! + 1} / {photos.length}
            <span className="ml-3 sm:hidden">· desliza ↔</span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
