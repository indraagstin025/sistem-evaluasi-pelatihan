import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buatPembahasanGrafik, generatePembahasanTemplate } from '@/lib/ai';
import {
  KATEGORI_RENTANG,
  hitungDistribusiRentang,
  tentukanRentang,
  tentukanRentangItemSurvei,
  isValidNumber,
} from '@/lib/hitung';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Helper untuk menghitung rekap 5 grafik dari database saat ini
async function getRekapGrafikMap() {
  const listPeserta = await prisma.peserta.findMany({
    include: {
      survey: true,
      wawancara: true,
      hasil: true,
    },
    orderBy: { nama: 'asc' },
  });

  const mapped = listPeserta.map((p) => {
    const s_panjang = p.survey.find((s) => s.kode === 'L4_01' && s.responden === 'alumni')?.skor;
    const s_tujuan = p.survey.find((s) => s.kode === 'L4_02' && s.responden === 'alumni')?.skor;
    const s_manfaat = p.survey.find((s) => s.kode === 'L4_03' && s.responden === 'alumni')?.skor;

    const w_menengah = p.wawancara.find((w) => w.kriteria === 'menengah')?.nilai;
    const w_panjang = p.wawancara.find((w) => w.kriteria === 'jangkaPanjang')?.nilai;
    const w_tujuan = p.wawancara.find((w) => w.kriteria === 'seluruhTujuan')?.nilai;
    const w_manfaat = p.wawancara.find((w) => w.kriteria === 'manfaat')?.nilai;

    return {
      s_panjang,
      s_tujuan,
      s_manfaat,
      w_menengah,
      w_panjang,
      w_tujuan,
      w_manfaat,
      rangeSurvei: p.hasil?.rangeSurvei || 'KOSONG',
      rangeWawancara: p.hasil?.rangeWawancara || 'KOSONG',
    };
  });

  const g1_menengah = hitungDistribusiRentang(mapped.map((p) => tentukanRentang(p.w_menengah)));
  const g1_panjang = hitungDistribusiRentang(mapped.map((p) => tentukanRentang(p.w_panjang)));

  const g2_survei = hitungDistribusiRentang(mapped.map((p) => tentukanRentangItemSurvei(p.s_panjang)));
  const g2_wawancara = hitungDistribusiRentang(mapped.map((p) => tentukanRentang(p.w_panjang)));

  const g3_survei = hitungDistribusiRentang(mapped.map((p) => tentukanRentangItemSurvei(p.s_tujuan)));
  const g3_wawancara = hitungDistribusiRentang(mapped.map((p) => tentukanRentang(p.w_tujuan)));

  const g4_survei = hitungDistribusiRentang(mapped.map((p) => tentukanRentangItemSurvei(p.s_manfaat)));
  const g4_wawancara = hitungDistribusiRentang(mapped.map((p) => tentukanRentang(p.w_manfaat)));

  const g5_survei = hitungDistribusiRentang(mapped.map((p) => p.rangeSurvei));
  const g5_wawancara = hitungDistribusiRentang(mapped.map((p) => p.rangeWawancara));

  return {
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
      judul: 'Grafik 3: Seluruh Tujuan Tercapai — Survei vs Wawancara',
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
  };
}

// GET: Ambil pembahasan tersimpan atau inisialisasi dari templat
export async function GET() {
  try {
    const saved = await prisma.pembahasan.findMany();
    const result: Record<string, any> = {};
    const keys = ['grafik1', 'grafik2', 'grafik3', 'grafik4', 'grafik5', 'kesimpulan'] as const;

    const missingKeys = keys.filter((key) => !saved.some((s) => s.grafikKey === key));
    const rekapMap = missingKeys.length > 0 ? await getRekapGrafikMap() : null;

    await Promise.all(
      keys.map(async (key) => {
        const exist = saved.find((s) => s.grafikKey === key);
        if (exist) {
          result[key] = exist;
          return;
        }
        // Belum ada -> inisialisasi otomatis dari template baku
        const rekap = rekapMap ? (rekapMap as any)[key] : undefined;
        const initial = generatePembahasanTemplate(key, rekap);
        const created = await prisma.pembahasan.create({
          data: {
            grafikKey: key,
            judul: initial.judul,
            poin1: initial.poin1,
            poin2: initial.poin2,
            poin3: initial.poin3,
            poin4: initial.poin4,
            teksLengkap: initial.teksLengkap,
            sumber: 'template',
          },
        });
        result[key] = created;
      })
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('GET /api/ai/pembahasan error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat pembahasan AI' },
      { status: 500 }
    );
  }
}

// POST: Buat / generate ulang pembahasan (bisa 1 grafik atau semua)
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetKey = body.grafikKey || 'all';

    const rekapMap = await getRekapGrafikMap();
    const keysToProcess =
      targetKey === 'all'
        ? (['grafik1', 'grafik2', 'grafik3', 'grafik4', 'grafik5', 'kesimpulan'] as const)
        : ([targetKey] as const);

    const updatedMap: Record<string, any> = {};

    await Promise.all(
      keysToProcess.map(async (key) => {
        const rekap = key === 'kesimpulan' ? undefined : (rekapMap as any)[key];
        if (key !== 'kesimpulan' && !rekap) return;

        const hasil = await buatPembahasanGrafik(key, rekap);
        const payload = {
          judul: hasil.judul,
          poin1: hasil.poin1,
          poin2: hasil.poin2,
          poin3: hasil.poin3,
          poin4: hasil.poin4,
          teksLengkap: hasil.teksLengkap,
          sumber: hasil.sumber,
        };
        const saved = await prisma.pembahasan.upsert({
          where: { grafikKey: key },
          update: payload,
          create: {
            grafikKey: key,
            ...payload,
          },
        });
        updatedMap[key] = saved;
      })
    );

    return NextResponse.json({
      success: true,
      message:
        targetKey === 'all'
          ? 'Berhasil memperbarui pembahasan seluruh grafik'
          : `Berhasil memperbarui pembahasan ${targetKey}`,
      data: updatedMap,
    });
  } catch (error: any) {
    console.error('POST /api/ai/pembahasan error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal membuat pembahasan AI' },
      { status: 500 }
    );
  }
}

// PUT: Simpan suntingan manual pengguna
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { grafikKey, poin1, poin2, poin3, poin4 } = body;

    if (!grafikKey) {
      return NextResponse.json(
        { success: false, error: 'Parameter grafikKey wajib diisi.' },
        { status: 400 }
      );
    }

    const teksLengkap = [
      `1. ${poin1 || ''}`,
      `2. ${poin2 || ''}`,
      `3. ${poin3 || ''}`,
      `4. ${poin4 || ''}`,
    ].join('\n');

    const updated = await prisma.pembahasan.upsert({
      where: { grafikKey },
      update: {
        poin1: poin1 || '',
        poin2: poin2 || '',
        poin3: poin3 || '',
        poin4: poin4 || '',
        teksLengkap,
        sumber: 'manual',
      },
      create: {
        grafikKey,
        judul: body.judul || `Grafik ${grafikKey}`,
        poin1: poin1 || '',
        poin2: poin2 || '',
        poin3: poin3 || '',
        poin4: poin4 || '',
        teksLengkap,
        sumber: 'manual',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Perubahan pembahasan berhasil disimpan secara manual.',
      data: updated,
    });
  } catch (error: any) {
    console.error('PUT /api/ai/pembahasan error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan suntingan' },
      { status: 500 }
    );
  }
}
