import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target || target.role !== 'EVALUATOR') {
      return NextResponse.json(
        { success: false, error: 'Akun Evaluator tidak ditemukan.' },
        { status: 404 }
      );
    }

    const nextNip =
      body?.nip !== undefined ? String(body.nip || '').trim() : undefined;
    if (nextNip !== undefined) {
      if (!nextNip) {
        return NextResponse.json(
          { success: false, error: 'NIP atau username Evaluator tidak boleh kosong.' },
          { status: 400 }
        );
      }
      const dupNip = await prisma.user.findFirst({
        where: {
          id: { not: params.id },
          nip: { equals: nextNip, mode: 'insensitive' },
        },
      });
      if (dupNip) {
        return NextResponse.json(
          { success: false, error: `NIP/username ${nextNip} sudah digunakan akun lain.` },
          { status: 400 }
        );
      }
    }

    const nextEmail =
      body?.email !== undefined
        ? String(body.email || '').trim().toLowerCase() || null
        : undefined;
    if (nextEmail) {
      const dupEmail = await prisma.user.findFirst({
        where: { id: { not: params.id }, email: nextEmail },
      });
      if (dupEmail) {
        return NextResponse.json(
          { success: false, error: `Email ${nextEmail} sudah digunakan akun lain.` },
          { status: 400 }
        );
      }
    }

    const nextNama =
      body?.nama !== undefined ? String(body.nama || '').trim() : undefined;
    if (nextNama !== undefined && !nextNama) {
      return NextResponse.json(
        { success: false, error: 'Nama Evaluator tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(nextNama !== undefined ? { nama: nextNama } : {}),
        ...(nextNip !== undefined ? { nip: nextNip } : {}),
        ...(nextEmail !== undefined ? { email: nextEmail } : {}),
        ...(typeof body?.aktif === 'boolean' ? { aktif: body.aktif } : {}),
      },
      select: {
        id: true,
        nama: true,
        nip: true,
        email: true,
        role: true,
        mustChangePassword: true,
        aktif: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return handleApiError(error, 'PATCH /api/users/[id]', 'Gagal memperbarui akun Evaluator.');
  }
}
