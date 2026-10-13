import { useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import type { RefObject } from 'react';

type Offset = NonNullable<Parameters<typeof useScroll>[0]>['offset'];

/**
 * Desplazamiento vertical (px) ligado al scroll de `target`.
 * `distance` positivo = la capa se mueve más lento que el scroll (fondo),
 * negativo = más rápido (primer plano). Con prefers-reduced-motion devuelve 0.
 */
export function useParallax(
  target: RefObject<HTMLElement>,
  distance: number,
  offset: Offset = ['start end', 'end start'],
): MotionValue<number> {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset });
  return useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-distance, distance]);
}
