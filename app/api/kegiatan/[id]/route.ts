import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessKegiatan, requireSession } from '@/lib/auth';
import { KRITERIA_LABEL_MAP } from '@/lib/wawancara-kriteria';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const allowed = await canAccessKegiatan(guard.user, params.id);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Anda tidak terdaftar pada kegiatan ini.' },
      { status: 403 }
    );
  }

  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id: params.id },
  });
  if (!kegiatan) {
    return NextResponse.json(
      { success: false, error: 'Kegiatan tidak ditemukan.' },
      { status: 404 }
    );
  }

  const isAdmin = guard.user.role === 'SUPER_ADMIN';
  const pesertaWhere = isAdmin
    ? { kegiatanId: params.id }
    : { kegiatanId: params.id, tim: { evaluatorId: guard.user.id } };

  const [peserta, selisihRaw, timRaw] = await Promise.all([
    prisma.peserta.findMany({
      where: pesertaWhere,
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
    }),
    isAdmin
      ? prisma.selisihImport.findMany({
          where: { kegiatanId: params.id },
          include: { peserta: { select: { nama: true, nip: true } } },
          orderBy: [{ peserta: { nama: 'asc' } }, { kriteria: 'asc' }],
        })
      : Promise.resolve([]),
    prisma.timEvaluator.findMany({
      where: isAdmin ? { kegiatanId: params.id } : { kegiatanId: params.id, evaluatorId: guard.user.id },
      include: {
        evaluator: { select: { id: true, nama: true, nip: true } },
        _count: { select: { peserta: true } },
      },
      orderBy: { urutan: 'asc' },
    }),
  ]);

  const selisihImport = selisihRaw.map((s) => ({
    id: s.id,
    pesertaId: s.pesertaId,
    pesertaNama: s.peserta.nama,
    pesertaNip: s.peserta.nip,
    kriteria: s.kriteria,
    kriteriaLabel: KRITERIA_LABEL_MAP[s.kriteria] || s.kriteria,
    nilaiForm: s.nilaiForm,
    nilaiEkspose: s.nilaiEkspose,
    catatan: s.catatan,
  }));

  return NextResponse.json({
    success: true,
    data: {
      viewerRole: guard.user.role,
      kegiatan,
      peserta,
      tim: timRaw,
      selisihImport,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    const updated = await prisma.kegiatan.update({
      where: { id: params.id },
      data: {
        ...(body?.nama ? { nama: String(body.nama).trim() } : {}),
        ...(body?.jenisPelatihan ? { jenisPelatihan: String(body.jenisPelatihan).trim() } : {}),
        ...(body?.penyelenggara ? { penyelenggara: String(body.penyelenggara).trim() } : {}),
        ...(body?.lokasi ? { lokasi: String(body.lokasi).trim() } : {}),
        ...(body?.tanggalMulai ? { tanggalMulai: new Date(body.tanggalMulai) } : {}),
        ...(body?.tanggalSelesai ? { tanggalSelesai: new Date(body.tanggalSelesai) } : {}),
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal memperbarui kegiatan.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    await prisma.kegiatan.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Kegiatan berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal menghapus kegiatan.' },
      { status: 500 }
    );
  }
}
