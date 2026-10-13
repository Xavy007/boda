import type { CookieOptions } from 'express';
import { isProd } from './env.js';

export const DEVICE_COOKIE = 'wd_device';
export const ADMIN_COOKIE = 'wd_admin';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
export const ADMIN_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export const deviceCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  signed: true,
  maxAge: ONE_YEAR_MS,
  path: '/',
};

export const adminCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  maxAge: ADMIN_SESSION_MS,
  path: '/',
};
