let cached: Promise<string | null> | null = null;

/**
 * Fingerprint ligero (respaldo si se pierde la cookie): user agent, plataforma,
 * resolución, zona horaria e idioma, hasheados con SHA-256. Toda la validación
 * ocurre en el servidor.
 */
export function getFingerprint(): Promise<string | null> {
  cached ??= compute();
  return cached;
}

async function compute(): Promise<string | null> {
  try {
    if (!crypto?.subtle) return null; // requiere HTTPS o localhost
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    // La resolución se ordena para que rotar el celular no cambie el fingerprint
    const [a, b] = [screen.width, screen.height].sort((x, y) => x - y);
    const raw = [
      navigator.userAgent,
      nav.userAgentData?.platform ?? navigator.platform ?? '',
      `${a}x${b}@${window.devicePixelRatio}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language,
    ].join('|');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
}
