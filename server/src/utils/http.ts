export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message ?? code);
  }
}

export function getClientIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return ip.replace(/^::ffff:/, '').slice(0, 64);
}
