import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { decryptVaultPassword, encryptVaultPassword, hashPassword } from '@/lib/password';
import { handleApiError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const users = await prisma.user.findMany({
      where: { role: 'EVALUATOR' },
      select: {
        id: true,
        nama: true,
        email: true,
        nip: true,
        role: true,
        passwordEncrypted: true,
        mustChangePassword: true,
        aktif: true,
        createdAt: true,
        timDiampu: {
          select: {
            id: true,
            namaTim: true,
            kegiatan: { select: { id: true, nama: true } },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { nama: 'asc' }],
    });

    const data = users.map(({ passwordEncrypted, ...rest }) => ({
      ...rest,
      revealedPassword: decryptVaultPassword(passwordEncrypted),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/users', 'Gagal memuat daftar akun Evaluator.');
  }
}

export async function POST(request: Request) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    const nama = String(body?.nama || '').trim();
    const nip = String(body?.nip || '').trim();
    const emailRaw = String(body?.email || '').trim().toLowerCase();
    const email = emailRaw || null;
    const password = String(body?.password || '');

    if (!nama || !nip || !password) {
      return NextResponse.json(
        { success: false, error: 'Nama, NIP/username, dan sandi awal wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Sandi awal Evaluator minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const dupNip = await prisma.user.findFirst({
      where: { nip: { equals: nip, mode: 'insensitive' } },
    });
    if (dupNip) {
      return NextResponse.json(
        { success: false, error: `NIP/username ${nip} sudah terdaftar.` },
        { status: 400 }
      );
    }

    if (email) {
      const dupEmail = await prisma.user.findUnique({ where: { email } });
      if (dupEmail) {
        return NextResponse.json(
          { success: false, error: `Email ${email} sudah digunakan.` },
          { status: 400 }
        );
      }
    }

    const created = await prisma.user.create({
      data: {
        nama,
        nip,
        email,
        role: 'EVALUATOR',
        passwordHash: hashPassword(password),
        passwordEncrypted: encryptVaultPassword(password),
        mustChangePassword: true,
        aktif: true,
      },
      select: {
        id: true,
        nama: true,
        nip: true,
        email: true,
        role: true,
        mustChangePassword: true,
        aktif: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { ...created, revealedPassword: password },
        message: `Akun Evaluator ${created.nama} (${created.nip}) berhasil dibuat.`,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/users', 'Gagal membuat akun Evaluator.');
  }
}
