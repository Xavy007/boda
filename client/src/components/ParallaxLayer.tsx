import { motion, type MotionValue } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

interface Props {
  y: MotionValue<number>;
  scale?: MotionValue<number> | number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  'aria-hidden'?: boolean;
}

/**
 * Capa de parallax acelerada por GPU: siempre translate3d + will-change.
 * (Nunca background-attachment: fixed, que falla en iOS Safari.)
 */
export function ParallaxLayer({ y, scale = 1, className, style, children, ...rest }: Props) {
  return (
    <motion.div
      className={className}
      style={{ ...style, y, scale, willChange: 'transform' }}
      transformTemplate={({ y: ty, scale: s }) => {
        const tyPx = typeof ty === 'number' ? `${ty}px` : (ty ?? '0px');
        return `translate3d(0, ${tyPx}, 0) scale(${s ?? 1})`;
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
