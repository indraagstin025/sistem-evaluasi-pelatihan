import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { isValidNumber } from '@/lib/hitung';
import { getRekapGrafikMap } from '@/lib/pembahasan-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const kegiatanId = searchParams.get('kegiatanId') || '';
    if (!kegiatanId) {
      return NextResponse.json(
        { success: false, error: 'Parameter kegiatanId wajib diisi.' },
        { status: 400 }
      );
    }

    const [kegiatan, listPeserta, rekapMap, selisihCount] = await Promise.all([
      prisma.kegiatan.findUnique({ where: { id: kegiatanId } }),
      prisma.peserta.findMany({
        where: { kegiatanId },
        include: {
          survey: {
            where: { responden: 'alumni', kode: { in: ['L4_01', 'L4_02', 'L4_03'] } },
          },
          wawancara: true,
          hasil: true,
          tim: { select: { namaTim: true } },
        },
        orderBy: { nama: 'asc' },
      }),
      getRekapGrafikMap(kegiatanId),
      prisma.selisihImport.count({ where: { kegiatanId } }),
    ]);

    if (!kegiatan) {
      return NextResponse.json(
        { success: false, error: 'Kegiatan tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Pembatasan tampilan NIP (Bab 3.3): NIP tidak disertakan pada data Ekspose
    const mapped = listPeserta.map((p) => {
      const s_panjang = p.survey.find((s) => s.kode === 'L4_01')?.skor;
      const s_tujuan = p.survey.find((s) => s.kode === 'L4_02')?.skor;
      const s_manfaat = p.survey.find((s) => s.kode === 'L4_03')?.skor;

      const w_menengah = p.wawancara.find((w) => w.kriteria === 'menengah')?.nilai;
      const w_panjang = p.wawancara.find((w) => w.kriteria === 'jangkaPanjang')?.nilai;
      const w_tujuan = p.wawancara.find((w) => w.kriteria === 'seluruhTujuan')?.nilai;
      const w_manfaat = p.wawancara.find((w) => w.kriteria === 'manfaat')?.nilai;
      const w_komunikasi = p.wawancara.find((w) => w.kriteria === 'komunikasi')?.nilai;

      return {
        id: p.id,
        nama: p.nama,
        jabatanPelatihan: p.jabatanPelatihan,
        jabatanSaatIni: p.jabatanSaatIni,
        instansi: p.instansi,
        timNama: p.tim?.namaTim || p.namaTimExcel || null,
        s_panjang,
        s_tujuan,
        s_manfaat,
        w_menengah,
        w_panjang,
        w_tujuan,
        w_manfaat,
        w_komunikasi,
        L: p.hasil?.rataSurveiL ?? null,
        M: p.hasil?.rataWawancaraM ?? null,
        totalForm: p.hasil?.totalForm ?? null,
        selisih: p.hasil?.selisih ?? null,
        rangeSurvei: p.hasil?.rangeSurvei ?? null,
        rangeWawancara: p.hasil?.rangeWawancara ?? null,
        isWawancaraKosong:
          !isValidNumber(w_panjang) && !isValidNumber(w_tujuan) && !isValidNumber(w_manfaat),
      };
    });

    const validL = mapped.filter((p) => isValidNumber(p.L));
    const validM = mapped.filter((p) => isValidNumber(p.M));
    const avgL =
      validL.length > 0
        ? validL.reduce((acc, p) => acc + (p.L || 0), 0) / validL.length
        : 0;
    const avgM =
      validM.length > 0
        ? validM.reduce((acc, p) => acc + (p.M || 0), 0) / validM.length
        : 0;

    const withDiff = mapped.filter((p) => isValidNumber(p.selisih));
    const maxPositive =
      withDiff.length > 0
        ? [...withDiff].sort((a, b) => (b.selisih || 0) - (a.selisih || 0))[0]
        : null;
    const maxNegative =
      withDiff.length > 0
        ? [...withDiff].sort((a, b) => (a.selisih || 0) - (b.selisih || 0))[0]
        : null;

    const kosongList = mapped.filter((p) => p.isWawancaraKosong);

    return NextResponse.json(
      {
        success: true,
        kegiatan,
        rekap: rekapMap,
        ringkasan: {
          totalPeserta: mapped.length,
          totalValidSurvei: validL.length,
          totalValidWawancara: validM.length,
          totalKosongWawancara: kosongList.length,
          rataRataSurveiL: avgL,
          rataRataWawancaraM: avgM,
          selisihTerbesarPositif: maxPositive,
          selisihTerbesarNegatif: maxNegative,
          daftarKosong: kosongList,
          selisihImportCount: selisihCount,
        },
        peserta: mapped,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('GET /api/ekspose error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data ekspose' },
      { status: 500 }
    );
  }
}
