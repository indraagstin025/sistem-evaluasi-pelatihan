import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Menghasilkan hash kata sandi menggunakan scrypt + salt acak 16-byte.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Memverifikasi kecocokan kata sandi terhadap hash scrypt secara constant-time.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, hexKey] = parts;
  if (!salt || !hexKey) return false;
  try {
    const keyBuf = Buffer.from(hexKey, 'hex');
    const derivedBuf = scryptSync(password, salt, 64);
    if (keyBuf.length !== derivedBuf.length) return false;
    return timingSafeEqual(keyBuf, derivedBuf);
  } catch {
    return false;
  }
}
