import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

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

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(body?.nama !== undefined ? { nama: String(body.nama).trim() } : {}),
        ...(body?.email !== undefined
          ? { email: String(body.email).trim().toLowerCase() || null }
          : {}),
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal memperbarui akun Evaluator.' },
      { status: 500 }
    );
  }
}
