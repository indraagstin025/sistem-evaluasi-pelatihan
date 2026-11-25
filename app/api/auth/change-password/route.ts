import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { attachSessionCookie, requireSession } from '@/lib/auth';
import { hashPassword, encryptVaultPassword, verifyPassword } from '@/lib/password';
import { handleApiError } from '@/lib/api-error';

export async function POST(request: Request) {
  const guard = await requireSession(undefined, { allowDuringPasswordChange: true });
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    const currentPassword = String(body?.currentPassword || '');
    const newPassword = String(body?.newPassword || '');

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi baru minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({ where: { id: guard.user.id } });
    if (!dbUser || !verifyPassword(currentPassword, dbUser.passwordHash)) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi saat ini tidak sesuai.' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi baru tidak boleh sama dengan kata sandi sebelumnya.' },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        passwordHash: hashPassword(newPassword),
        ...(dbUser.role === 'EVALUATOR'
          ? { passwordEncrypted: encryptVaultPassword(newPassword) }
          : {}),
        mustChangePassword: false,
      },
      select: {
        id: true,
        nama: true,
        email: true,
        nip: true,
        role: true,
        mustChangePassword: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui.',
      user: updated,
    });

    await attachSessionCookie(response, {
      userId: updated.id,
      role: updated.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'EVALUATOR',
      mustChangePassword: false,
    });

    return response;
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/auth/change-password', 'Gagal mengubah kata sandi.');
  }
}
