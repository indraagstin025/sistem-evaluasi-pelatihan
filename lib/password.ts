import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const VAULT_PREFIX = 'v1';

function getVaultKey(): Buffer {
  const raw =
    process.env.AUTH_SECRET ||
    process.env.DATABASE_URL ||
    'dev-fallback-bpsdm-evaluasi-secret-change-in-prod';
  return createHash('sha256').update(`vault:${raw}`).digest();
}

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

/**
 * Mengenkripsi salinan sandi Evaluator (AES-256-GCM) agar Super Admin dapat melihatnya bila diperlukan.
 */
export function encryptVaultPassword(plainPassword: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getVaultKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainPassword, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VAULT_PREFIX}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Mendekripsi salinan sandi Evaluator dari vault AES-256-GCM.
 */
export function decryptVaultPassword(storedCipher: string | null | undefined): string | null {
  if (!storedCipher || typeof storedCipher !== 'string') return null;
  const parts = storedCipher.split(':');
  if (parts.length !== 4 || parts[0] !== VAULT_PREFIX) return null;
  const [, ivHex, tagHex, dataHex] = parts;
  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      getVaultKey(),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}
