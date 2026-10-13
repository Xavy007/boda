import type { Palette } from './types';

export function formatDate(iso: string, tz: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-BO', { timeZone: tz, ...opts }).format(new Date(iso));
}

export const longDate = (iso: string, tz: string) =>
  formatDate(iso, tz, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const shortDate = (iso: string, tz: string) => {
  const parts = new Intl.DateTimeFormat('es-BO', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('day')} · ${get('month')} · ${get('year')}`;
};

export const timeOf = (iso: string, tz: string) =>
  formatDate(iso, tz, { hour: '2-digit', minute: '2-digit', hour12: false });

export function hexToRgbChannels(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function applyPalette(palette: Partial<Palette>) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(palette)) {
    const rgb = value ? hexToRgbChannels(value) : null;
    if (rgb) root.style.setProperty(`--c-${key}`, rgb);
  }
  if (palette.ivory) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.ivory);
}

export function initials(a: string, b: string) {
  return `${a.trim()[0] ?? ''}${b.trim()[0] ?? ''}`.toUpperCase();
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
