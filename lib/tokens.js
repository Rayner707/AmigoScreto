import crypto from 'crypto';

export function deriveToken(name, secret) {
  const normalized = name.trim().toLowerCase();
  const token = crypto.createHash('sha256').update(`${secret}:${normalized}`).digest('base64url');
  return token.slice(0, 16);
}
