import { konversiSkorLikert } from './hitung';
import type { SurveyExtraItem } from './peserta-db';

export function getPerilakuSubDimensi(nomor: number): string {
  if (nomor <= 3) return 'Bela Negara';
  if (nomor <= 6) return 'Berorientasi Pelayanan';
  if (nomor <= 9) return 'Akuntabel';
  if (nomor <= 12) return 'Kompeten';
  if (nomor <= 15) return 'Harmonis';
  if (nomor <= 18) return 'Loyal';
  if (nomor <= 21) return 'Adaptif';
  if (nomor <= 24) return 'Kolaboratif';
  return 'Pengendalian Pekerjaan';
}

function cleanStr(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  const s = String(val).replace(/\s+/g, ' ').trim();
  return s === '' ? null : s;
}

export interface ParsedJawabanRow {
  nama: string;
  nip: string | null;
  instansi: string | null;
  jabatanPelatihan: string | null;
  jabatanSaatIni: string | null;
  metode: string | undefined;
  namaAtasan: string | null;
  jabatanAtasan: string | null;
  instansiAtasan: string | null;
  l4JawabanTeks: {
    L4_01: string | null;
    L4_02: string | null;
    L4_03: string | null;
  };
  surveyItems: SurveyExtraItem[];
}

function pushLikertItem(
  out: SurveyExtraItem[],
  responden: 'alumni' | 'atasan',
  kode: string,
  kelompok: string,
  subDimensi: string,
  pertanyaan: string | null,
  rawAnswer: unknown
) {
  const jawabanTeks = cleanStr(rawAnswer);
  const skor = konversiSkorLikert(rawAnswer);
  if (jawabanTeks === null && skor === null) return;
  out.push({
    kode,
    responden,
    kelompok,
    subDimensi,
    pertanyaan,
    jawabanTeks,
    skor,
    sumber: 'Jawaban',
  });
}

function pushOpenTextItem(
  out: SurveyExtraItem[],
  responden: 'alumni' | 'atasan',
  kode: string,
  kelompok: string,
  subDimensi: string,
  pertanyaan: string | null,
  rawText: unknown
) {
  const jawabanTeks = cleanStr(rawText);
  if (!jawabanTeks) return;
  out.push({
    kode,
    responden,
    kelompok,
    subDimensi,
    pertanyaan,
    jawabanTeks,
    skor: null,
    sumber: 'Jawaban',
  });
}

/**
 * Mem-parsing satu baris pada sheet "Jawaban" (Olah Data) menjadi daftar lengkap kuesioner
 * sisi Alumni maupun sisi Atasan Alumni (Perilaku 1-30, Produktivitas, Keberlanjutan, Dukungan, Kendala).
 */
export function parseJawabanSheetRows(rows: any[][]): ParsedJawabanRow[] {
  const results: ParsedJawabanRow[] = [];
  if (rows.length < 3) return results;

  const headerRow = rows[1] || [];
  const hasPerilakuCols =
    String(headerRow[7] ?? '').trim().startsWith('1.') ||
    String(headerRow[36] ?? '').trim().startsWith('30.');

  if (!hasPerilakuCols) return results;

  // Cari batas awal blok Atasan Alumni (kolom "Nama Responden")
  let atasanStartCol = -1;
  for (let c = 50; c < headerRow.length; c++) {
    const h = String(headerRow[c] ?? '').toLowerCase().trim();
    if (h.includes('nama responden')) {
      atasanStartCol = c;
      break;
    }
  }

  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[1]) continue;

    const raw = String(r[1]).trim();
    const parts = raw.split('|').map((p) => p.trim());
    const nama = parts[0];
    if (!nama) continue;

    const nip = parts.length > 1 ? parts[1] : null;
    const instansi = cleanStr(r[3]);
    const jabatanPelatihan = cleanStr(r[4]);
    const jabatanSaatIni = cleanStr(r[5]);
    const metode = cleanStr(r[6]) || undefined;

    const surveyItems: SurveyExtraItem[] = [];

    // 1. SISI ALUMNI (kolom 7..54)
    for (let qIdx = 0; qIdx < 30; qIdx++) {
      const no = qIdx + 1;
      pushLikertItem(
        surveyItems,
        'alumni',
        `L3_${String(no).padStart(2, '0')}`,
        'PERILAKU',
        getPerilakuSubDimensi(no),
        cleanStr(headerRow[7 + qIdx]),
        r[7 + qIdx]
      );
    }

    pushLikertItem(
      surveyItems,
      'alumni',
      'HK_33',
      'HASIL_KONTRIBUSI',
      'Produktivitas',
      cleanStr(headerRow[37]),
      r[37]
    );
    pushLikertItem(
      surveyItems,
      'alumni',
      'HK_34',
      'HASIL_KONTRIBUSI',
      'Produktivitas',
      cleanStr(headerRow[38]),
      r[38]
    );

    const l4JawabanTeks = {
      L4_01: cleanStr(r[39]),
      L4_02: cleanStr(r[41]),
      L4_03: cleanStr(r[43]),
    };

    for (let dIdx = 0; dIdx < 5; dIdx++) {
      pushLikertItem(
        surveyItems,
        'alumni',
        `DUK_${38 + dIdx}`,
        'DUKUNGAN',
        'Faktor Pendukung',
        cleanStr(headerRow[45 + dIdx]),
        r[45 + dIdx]
      );
    }
    pushOpenTextItem(
      surveyItems,
      'alumni',
      'DUK_TEXT',
      'DUKUNGAN',
      'Faktor Pendukung',
      cleanStr(headerRow[50]),
      r[50]
    );

    for (let kIdx = 0; kIdx < 3; kIdx++) {
      pushLikertItem(
        surveyItems,
        'alumni',
        `KND_${43 + kIdx}`,
        'KENDALA',
        'Faktor Penghambat',
        cleanStr(headerRow[51 + kIdx]),
        r[51 + kIdx]
      );
    }
    pushOpenTextItem(
      surveyItems,
      'alumni',
      'KND_TEXT',
      'KENDALA',
      'Faktor Penghambat',
      cleanStr(headerRow[54]),
      r[54]
    );

    // 2. SISI ATASAN ALUMNI (mulai atasanStartCol)
    let namaAtasan: string | null = cleanStr(r[0]);
    let instansiAtasan: string | null = null;
    let jabatanAtasan: string | null = null;

    if (atasanStartCol !== -1) {
      namaAtasan = cleanStr(r[atasanStartCol]) || namaAtasan;
      instansiAtasan = cleanStr(r[atasanStartCol + 1]);
      jabatanAtasan = cleanStr(r[atasanStartCol + 2]);

      // Cari kolom pertama soal 1 perubahan perilaku di blok Atasan (biasanya offset +8 dari Nama Responden)
      let atasanQStart = atasanStartCol + 8;
      for (let probe = atasanStartCol + 3; probe < Math.min(headerRow.length, atasanStartCol + 14); probe++) {
        if (String(headerRow[probe] ?? '').trim().startsWith('1.')) {
          atasanQStart = probe;
          break;
        }
      }

      if (String(headerRow[atasanQStart] ?? '').trim().startsWith('1.')) {
        for (let qIdx = 0; qIdx < 30; qIdx++) {
          const no = qIdx + 1;
          pushLikertItem(
            surveyItems,
            'atasan',
            `L3_${String(no).padStart(2, '0')}`,
            'PERILAKU',
            getPerilakuSubDimensi(no),
            cleanStr(headerRow[atasanQStart + qIdx]),
            r[atasanQStart + qIdx]
          );
        }

        const pOffset = atasanQStart + 30;
        pushLikertItem(
          surveyItems,
          'atasan',
          'HK_33',
          'HASIL_KONTRIBUSI',
          'Produktivitas',
          cleanStr(headerRow[pOffset]),
          r[pOffset]
        );
        pushLikertItem(
          surveyItems,
          'atasan',
          'HK_34',
          'HASIL_KONTRIBUSI',
          'Produktivitas',
          cleanStr(headerRow[pOffset + 1]),
          r[pOffset + 1]
        );

        pushLikertItem(
          surveyItems,
          'atasan',
          'L4_01',
          'HASIL_AKSI',
          'Keberlanjutan Aksi',
          cleanStr(headerRow[pOffset + 2]),
          r[pOffset + 2]
        );
        pushLikertItem(
          surveyItems,
          'atasan',
          'L4_02',
          'HASIL_AKSI',
          'Keberlanjutan Aksi',
          cleanStr(headerRow[pOffset + 3]),
          r[pOffset + 3]
        );
        pushLikertItem(
          surveyItems,
          'atasan',
          'L4_03',
          'HASIL_AKSI',
          'Keberlanjutan Aksi',
          cleanStr(headerRow[pOffset + 4]),
          r[pOffset + 4]
        );

        for (let dIdx = 0; dIdx < 5; dIdx++) {
          pushLikertItem(
            surveyItems,
            'atasan',
            `DUK_${38 + dIdx}`,
            'DUKUNGAN',
            'Faktor Pendukung',
            cleanStr(headerRow[pOffset + 5 + dIdx]),
            r[pOffset + 5 + dIdx]
          );
        }
        pushOpenTextItem(
          surveyItems,
          'atasan',
          'DUK_TEXT',
          'DUKUNGAN',
          'Faktor Pendukung',
          cleanStr(headerRow[pOffset + 10]),
          r[pOffset + 10]
        );

        for (let kIdx = 0; kIdx < 3; kIdx++) {
          pushLikertItem(
            surveyItems,
            'atasan',
            `KND_${43 + kIdx}`,
            'KENDALA',
            'Faktor Penghambat',
            cleanStr(headerRow[pOffset + 11 + kIdx]),
            r[pOffset + 11 + kIdx]
          );
        }
        pushOpenTextItem(
          surveyItems,
          'atasan',
          'KND_TEXT',
          'KENDALA',
          'Faktor Penghambat',
          cleanStr(headerRow[pOffset + 14]),
          r[pOffset + 14]
        );
      }
    }

    results.push({
      nama,
      nip,
      instansi,
      jabatanPelatihan,
      jabatanSaatIni,
      metode,
      namaAtasan,
      jabatanAtasan,
      instansiAtasan,
      l4JawabanTeks,
      surveyItems,
    });
  }

  return results;
}
