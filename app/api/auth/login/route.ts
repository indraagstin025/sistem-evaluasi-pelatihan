import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attachSessionCookie } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const identifier = String(body?.identifier || body?.email || '').trim();
    const password = String(body?.password || '');

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, NIP, atau username dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanNip = identifier.replace(/[^0-9]/g, '');
    const collapsedUsername = identifier.replace(/[^a-zA-Z0-9]/g, '');
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier.toLowerCase(), mode: 'insensitive' } },
          { nip: { equals: identifier, mode: 'insensitive' } },
          ...(collapsedUsername && collapsedUsername.toLowerCase() !== identifier.toLowerCase()
            ? [{ nip: { equals: collapsedUsername, mode: 'insensitive' as const } }]
            : []),
          ...(cleanNip.length >= 8 ? [{ nip: cleanNip }] : []),
        ],
      },
    });

    if (!user && !identifier.includes('@')) {
      const byName = await prisma.user.findMany({
        where: {
          role: 'EVALUATOR',
          nama: { equals: identifier, mode: 'insensitive' },
        },
        take: 2,
      });
      if (byName.length === 1) {
        user = byName[0];
      }
    }

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { success: false, error: 'Email/NIP/username atau kata sandi salah.' },
        { status: 401 }
      );
    }

    if (!user.aktif) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda dinonaktifkan oleh Super Admin.' },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        nip: user.nip,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });

    await attachSessionCookie(response, {
      userId: user.id,
      role: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'EVALUATOR',
      mustChangePassword: user.mustChangePassword,
    });

    return response;
  } catch (error: any) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat proses masuk.' },
      { status: 500 }
    );
  }
}
