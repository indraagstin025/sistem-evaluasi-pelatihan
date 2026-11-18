import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  const users = await prisma.user.findMany({
    where: { role: 'EVALUATOR' },
    select: {
      id: true,
      nama: true,
      email: true,
      nip: true,
      role: true,
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

  return NextResponse.json({ success: true, data: users });
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
        { success: false, error: 'Nama, NIP (username), dan sandi awal wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Sandi awal Evaluator minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const dupNip = await prisma.user.findUnique({ where: { nip } });
    if (dupNip) {
      return NextResponse.json(
        { success: false, error: `NIP ${nip} sudah terdaftar.` },
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
        data: created,
        message: `Akun Evaluator ${created.nama} (NIP: ${created.nip}) berhasil dibuat.`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/users error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal membuat akun Evaluator.' },
      { status: 500 }
    );
  }
}
