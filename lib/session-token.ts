import { jwtVerify, SignJWT } from 'jose';

export const SESSION_COOKIE_NAME = 'bpsdm_evaluasi_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 jam

export type UserRole = 'SUPER_ADMIN' | 'EVALUATOR';

export interface SessionTokenPayload {
  userId: string;
  role: UserRole;
  mustChangePassword: boolean;
}

function getJwtSecret(): Uint8Array {
  const raw =
    process.env.AUTH_SECRET ||
    process.env.DATABASE_URL ||
    'dev-fallback-bpsdm-evaluasi-secret-change-in-prod';
  return new TextEncoder().encode(raw);
}

/**
 * Membuat token JWT terenkripsi HMAC-SHA256 (kompatibel Edge & Node.js).
 */
export async function signSessionToken(payload: SessionTokenPayload): Promise<string> {
  return new SignJWT({
    role: payload.role,
    mustChangePassword: payload.mustChangePassword,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtSecret());
}

/**
 * Memverifikasi token JWT sesi dari cookie HTTP-only.
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload.sub) return null;
    const role = payload.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : payload.role === 'EVALUATOR' ? 'EVALUATOR' : null;
    if (!role) return null;
    return {
      userId: payload.sub,
      role,
      mustChangePassword: Boolean(payload.mustChangePassword),
    };
  } catch {
    return null;
  }
}
