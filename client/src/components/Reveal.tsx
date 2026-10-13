import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

type From = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';

const offsets: Record<From, { x?: number; y?: number; scale?: number }> = {
  up: { y: 36 },
  down: { y: -36 },
  left: { x: -60 },
  right: { x: 60 },
  scale: { scale: 0.88 },
  fade: {},
};

interface Props {
  children: ReactNode;
  from?: From;
  delay?: number;
  duration?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'span' | 'p' | 'h2';
  amount?: number;
}

/** Aparición al hacer scroll (fade + slide/scale), una sola vez. */
export function Reveal({ children, from = 'up', delay = 0, duration = 0.9, className, as = 'div', amount = 0.25 }: Props) {
  const Tag = motion[as];
  const variants: Variants = {
    hidden: { opacity: 0, ...offsets[from] },
    show: { opacity: 1, x: 0, y: 0, scale: 1, transition: { duration, delay, ease: [0.22, 1, 0.36, 1] } },
  };
  return (
    <Tag className={className} variants={variants} initial="hidden" whileInView="show" viewport={{ once: true, amount }}>
      {children}
    </Tag>
  );
}

/** Contenedor que escalona la aparición de sus hijos <StaggerItem>. */
export function Stagger({ children, className, stagger = 0.12, as = 'div' }: { children: ReactNode; className?: string; stagger?: number; as?: 'div' | 'ul' | 'ol' }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Tag>
  );
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

export function StaggerItem({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' }) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={staggerItem}>
      {children}
    </Tag>
  );
}
