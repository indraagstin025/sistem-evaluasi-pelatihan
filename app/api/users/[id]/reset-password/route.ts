import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { encryptVaultPassword, hashPassword } from '@/lib/password';
import { handleApiError } from '@/lib/api-error';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    const newPassword = String(body?.newPassword || '');

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Sandi reset minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target || target.role !== 'EVALUATOR') {
      return NextResponse.json(
        { success: false, error: 'Akun Evaluator tidak ditemukan.' },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: params.id },
      data: {
        passwordHash: hashPassword(newPassword),
        passwordEncrypted: encryptVaultPassword(newPassword),
        mustChangePassword: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Sandi untuk ${target.nama} berhasil direset. Evaluator wajib mengganti sandi saat login berikutnya.`,
    });
  } catch (error: unknown) {
    return handleApiError(
      error,
      'POST /api/users/[id]/reset-password',
      'Gagal mereset kata sandi.'
    );
  }
}
