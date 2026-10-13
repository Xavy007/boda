import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = ['rgb(var(--c-gold))', 'rgb(var(--c-sage))', '#E8D9C0', '#ffffff', '#D7B98E'];

/** Confeti suave de pétalos + anillos entrelazados que se dibujan. */
export function Celebration() {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.4 + Math.random() * 1.8,
        drift: (Math.random() - 0.5) * 120,
        rotate: Math.random() * 540 - 270,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        petal: i % 3 !== 0,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {!reduce &&
        pieces.map((p) => (
          <motion.span
            key={p.id}
            className="absolute -top-4 block"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.petal ? p.size * 1.4 : p.size,
              background: p.color,
              borderRadius: p.petal ? '80% 0 80% 0' : '50%',
              boxShadow: '0 1px 2px rgb(0 0 0 / 0.08)',
            }}
            initial={{ y: -20, x: 0, opacity: 0, rotate: 0 }}
            animate={{ y: 520, x: p.drift, opacity: [0, 1, 1, 0], rotate: p.rotate }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          />
        ))}
    </div>
  );
}

export function RingsMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} fill="none" aria-hidden>
      {[
        { cx: 46, color: 'rgb(var(--c-gold))', delay: 0 },
        { cx: 74, color: 'rgb(var(--c-sage))', delay: 0.35 },
      ].map((r) => (
        <motion.circle
          key={r.cx}
          cx={r.cx}
          cy="44"
          r="24"
          stroke={r.color}
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: r.delay, ease: [0.65, 0, 0.35, 1] }}
        />
      ))}
      <motion.path
        d="M46 16 l4 -6 h8 l4 6 l-8 6 z"
        fill="rgb(var(--c-gold))"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ originX: '54px', originY: '16px' }}
        transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 14 }}
      />
    </svg>
  );
}
