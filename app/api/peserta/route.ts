import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canAccessKegiatan, requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const kegiatanId = searchParams.get('kegiatanId') || '';
    const timId = (searchParams.get('timId') || '').trim();
    const status = (searchParams.get('status') || 'semua').trim();

    const parsedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const parsedLimit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    const limit =
      Number.isNaN(parsedLimit) || parsedLimit < 1
        ? 10
        : Math.min(parsedLimit, 100);

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
    const baseWhere: Prisma.PesertaWhereInput = {
      kegiatanId,
      ...(isAdmin ? {} : { tim: { evaluatorId: guard.user.id } }),
    };

    const statusConditions: Record<string, Prisma.PesertaWhereInput> = {
      selesai: {
        wawancaraSelesaiAt: { not: null },
        inovasiProper: { isNot: null },
      },
      belum_selesai: {
        OR: [{ wawancaraSelesaiAt: null }, { inovasiProper: { is: null } }],
      },
      belum_proper: {
        inovasiProper: { is: null },
      },
      ada_kosong: {
        wawancara: { some: { nilai: null } },
      },
    };

    const extraFilters: Prisma.PesertaWhereInput[] = [];
    if (timId && timId !== 'semua') {
      extraFilters.push({ timId });
    }
    if (search) {
      extraFilters.push({
        OR: [
          { nama: { contains: search, mode: 'insensitive' } },
          { nip: { contains: search, mode: 'insensitive' } },
          { instansi: { contains: search, mode: 'insensitive' } },
          { tim: { namaTim: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }
    if (status !== 'semua' && statusConditions[status]) {
      extraFilters.push(statusConditions[status]);
    }

    const filteredWhere: Prisma.PesertaWhereInput =
      extraFilters.length > 0 ? { AND: [baseWhere, ...extraFilters] } : baseWhere;

    const [totalFiltered, totalAll, selesaiCount, belumProperCount, adaKosongCount] =
      await Promise.all([
        prisma.peserta.count({ where: filteredWhere }),
        prisma.peserta.count({ where: baseWhere }),
        prisma.peserta.count({
          where: { AND: [baseWhere, statusConditions.selesai] },
        }),
        prisma.peserta.count({
          where: { AND: [baseWhere, statusConditions.belum_proper] },
        }),
        prisma.peserta.count({
          where: { AND: [baseWhere, statusConditions.ada_kosong] },
        }),
      ]);

    const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));
    const safePage = Math.min(page, totalPages);

    const peserta = await prisma.peserta.findMany({
      where: filteredWhere,
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
      orderBy: [{ nama: 'asc' }, { id: 'asc' }],
      take: limit,
      skip: (safePage - 1) * limit,
    });

    return NextResponse.json({
      success: true,
      data: peserta,
      pagination: {
        page: safePage,
        limit,
        total: totalFiltered,
        totalPages,
      },
      counts: {
        total: totalAll,
        selesai: selesaiCount,
        belumSelesai: Math.max(0, totalAll - selesaiCount),
        belumProper: belumProperCount,
        adaKosong: adaKosongCount,
      },
    });
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
