import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from './prisma';
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionTokenPayload,
  type UserRole,
} from './session-token';

export interface SessionUser {
  id: string;
  nama: string;
  email: string | null;
  nip: string | null;
  role: UserRole;
  mustChangePassword: boolean;
  aktif: boolean;
}

/**
 * Membaca sesi pengguna aktif langsung dari cookie dan memvalidasi status terbaru di database.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const parsed = await verifySessionToken(rawToken);
  if (!parsed) return null;

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: {
      id: true,
      nama: true,
      email: true,
      nip: true,
      role: true,
      mustChangePassword: true,
      aktif: true,
    },
  });

  if (!user || !user.aktif) return null;

  return {
    ...user,
    role: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'EVALUATOR',
  };
}

/**
 * Guard API standar untuk memastikan autentikasi, pembaruan sandi wajib, dan hak akses peran.
 */
export async function requireSession(
  allowedRoles?: UserRole[],
  options?: { allowDuringPasswordChange?: boolean }
): Promise<
  { ok: true; user: SessionUser } | { ok: false; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Anda belum masuk. Silakan login terlebih dahulu.' },
        { status: 401 }
      ),
    };
  }

  if (user.mustChangePassword && !options?.allowDuringPasswordChange) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Anda harus mengganti kata sandi awal sebelum mengakses fitur ini.',
          mustChangePassword: true,
        },
        { status: 403 }
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Anda tidak memiliki izin mengakses sumber daya ini.' },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user };
}

/**
 * Memastikan Evaluator hanya dapat mengakses kegiatan tempat dia ditugaskan.
 */
export async function canAccessKegiatan(
  user: SessionUser,
  kegiatanId: string
): Promise<boolean> {
  if (user.role === 'SUPER_ADMIN') return true;
  const timCount = await prisma.timEvaluator.count({
    where: {
      kegiatanId,
      evaluatorId: user.id,
    },
  });
  return timCount > 0;
}

/**
 * Memastikan Evaluator hanya dapat mengakses peserta yang berada di tim pengampuannya.
 */
export async function canAccessPeserta(
  user: SessionUser,
  pesertaId: string
): Promise<{ allowed: boolean; peserta: { id: string; kegiatanId: string; timId: string | null } | null }> {
  const peserta = await prisma.peserta.findUnique({
    where: { id: pesertaId },
    select: {
      id: true,
      kegiatanId: true,
      timId: true,
      tim: { select: { evaluatorId: true } },
    },
  });

  if (!peserta) return { allowed: false, peserta: null };
  if (user.role === 'SUPER_ADMIN') {
    return { allowed: true, peserta };
  }
  const allowed = peserta.tim?.evaluatorId === user.id;
  return { allowed, peserta };
}

/**
 * Menyematkan cookie sesi HTTP-only yang aman pada NextResponse.
 */
export async function attachSessionCookie(
  response: NextResponse,
  payload: SessionTokenPayload
): Promise<NextResponse> {
  const token = await signSessionToken(payload);
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
  return response;
}

/**
 * Menghapus cookie sesi saat logout.
 */
export function detachSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
