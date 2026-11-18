import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessPeserta, requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const access = await canAccessPeserta(guard.user, params.id);
    if (!access.peserta) {
      return NextResponse.json(
        { success: false, error: 'Peserta tidak ditemukan' },
        { status: 404 }
      );
    }
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses pada peserta di luar tim Anda.' },
        { status: 403 }
      );
    }

    const peserta = await prisma.peserta.findUnique({
      where: { id: params.id },
      include: {
        kegiatan: true,
        tim: {
          include: {
            evaluator: { select: { id: true, nama: true, nip: true } },
          },
        },
        survey: {
          where: { kode: { in: ['L4_01', 'L4_02', 'L4_03', 'HK_33', 'HK_34'] } },
        },
        wawancara: true,
        hasil: true,
        inovasiProper: true,
        selisihImport: true,
      },
    });

    return NextResponse.json({
      success: true,
      canEditWawancara: guard.user.role === 'EVALUATOR',
      data: peserta,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil detail peserta' },
      { status: 500 }
    );
  }
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error:
        'Data profil peserta hasil impor Excel bersifat terkunci dan tidak dapat diubah di dalam sistem (UR-F-10 / UR-N-07).',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error:
        'Data peserta hasil impor Excel bersifat terkunci dan tidak dapat dihapus dari dalam sistem (UR-N-07).',
    },
    { status: 403 }
  );
}
