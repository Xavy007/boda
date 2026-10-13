import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
});

export const IconRings = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="14" r="5.5" /><circle cx="15" cy="14" r="5.5" /><path d="M10 5.5 12 3l2 2.5-2 1.5z" /></svg>
);
export const IconChurch = (p: P) => (
  <svg {...base(p)}><path d="M12 2v4M10 4h4M6 21V11l6-5 6 5v10M3 21h18M10 21v-4a2 2 0 0 1 4 0v4" /></svg>
);
export const IconCheers = (p: P) => (
  <svg {...base(p)}><path d="M8 3h4l-.5 6a2.5 2.5 0 0 1-5 0zM16 3h-4M14 3h4l.5 6a2.5 2.5 0 0 1-5 0M9 11.5V20M16 11.5V20M6.5 20h5M13.5 20h5" /></svg>
);
export const IconDinner = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="13" r="6" /><circle cx="12" cy="13" r="3" /><path d="M3 4v5a1.5 1.5 0 0 0 3 0V4M4.5 9v11M21 4c-2 1-2.5 3-2.5 6h2.5v10" /></svg>
);
export const IconMusic = (p: P) => (
  <svg {...base(p)}><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>
);
export const IconCake = (p: P) => (
  <svg {...base(p)}><path d="M4 21h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2zM4 16c1.5 1 3 1 4 0s2.5-1 4 0 3 1 4 0 2.5-1 4 0M12 12V8M12 5.5a1 1 0 0 1-1-1C11 3.5 12 2 12 2s1 1.5 1 2.5a1 1 0 0 1-1 1" /></svg>
);
export const IconCamera = (p: P) => (
  <svg {...base(p)}><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="4" /></svg>
);
export const IconCar = (p: P) => (
  <svg {...base(p)}><path d="M5 17h14M5 17v2M19 17v2M3 13l2-5.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13v4H3z" /><circle cx="7.5" cy="13.5" r="1" /><circle cx="16.5" cy="13.5" r="1" /></svg>
);
export const IconMoon = (p: P) => (
  <svg {...base(p)}><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" /></svg>
);
export const IconHeart = (p: P) => (
  <svg {...base(p)}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>
);
export const IconPin = (p: P) => (
  <svg {...base(p)}><path d="M12 21s-7-6-7-11.5a7 7 0 0 1 14 0C19 15 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconCopy = (p: P) => (
  <svg {...base(p)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const IconGift = (p: P) => (
  <svg {...base(p)}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 8 3.5 7 8 12 8zM12 8s1.5-5 4-4.5S17 8 12 8z" /></svg>
);
export const IconCalendar = (p: P) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
);
export const IconClose = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconChevron = (p: P & { dir?: 'left' | 'right' | 'down' }) => {
  const { dir = 'right', ...rest } = p;
  const d = dir === 'left' ? 'm15 5-7 7 7 7' : dir === 'down' ? 'm5 9 7 7 7-7' : 'm9 5 7 7-7 7';
  return <svg {...base(rest)}><path d={d} /></svg>;
};
export const IconWhatsapp = (p: P) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.2-1.36A9.9 9.9 0 1 0 12.04 2zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.08.8.82-3-.2-.31a8.2 8.2 0 1 1 6.94 3.84zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06a6.7 6.7 0 0 1-3.3-2.88c-.25-.43.25-.4.71-1.33.08-.16.04-.3-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.48a.92.92 0 0 0-.66.31 2.8 2.8 0 0 0-.87 2.07 4.85 4.85 0 0 0 1.02 2.57 11.1 11.1 0 0 0 4.25 3.75c1.58.68 2.2.74 2.99.62.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.29z" />
  </svg>
);

export const ITINERARY_ICONS: Record<string, (p: P) => JSX.Element> = {
  rings: IconRings,
  church: IconChurch,
  cheers: IconCheers,
  dinner: IconDinner,
  music: IconMusic,
  cake: IconCake,
  camera: IconCamera,
  car: IconCar,
  moon: IconMoon,
  heart: IconHeart,
};
