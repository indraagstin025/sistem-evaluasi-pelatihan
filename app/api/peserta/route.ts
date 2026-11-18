import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessKegiatan, requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const kegiatanId = searchParams.get('kegiatanId') || '';

    if (!kegiatanId) {
      return NextResponse.json(
        { success: false, error: 'Parameter kegiatanId wajib diisi.' },
        { status: 400 }
      );
    }

    const allowed = await canAccessKegiatan(guard.user, kegiatanId);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses pada kegiatan ini.' },
        { status: 403 }
      );
    }

    const isAdmin = guard.user.role === 'SUPER_ADMIN';
    const peserta = await prisma.peserta.findMany({
      where: {
        kegiatanId,
        ...(isAdmin ? {} : { tim: { evaluatorId: guard.user.id } }),
        ...(search
          ? {
              OR: [
                { nama: { contains: search, mode: 'insensitive' } },
                { nip: { contains: search, mode: 'insensitive' } },
                { instansi: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        tim: {
          include: {
            evaluator: { select: { id: true, nama: true, nip: true } },
          },
        },
        survey: {
          where: { responden: 'alumni', kode: { in: ['L4_01', 'L4_02', 'L4_03'] } },
        },
        wawancara: true,
        hasil: true,
        inovasiProper: {
          select: {
            id: true,
            judulProper: true,
            jangkaMenengahStatus: true,
            jangkaPanjangStatus: true,
            dokumenNama: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { nama: 'asc' },
    });

    return NextResponse.json({ success: true, data: peserta });
  } catch (error: any) {
    console.error('GET /api/peserta error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data peserta' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        'Penambahan peserta manual dinonaktifkan. Data peserta hanya masuk melalui impor berkas Excel (UR-F-10).',
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error:
        'Penghapusan massal peserta langsung dinonaktifkan (UR-N-07). Gunakan fitur Impor Ulang Excel atau Hapus Kegiatan oleh Super Admin.',
    },
    { status: 403 }
  );
}
