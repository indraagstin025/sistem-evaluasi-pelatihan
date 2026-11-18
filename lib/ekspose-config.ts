/**
 * lib/ekspose-config.ts
 * Konfigurasi slide resmi Ekspose (Slide 5-10 BPSDM Jabar) dan helper teks terbagi
 * agar tampilan web `/ekspose` dan generator file `.pptx` selalu sinkron.
 */

export type EksposeGrafikKey = 'grafik1' | 'grafik2' | 'grafik3' | 'grafik4' | 'grafik5';

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
