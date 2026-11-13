import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  KATEGORI_RENTANG,
  hitungDistribusiRentang,
  tentukanRentang,
  tentukanRentangItemSurvei,
  isValidNumber,
} from '@/lib/hitung';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const listPeserta = await prisma.peserta.findMany({
      include: {
        survey: true,
        wawancara: true,
        hasil: true,
      },
      orderBy: { nama: 'asc' },
    });

    // Petakan nilai per peserta
    const mapped = listPeserta.map(p => {
      const s_panjang = p.survey.find(s => s.kode === 'L4_01' && s.responden === 'alumni')?.skor;
      const s_tujuan = p.survey.find(s => s.kode === 'L4_02' && s.responden === 'alumni')?.skor;
      const s_manfaat = p.survey.find(s => s.kode === 'L4_03' && s.responden === 'alumni')?.skor;

      const w_menengah = p.wawancara.find(w => w.kriteria === 'menengah')?.nilai;
      const w_panjang = p.wawancara.find(w => w.kriteria === 'jangkaPanjang')?.nilai;
      const w_tujuan = p.wawancara.find(w => w.kriteria === 'seluruhTujuan')?.nilai;
      const w_manfaat = p.wawancara.find(w => w.kriteria === 'manfaat')?.nilai;
      const w_komunikasi = p.wawancara.find(w => w.kriteria === 'komunikasi')?.nilai;

      return {
        id: p.id,
        nama: p.nama,
        nip: p.nip,
        jabatanPelatihan: p.jabatanPelatihan,
        jabatanSaatIni: p.jabatanSaatIni,
        instansi: p.instansi,
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
        isWawancaraKosong: !isValidNumber(w_panjang) && !isValidNumber(w_tujuan) && !isValidNumber(w_manfaat),
      };
    });

    // 1. Grafik 1: Jangka Menengah (Wawancara) vs Jangka Panjang (Wawancara)
    const g1_menengah = hitungDistribusiRentang(mapped.map(p => tentukanRentang(p.w_menengah)));
    const g1_panjang = hitungDistribusiRentang(mapped.map(p => tentukanRentang(p.w_panjang)));

    // 2. Grafik 2: Target Jangka Panjang — Survei vs Wawancara
    const g2_survei = hitungDistribusiRentang(mapped.map(p => tentukanRentangItemSurvei(p.s_panjang)));
    const g2_wawancara = hitungDistribusiRentang(mapped.map(p => tentukanRentang(p.w_panjang)));

    // 3. Grafik 3: Seluruh Tujuan — Survei vs Wawancara
    const g3_survei = hitungDistribusiRentang(mapped.map(p => tentukanRentangItemSurvei(p.s_tujuan)));
    const g3_wawancara = hitungDistribusiRentang(mapped.map(p => tentukanRentang(p.w_tujuan)));

    // 4. Grafik 4: Manfaat — Survei vs Wawancara
    const g4_survei = hitungDistribusiRentang(mapped.map(p => tentukanRentangItemSurvei(p.s_manfaat)));
    const g4_wawancara = hitungDistribusiRentang(mapped.map(p => tentukanRentang(p.w_manfaat)));

    // 5. Grafik 5: Nilai Keseluruhan (L vs M) — Survei vs Wawancara
    const g5_survei = hitungDistribusiRentang(mapped.map(p => p.rangeSurvei || 'KOSONG'));
    const g5_wawancara = hitungDistribusiRentang(mapped.map(p => p.rangeWawancara || 'KOSONG'));

    // Ringkasan
    const validL = mapped.filter(p => isValidNumber(p.L));
    const validM = mapped.filter(p => isValidNumber(p.M));
    const avgL = validL.length > 0 ? validL.reduce((acc, p) => acc + (p.L || 0), 0) / validL.length : 0;
    const avgM = validM.length > 0 ? validM.reduce((acc, p) => acc + (p.M || 0), 0) / validM.length : 0;

    // Selisih terbesar
    const withDiff = mapped.filter(p => isValidNumber(p.selisih));
    const maxPositive = withDiff.length > 0 ? [...withDiff].sort((a, b) => (b.selisih || 0) - (a.selisih || 0))[0] : null;
    const maxNegative = withDiff.length > 0 ? [...withDiff].sort((a, b) => (a.selisih || 0) - (b.selisih || 0))[0] : null;

    // Peserta dengan wawancara kosong
    const kosongList = mapped.filter(p => p.isWawancaraKosong);

    return NextResponse.json(
      {
        success: true,
        kategori: KATEGORI_RENTANG,
        rekap: {
          grafik1: {
            judul: 'Grafik 1: Target Aksi Perubahan Jangka Menengah vs Jangka Panjang (Wawancara)',
            slide: 'Slide PPT 5',
            labelA: 'Jangka Menengah (Wawancara)',
            dataA: g1_menengah,
            totalA: g1_menengah.reduce((a, b) => a + b, 0),
            labelB: 'Jangka Panjang (Wawancara)',
            dataB: g1_panjang,
            totalB: g1_panjang.reduce((a, b) => a + b, 0),
          },
          grafik2: {
            judul: 'Grafik 2: Target Jangka Panjang — Survei vs Wawancara',
            slide: 'Slide PPT 6',
            labelA: 'Survei (Jangka Panjang)',
            dataA: g2_survei,
            totalA: g2_survei.reduce((a, b) => a + b, 0),
            labelB: 'Wawancara (Jangka Panjang)',
            dataB: g2_wawancara,
            totalB: g2_wawancara.reduce((a, b) => a + b, 0),
          },
          grafik3: {
            judul: 'Grafik 3: Seluruh Tujuan Aksi Perubahan — Survei vs Wawancara',
            slide: 'Slide PPT 7',
            labelA: 'Survei (Seluruh Tujuan)',
            dataA: g3_survei,
            totalA: g3_survei.reduce((a, b) => a + b, 0),
            labelB: 'Wawancara (Seluruh Tujuan)',
            dataB: g3_wawancara,
            totalB: g3_wawancara.reduce((a, b) => a + b, 0),
          },
          grafik4: {
            judul: 'Grafik 4: Manfaat Aksi Perubahan — Survei vs Wawancara',
            slide: 'Slide PPT 8',
            labelA: 'Survei (Manfaat)',
            dataA: g4_survei,
            totalA: g4_survei.reduce((a, b) => a + b, 0),
            labelB: 'Wawancara (Manfaat)',
            dataB: g4_wawancara,
            totalB: g4_wawancara.reduce((a, b) => a + b, 0),
          },
          grafik5: {
            judul: 'Grafik 5: Nilai Keseluruhan (L vs M) — Survei vs Wawancara',
            slide: 'Slide PPT 9',
            labelA: 'Rata-Rata Survei (L)',
            dataA: g5_survei,
            totalA: g5_survei.reduce((a, b) => a + b, 0),
            labelB: 'Rata-Rata Wawancara (M)',
            dataB: g5_wawancara,
            totalB: g5_wawancara.reduce((a, b) => a + b, 0),
          },
        },
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
