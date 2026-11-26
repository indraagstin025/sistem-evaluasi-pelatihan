/**
 * lib/ekspose-config.ts
 * Konfigurasi slide resmi Ekspose (Slide 5-10 BPSDM Jabar) dan helper teks terbagi
 * agar tampilan web `/ekspose` dan generator file `.pptx` selalu sinkron.
 */

import {
  EKSPOSE_SLIDE_KRITERIA_MAP,
  type KriteriaWawancaraKey,
} from './wawancara-kriteria';

export type EksposeGrafikKey = 'grafik1' | 'grafik2' | 'grafik3' | 'grafik4' | 'grafik5';

export const AI_MIN_COMPLETENESS_PCT = 80;
export const AI_OPEN_TEXT_MIN_RECORDS = 3;

export type AiDataReadinessStatus = 'blocked' | 'warning' | 'ready';

export interface AiDataReadiness {
  status: AiDataReadinessStatus;
  minPct: number;
  totalPeserta: number;
  validSurvei: number;
  validWawancara: number;
  missingSurvei: number;
  missingWawancara: number;
  surveiPct: number;
  wawancaraPct: number;
  message: string;
}

export interface KonfirmasiKriteriaLike {
  kriteria: string;
  judul: string;
  totalPeserta: number;
  ya: number;
  tidak: number;
  belumKonfirmasi: number;
}

export interface EksposeSlideMeta {
  key: EksposeGrafikKey;
  slideNumber: string;
  slideTitle: string;
  subtitle: string;
  labelOrange: string;
  labelBlue: string;
}

export const EKSPOSE_CATEGORIES = ['76-100', '51-75', '26-50', '1-25', '0'] as const;

export const EKSPOSE_COLORS = {
  orangeHex: 'ED7D31',
  blueHex: '4472C4',
  pembahasanBgHex: 'D9E1F2',
  pembahasanBorderHex: 'C5D1E8',
  kesimpulanBgHex: 'FCE4D6',
  kesimpulanBorderHex: 'F4CCA4',
  rekomendasiBgHex: 'E2EFDA',
  rekomendasiBorderHex: 'C5E0B4',
  headingHex: '0F172A',
  subtitleHex: '595959',
  axisTextHex: '595959',
  axisLineHex: 'CBD5E1',
  dataLabelHex: '1E293B',
} as const;

export const EKSPOSE_GRAFIK_SLIDES: EksposeSlideMeta[] = [
  {
    key: 'grafik1',
    slideNumber: 'Slide 1',
    slideTitle:
      'Perbandingan Capaian Jangka Menengah dengan Jangka Panjang (Hasil wawancara)',
    subtitle:
      'Hasil wawancara: capaian target jangka menengah dibandingkan dengan jangka panjang',
    labelOrange: 'Nilai Jangka Panjang',
    labelBlue: 'Nilai Jangka Menengah',
  },
  {
    key: 'grafik2',
    slideNumber: 'Slide 2',
    slideTitle: 'Target Aksi Perubahan Dalam Jangka Panjang Tercapai',
    subtitle: 'Perbandingan nilai survei alumni dan nilai wawancara untuk target jangka panjang',
    labelOrange: 'Nilai Wawancara',
    labelBlue: 'Nilai Survei',
  },
  {
    key: 'grafik3',
    slideNumber: 'Slide 3',
    slideTitle: 'Seluruh Tujuan Aksi Perubahan Dapat Tercapai',
    subtitle: 'Perbandingan nilai survei alumni dan nilai wawancara untuk pencapaian seluruh tujuan',
    labelOrange: 'Nilai Wawancara',
    labelBlue: 'Nilai Survei',
  },
  {
    key: 'grafik4',
    slideNumber: 'Slide 4',
    slideTitle: 'Manfaat Aksi Perubahan',
    subtitle: 'Perbandingan nilai survei alumni dan nilai wawancara untuk manfaat Aksi Perubahan',
    labelOrange: 'Nilai Wawancara',
    labelBlue: 'Nilai Survei',
  },
  {
    key: 'grafik5',
    slideNumber: 'Slide 5',
    slideTitle: 'Nilai Keseluruhan',
    subtitle: 'Perbandingan rata-rata nilai survei (L) dan rata-rata nilai wawancara (M) keseluruhan',
    labelOrange: 'Nilai Wawancara',
    labelBlue: 'Nilai Survei',
  },
];

export interface BoldTextSegment {
  text: string;
  bold: boolean;
}

/**
 * Memecah markup bold sederhana (`**teks**`) menjadi segmen teks datar/tebal.
 */
export function parseBoldSegments(text: string): BoldTextSegment[] {
  if (!text) return [];
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return { text: part.slice(2, -2), bold: true };
      }
      return { text: part, bold: false };
    });
}

export interface KesimpulanFields {
  poin1?: string | null;
  poin2?: string | null;
  poin3?: string | null;
  poin4?: string | null;
}

/**
 * Mengekstrak daftar poin Pembahasan (poin1-2) dan Rekomendasi bernomor (poin3-4)
 * untuk Slide 6 / Slide 10 Kesimpulan dan Rekomendasi.
 */
export function extractKesimpulanContent(item?: KesimpulanFields | null): {
  pembahasanList: string[];
  rekomendasiList: string[];
} {
  const pembahasanList = [item?.poin1, item?.poin2]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);

  const rekomendasiList = [
    ...(typeof item?.poin3 === 'string' ? [item.poin3] : []),
    ...(typeof item?.poin4 === 'string' ? item.poin4.split(/\r?\n/) : []),
  ]
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);

  return { pembahasanList, rekomendasiList };
}

function formatStatusLengkap(r: KonfirmasiKriteriaLike): string {
  if (r.ya === 0 && r.tidak === 0) {
    return `seluruh ${r.totalPeserta} peserta belum dikonfirmasi`;
  }
  return `${r.ya} peserta menyatakan YA, ${r.tidak} peserta TIDAK, dan ${r.belumKonfirmasi} peserta belum dikonfirmasi`;
}

function formatStatusRingkas(r: KonfirmasiKriteriaLike): string {
  if (r.ya === 0 && r.tidak === 0) {
    return 'seluruhnya belum dikonfirmasi';
  }
  return `${r.ya} YA, ${r.tidak} TIDAK, dan ${r.belumKonfirmasi} belum dikonfirmasi`;
}

function semuaStatusIdentik(rows: KonfirmasiKriteriaLike[]): boolean {
  if (rows.length <= 1) return true;
  const [first, ...rest] = rows;
  return rest.every(
    (r) =>
      r.ya === first.ya &&
      r.tidak === first.tidak &&
      r.belumKonfirmasi === first.belumKonfirmasi &&
      r.totalPeserta === first.totalPeserta
  );
}

/**
 * Menyusun Catatan Konfirmasi Wawancara (Data Aktual) dalam bentuk kalimat narasi natural
 * untuk dipakai bersama pada tampilan Web Ekspose dan ekspor PowerPoint (.pptx).
 */
export function buildKonfirmasiNarasi(
  konfirmasiMap: Partial<Record<KriteriaWawancaraKey | string, KonfirmasiKriteriaLike>> | null | undefined,
  slideKey: keyof typeof EKSPOSE_SLIDE_KRITERIA_MAP
): string[] {
  if (!konfirmasiMap) return [];
  const keys = EKSPOSE_SLIDE_KRITERIA_MAP[slideKey] || [];
  const rows = keys
    .map((k) => konfirmasiMap[k])
    .filter((v): v is KonfirmasiKriteriaLike => Boolean(v));

  if (rows.length === 0) return [];

  if (rows.length === 1) {
    const [r] = rows;
    return [
      `Dari ${r.totalPeserta} peserta, status konfirmasi wawancara untuk kriteria ${r.judul} mencatat ${formatStatusLengkap(r)}.`,
    ];
  }

  if (rows.length === 2) {
    const [r1, r2] = rows;
    if (semuaStatusIdentik(rows)) {
      return [
        `Dari ${r1.totalPeserta} peserta, status konfirmasi wawancara pada kriteria ${r1.judul} dan ${r2.judul} masing-masing mencatat ${formatStatusLengkap(r1)}.`,
      ];
    }
    return [
      `Dari ${r1.totalPeserta} peserta, status konfirmasi wawancara untuk kriteria ${r1.judul} mencatat ${formatStatusLengkap(r1)}, sedangkan pada kriteria ${r2.judul} tercatat ${formatStatusLengkap(r2)}.`,
    ];
  }

  if (slideKey === 'grafik5') {
    const [focus, ...others] = rows;
    const kalimat1 = `Pada kriteria ${focus.judul}, dari ${focus.totalPeserta} peserta tercatat ${formatStatusLengkap(focus)}.`;
    if (others.length === 0) return [kalimat1];
    const kalimat2 = semuaStatusIdentik(others)
      ? `Sementara itu, keempat kriteria penilaian lainnya (${others.map((o) => o.judul).join(', ')}) masing-masing mencatat ${formatStatusRingkas(others[0])}.`
      : `Sementara itu, empat kriteria penilaian lainnya masing-masing mencatat: ${others.map((o) => `${o.judul} (${formatStatusRingkas(o)})`).join('; ')}.`;
    return [kalimat1, kalimat2];
  }

  // Slide 6 (Kesimpulan — seluruh 5 kriteria)
  const first = rows[0];
  if (semuaStatusIdentik(rows)) {
    return [
      `Dari ${first.totalPeserta} peserta terdaftar, rekapitulasi status konfirmasi pada kelima kriteria wawancara masing-masing mencatat ${formatStatusLengkap(first)}.`,
    ];
  }
  return [
    `Dari ${first.totalPeserta} peserta terdaftar, rekapitulasi status konfirmasi wawancara mencatat: ${rows.map((r) => `${r.judul} (${formatStatusRingkas(r)})`).join('; ')}.`,
  ];
}

/**
 * Memastikan kalimat `catatanKonfirmasi` hasil AI yang tersimpan di database masih cocok
 * dengan angka aktual konfirmasi di database (mencegah tampilan angka kadaluarsa bila
 * evaluator baru saja mengubah dropdown YA/TIDAK di Form Wawancara).
 */
export function isKonfirmasiNarasiStillFresh(
  aiText: string | null | undefined,
  konfirmasiMap: Partial<Record<KriteriaWawancaraKey | string, KonfirmasiKriteriaLike>> | null | undefined,
  slideKey: keyof typeof EKSPOSE_SLIDE_KRITERIA_MAP
): boolean {
  const clean = String(aiText || '').trim();
  if (clean.length < 20 || !konfirmasiMap) return false;
  const keys = EKSPOSE_SLIDE_KRITERIA_MAP[slideKey] || [];
  const rows = keys
    .map((k) => konfirmasiMap[k])
    .filter((v): v is KonfirmasiKriteriaLike => Boolean(v));
  if (rows.length === 0) return false;

  const hasNum = (n: number) => {
    if (n === 0) {
      return /\b0\b|tidak ada|nihil|nol|belum ada/i.test(clean);
    }
    return new RegExp(`\\b${n}\\b`).test(clean);
  };

  for (const r of rows) {
    if (!hasNum(r.ya) || !hasNum(r.belumKonfirmasi)) {
      return false;
    }
    if (r.tidak > 0 && !hasNum(r.tidak)) {
      return false;
    }
  }
  return true;
}

export interface RingkasanKonteksFallbackInput {
  rataSurveiL: number | null;
  rataWawancaraM: number | null;
  surveiJauhLebihTinggi: number;
  skorWawancaraRendah: number;
  totalPeserta: number;
  sudahUnggahEvidence?: number;
  kendalaTemaCount?: number;
  wawancaraTemaCount?: number;
}

/**
 * Kalimat cadangan bahasa Indonesia yang mudah dimengerti (tanpa istilah teknis L/M atau Batch 2)
 * untuk kotak Ringkasan Dasar Rekomendasi pada Slide 6.
 */
export function buildRingkasanKonteksFallback(
  input: RingkasanKonteksFallbackInput
): string {
  const avgSurvei =
    input.rataSurveiL !== null ? input.rataSurveiL.toFixed(1).replace('.', ',') : '-';
  const avgWaw =
    input.rataWawancaraM !== null ? input.rataWawancaraM.toFixed(1).replace('.', ',') : '-';

  const kalimat1 = `Rata-rata penilaian survei mandiri peserta (${avgSurvei}) dibandingkan dengan hasil wawancara evaluator (${avgWaw}) menunjukkan ${input.surveiJauhLebihTinggi} peserta memiliki perbedaan penilaian yang cukup lebar dan ${input.skorWawancaraRendah} peserta memperoleh nilai wawancara di bawah 51.`;

  const bagian2: string[] = [];
  if (typeof input.sudahUnggahEvidence === 'number') {
    bagian2.push(
      `Sebanyak ${input.sudahUnggahEvidence} dari ${input.totalPeserta} peserta telah mengunggah dokumen bukti`
    );
  }
  const knd = input.kendalaTemaCount ?? 0;
  const waw = input.wawancaraTemaCount ?? 0;
  if (knd > 0 || waw > 0) {
    bagian2.push(
      `rekomendasi ini turut mempertimbangkan ${knd} tema kendala survei dan ${waw} tema catatan evaluator`
    );
  }

  if (bagian2.length === 0) return kalimat1;
  return `${kalimat1} ${bagian2.join(', dan ')}.`;
}
