import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  const [teams, peserta] = await Promise.all([
    prisma.timEvaluator.findMany({
      where: { kegiatanId: params.id },
      include: {
        evaluator: { select: { id: true, nama: true, nip: true } },
        _count: { select: { peserta: true } },
      },
      orderBy: { urutan: 'asc' },
    }),
    prisma.peserta.findMany({
      where: { kegiatanId: params.id },
      include: {
        tim: {
          include: {
            evaluator: { select: { id: true, nama: true, nip: true } },
          },
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
      orderBy: [{ tim: { urutan: 'asc' } }, { nama: 'asc' }],
    }),
  ]);

  const rows = peserta.map((p) => {
    const filledNilai = p.wawancara.filter((w) => w.nilai !== null).length;
    const filledDeskripsi = p.wawancara.filter((w) => Boolean(w.deskripsi?.trim())).length;
    return {
      id: p.id,
      nama: p.nama,
      nip: p.nip,
      instansi: p.instansi,
      jabatanSaatIni: p.jabatanSaatIni,
      timId: p.timId,
      timNama: p.tim?.namaTim || p.namaTimExcel || 'Belum Dibagi',
      evaluatorNama: p.tim?.evaluator?.nama || null,
      linkMeeting: p.tim?.linkMeeting || null,
      linkInternalWawancara: `/kegiatan/${params.id}/wawancara/${p.id}`,
      filledNilai,
      filledDeskripsi,
      wawancaraSelesaiAt: p.wawancaraSelesaiAt,
      rataSurveiL: p.hasil?.rataSurveiL ?? null,
      rataWawancaraM: p.hasil?.rataWawancaraM ?? null,
      totalForm: p.hasil?.totalForm ?? null,
      hasProper: Boolean(p.inovasiProper),
      properJudul: p.inovasiProper?.judulProper || p.judulAksiPerubahan || null,
      properDokumenNama: p.inovasiProper?.dokumenNama || null,
    };
  });

  return NextResponse.json({
    success: true,
    data: { teams, peserta: rows },
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
    const timId = String(body?.timId || '');
    const linkMeeting = String(body?.linkMeeting || '').trim() || null;

    if (!timId) {
      return NextResponse.json({ success: false, error: 'timId wajib diisi.' }, { status: 400 });
    }

    if (linkMeeting && !/^https?:\/\//i.test(linkMeeting)) {
      return NextResponse.json(
        { success: false, error: 'Tautan meeting harus diawali http:// atau https://.' },
        { status: 400 }
      );
    }

    const existing = await prisma.timEvaluator.findFirst({
      where: { id: timId, kegiatanId: params.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Tim tidak ditemukan.' }, { status: 404 });
    }

    const updated = await prisma.timEvaluator.update({
      where: { id: timId },
      data: { linkMeeting },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal menyimpan tautan meeting.' },
      { status: 500 }
    );
  }
}
