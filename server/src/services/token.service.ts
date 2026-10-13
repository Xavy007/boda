import { nanoid } from 'nanoid';
import { env } from '../config/env.js';

/** 36 caracteres URL-safe (~214 bits de entropía): imposible de adivinar. */
export const TOKEN_LENGTH = 36;
export const TOKEN_REGEX = /^[A-Za-z0-9_-]{32,64}$/;

export function generateToken(): string {
  return nanoid(TOKEN_LENGTH);
}

export function invitationUrl(token: string): string {
  return `${env.CLIENT_URL}/i/${token}`;
}
