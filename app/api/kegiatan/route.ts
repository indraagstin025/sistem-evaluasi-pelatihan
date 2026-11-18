import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const { user } = guard;

  if (user.role === 'SUPER_ADMIN') {
    const kegiatan = await prisma.kegiatan.findMany({
      include: {
        _count: {
          select: {
            peserta: true,
            tim: true,
            inovasiProper: true,
            selisihImport: true,
          },
        },
        peserta: {
          select: {
            wawancaraSelesaiAt: true,
          },
        },
      },
      orderBy: [{ tanggalMulai: 'desc' }, { createdAt: 'desc' }],
    });

    const formatted = kegiatan.map(({ peserta, _count, ...rest }) => ({
      ...rest,
      totalPeserta: _count.peserta,
      totalTim: _count.tim,
      totalProper: _count.inovasiProper,
      totalSelisih: _count.selisihImport,
      wawancaraSelesaiCount: peserta.filter((p) => p.wawancaraSelesaiAt !== null).length,
    }));

    return NextResponse.json({ success: true, data: formatted });
  }

  // EVALUATOR: hanya melihat kegiatan tempat ia mengampu tim
  const kegiatan = await prisma.kegiatan.findMany({
    where: {
      tim: {
        some: { evaluatorId: user.id },
      },
    },
    include: {
      tim: {
        where: { evaluatorId: user.id },
        select: {
          id: true,
          namaTim: true,
          linkMeeting: true,
          peserta: {
            select: {
              id: true,
              wawancaraSelesaiAt: true,
              inovasiProper: { select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: [{ tanggalMulai: 'desc' }, { createdAt: 'desc' }],
  });

  const formatted = kegiatan.map(({ tim, ...rest }) => {
    const myPeserta = tim.flatMap((t) => t.peserta);
    return {
      ...rest,
      totalPeserta: myPeserta.length,
      totalTim: tim.length,
      totalProper: myPeserta.filter((p) => p.inovasiProper !== null).length,
      totalSelisih: 0,
      wawancaraSelesaiCount: myPeserta.filter((p) => p.wawancaraSelesaiAt !== null).length,
      timSaya: tim.map((t) => ({ id: t.id, namaTim: t.namaTim, linkMeeting: t.linkMeeting })),
    };
  });

  return NextResponse.json({ success: true, data: formatted });
}

export async function POST(request: Request) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    const nama = String(body?.nama || '').trim();
    const jenisPelatihan = String(body?.jenisPelatihan || 'PKP').trim().toUpperCase();
    const penyelenggara = String(body?.penyelenggara || '').trim();
    const lokasi = String(body?.lokasi || '').trim();
    const tanggalMulai = body?.tanggalMulai ? new Date(body.tanggalMulai) : null;
    const tanggalSelesai = body?.tanggalSelesai ? new Date(body.tanggalSelesai) : null;

    if (!nama || !penyelenggara || !lokasi || !tanggalMulai || !tanggalSelesai) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Kelima isian wajib diisi: Nama Kegiatan, Penyelenggara, Lokasi, Tanggal Mulai, dan Tanggal Selesai.',
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(tanggalMulai.getTime()) || Number.isNaN(tanggalSelesai.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Format tanggal mulai atau tanggal selesai tidak valid.' },
        { status: 400 }
      );
    }

    if (tanggalSelesai < tanggalMulai) {
      return NextResponse.json(
        { success: false, error: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.' },
        { status: 400 }
      );
    }

    const allowedJenis = new Set(['PKP', 'PKA', 'PKN']);
    const normalizedJenis = allowedJenis.has(jenisPelatihan) ? jenisPelatihan : 'PKP';

    const created = await prisma.kegiatan.create({
      data: {
        nama,
        jenisPelatihan: normalizedJenis,
        penyelenggara,
        lokasi,
        tanggalMulai,
        tanggalSelesai,
        createdById: guard.user.id,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/kegiatan error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal membuat kegiatan baru.' },
      { status: 500 }
    );
  }
}
