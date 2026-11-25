import { prisma } from './prisma';
import {
  hitungDistribusiRentang,
  tentukanRentang,
  tentukanRentangItemSurvei,
} from './hitung';
import type { RekapGrafikData } from './ai';
import {
  normalizeStatusKonfirmasi,
  WAWANCARA_KRITERIA,
  type KriteriaWawancaraKey,
} from './wawancara-kriteria';

export interface KriteriaKonfirmasiRekap {
  kriteria: KriteriaWawancaraKey;
  judul: string;
  totalPeserta: number;
  ya: number;
  tidak: number;
  belumKonfirmasi: number;
}

export type KonfirmasiWawancaraMap = Record<KriteriaWawancaraKey, KriteriaKonfirmasiRekap>;

/**
 * Menghitung rekapitulasi status konfirmasi dropdown (Belum Konfirmasi, YA, TIDAK)
 * untuk kelima kriteria wawancara langsung dari daftar peserta & baris Wawancara aktual.
 */
export function hitungKonfirmasiWawancaraRekap(
  listPeserta: Array<{
    wawancara: Array<{ kriteria: string; statusKonfirmasi?: string | null }>;
  }>
): KonfirmasiWawancaraMap {
  const totalPeserta = listPeserta.length;
  const result = {} as KonfirmasiWawancaraMap;

  for (const meta of WAWANCARA_KRITERIA) {
    let ya = 0;
    let tidak = 0;
    let belumKonfirmasi = 0;

    for (const p of listPeserta) {
      const row = p.wawancara.find((w) => w.kriteria === meta.key);
      const status = normalizeStatusKonfirmasi(row?.statusKonfirmasi);
      if (status === 'YA') {
        ya += 1;
      } else if (status === 'TIDAK') {
        tidak += 1;
      } else {
        belumKonfirmasi += 1;
      }
    }

    result[meta.key] = {
      kriteria: meta.key,
      judul: meta.judul,
      totalPeserta,
      ya,
      tidak,
      belumKonfirmasi,
    };
  }

  return result;
}

export async function getKonfirmasiWawancaraMap(
  kegiatanId: string
): Promise<KonfirmasiWawancaraMap> {
  const listPeserta = await prisma.peserta.findMany({
    where: { kegiatanId },
    select: {
      id: true,
      wawancara: {
        select: {
          kriteria: true,
          statusKonfirmasi: true,
        },
      },
    },
  });

  return hitungKonfirmasiWawancaraRekap(listPeserta);
}

export function ringkasKonfirmasiUntukAi(
  konfirmasiMap: KonfirmasiWawancaraMap,
  keys?: KriteriaWawancaraKey[]
): string {
  const targetKeys =
    keys && keys.length > 0 ? keys : WAWANCARA_KRITERIA.map((k) => k.key);
  return targetKeys
    .map((key) => {
      const r = konfirmasiMap[key];
      if (!r) return null;
      return `- ${r.judul}: YA ${r.ya} peserta, TIDAK ${r.tidak} peserta, Belum Konfirmasi ${r.belumKonfirmasi} peserta (Total ${r.totalPeserta} peserta)`;
    })
    .filter(Boolean)
    .join('\n');
}

export const PEMBAHASAN_KEYS = [
  'grafik1',
  'grafik2',
  'grafik3',
  'grafik4',
  'grafik5',
  'kesimpulan',
] as const;

export type PembahasanKey = (typeof PEMBAHASAN_KEYS)[number];

/**
 * Menghitung rekapitulasi 5 grafik ekspose dari data peserta aktual dalam satu kegiatan.
 */
export async function getRekapGrafikMap(
  kegiatanId: string
): Promise<
  Record<'grafik1' | 'grafik2' | 'grafik3' | 'grafik4' | 'grafik5', RekapGrafikData>
> {
  const listPeserta = await prisma.peserta.findMany({
    where: { kegiatanId },
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
