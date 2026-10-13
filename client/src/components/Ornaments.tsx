/** Ornamentos botánicos en SVG (sin imágenes externas). */

const LEAF = 'M0 0 C 5 -7, 16 -8, 24 0 C 16 8, 5 7, 0 0 Z';

const LEAVES: [number, number, number, number][] = [
  // x, y, rotación, escala
  [28, 172, -70, 1],
  [40, 168, 20, 0.9],
  [52, 150, -80, 1.1],
  [66, 146, 10, 1],
  [76, 124, -75, 1.15],
  [92, 120, 5, 1],
  [100, 98, -65, 1.1],
  [116, 92, 0, 0.95],
  [124, 70, -60, 1],
  [140, 64, -5, 0.9],
  [150, 46, -50, 0.85],
  [166, 38, -10, 0.8],
];

export function FloralBranch({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      fill="none"
    >
      <path
        d="M10 195 C 50 160, 80 130, 110 95 S 165 30, 192 8"
        stroke="rgb(var(--c-sage))"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {LEAVES.map(([x, y, r, s], i) => (
        <path
          key={i}
          d={LEAF}
          transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
          fill={i % 3 === 0 ? 'rgb(var(--c-sage) / 0.55)' : 'rgb(var(--c-sage) / 0.85)'}
        />
      ))}
      {[
        [60, 132],
        [108, 84],
        [158, 30],
      ].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx} ${cy})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-5" rx="3" ry="5" transform={`rotate(${a})`} fill="rgb(var(--c-gold) / 0.75)" />
          ))}
          <circle r="2.2" fill="#fff" />
        </g>
      ))}
      {[
        [84, 140],
        [132, 108],
        [176, 52],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.6" fill="rgb(var(--c-gold))" />
      ))}
    </svg>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-gold ${className}`} aria-hidden>
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/70" />
      <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
        <path d="M11 1 C 14 5, 14 9, 11 13 C 8 9, 8 5, 11 1 Z" fill="currentColor" opacity="0.85" />
        <path d="M1 7 C 5 4, 8 5, 10 7 C 8 9, 5 10, 1 7 Z" fill="rgb(var(--c-sage))" />
        <path d="M21 7 C 17 4, 14 5, 12 7 C 14 9, 17 10, 21 7 Z" fill="rgb(var(--c-sage))" />
      </svg>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/70" />
    </div>
  );
}

export function SectionHeading({ eyebrow, title, className = '', light = false }: { eyebrow?: string; title: string; className?: string; light?: boolean }) {
  return (
    <div className={`text-center ${className}`}>
      {eyebrow && <p className={`eyebrow mb-3 ${light ? 'text-white/80' : ''}`}>{eyebrow}</p>}
      <h2 className={`section-title text-balance ${light ? 'text-white' : ''}`}>{title}</h2>
      <Divider className="mt-5" />
    </div>
  );
}
