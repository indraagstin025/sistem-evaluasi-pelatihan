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
    slideNumber: 'Slide 5',
    slideTitle:
      'Perbandingan Capaian Jangka Menengah dengan Jangka Panjang (Hasil wawancara)',
    subtitle:
      'Perbandingan capaian jangka menengah dengan jangka panjang (Hasil wawancara)',
    labelOrange: 'Jangka panjang',
    labelBlue: 'Jangka menengah',
  },
  {
    key: 'grafik2',
    slideNumber: 'Slide 6',
    slideTitle: 'Target Aksi Perubahan Dalam Jangka Panjang Tercapai',
    subtitle: 'Target Aksi Perubahan dalam jangka panjang tercapai',
    labelOrange: 'Nilai Wawancara',
    labelBlue: 'Nilai Survey',
  },
  {
    key: 'grafik3',
    slideNumber: 'Slide 7',
    slideTitle: 'Seluruh Tujuan Aksi Perubahan Dapat Tercapai',
    subtitle: 'Seluruh tujuan Aksi Perubahan dapat tercapai',
    labelOrange: 'Nilai Wawancara',
    labelBlue: 'Nilai Survey',
  },
  {
    key: 'grafik4',
    slideNumber: 'Slide 8',
    slideTitle: 'Manfaat Aksi Perubahan',
    subtitle: 'Manfaat Aksi Perubahan',
    labelOrange: 'Nilai Wawancara',
    labelBlue: 'Nilai Survey',
  },
  {
    key: 'grafik5',
    slideNumber: 'Slide 9',
    slideTitle: 'Nilai Keseluruhan',
    subtitle: 'Nilai Keseluruhan',
    labelOrange: 'Nilai Wawancara',
    labelBlue: 'Nilai Survey',
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
