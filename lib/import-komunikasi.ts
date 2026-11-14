import * as XLSX from 'xlsx';

/**
 * Normalisasi nama peserta / nama sheet agar perbandingan tahan terhadap
 * perbedaan tanda baca, gelar koma, huruf besar/kecil, dan spasi ganda.
 */
export function normalisasiNama(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseAngkaExcel(v: unknown): number | null {
  if (v === undefined || v === null || v === '' || v === '#DIV/0!') return null;
  const num = Number(v);
  return Number.isNaN(num) ? null : num;
}

export function tentukanSumberKomunikasi(
  nilaiKomunikasi: number | null,
  hasFormPenilaianSheets: boolean
): 'Form' | 'Ekspose' | 'Belum Ada' {
  if (nilaiKomunikasi === null) return 'Belum Ada';
  return hasFormPenilaianSheets ? 'Form' : 'Ekspose';
}

interface FormKomunikasiEntry {
  normSheetName: string;
  firstName: string;
  nilai: number | null;
}

export interface FormKomunikasiLookup {
  hasFormPenilaianSheets: boolean;
  cariKomunikasi: (
    nama: string,
    urutanKe: number,
    eksposeFirstNameCount?: Record<string, number>
  ) => number | null;
}

/**
 * Membangun pencocok nilai Teknik Komunikasi dari workbook Form Penilaian (sel H33 / baris Teknik Komunikasi).
 * Urutan prioritas pencocokan (R-3):
 * 1. Nama lengkap ternormalisasi yang unik di Form Penilaian.
 * 2. Awalan nama multi-kata yang unik (menangani batas 31 karakter nama tab Excel).
 * 3. Nama depan yang unik di Form Penilaian sekaligus di sheet Ekspose.
 * 4. Fallback urutan sheet peserta ke-i = baris ekspose ke-i.
 */
export function buildFormKomunikasiLookup(
  formWb: XLSX.WorkBook | null
): FormKomunikasiLookup {
  const formEntries: FormKomunikasiEntry[] = [];
  const komunikasiByUrutan: (number | null)[] = [];
  const formFullNameCount: Record<string, number> = {};
  const formFirstNameCount: Record<string, number> = {};
  let hasFormPenilaianSheets = false;

  if (formWb) {
    try {
      for (const sheetName of formWb.SheetNames) {
        if (/^(data|deksripsi|evidence)$/i.test(sheetName.trim())) continue;
        const m = sheetName.trim().match(/^\d+\.\s*(.+)$/);
        if (!m) continue;
        hasFormPenilaianSheets = true;
        const sheet = formWb.Sheets[sheetName];
        // Prioritaskan sel H33 sesuai URD UR-F-02; sel J34 dibaca sebagai referensi nilai total form
        let nilai: number | null = parseAngkaExcel(sheet['H33']?.v);
        void parseAngkaExcel(sheet['J34']?.v);
        if (nilai === null) {
          const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          for (const r of rows) {
            const label = String(r?.[1] ?? '');
            if (!label.toLowerCase().includes('teknik komunikasi')) continue;
            nilai = parseAngkaExcel(r[5]);
            break;
          }
        }
        const normSheetName = normalisasiNama(m[1]);
        const firstName = normSheetName.split(' ')[0] || '';
        komunikasiByUrutan.push(nilai);
        formEntries.push({ normSheetName, firstName, nilai });
        if (normSheetName) {
          formFullNameCount[normSheetName] = (formFullNameCount[normSheetName] ?? 0) + 1;
        }
        if (firstName) {
          formFirstNameCount[firstName] = (formFirstNameCount[firstName] ?? 0) + 1;
        }
      }
    } catch (e) {
      console.error('Gagal membaca file Form Penilaian:', e);
    }
  }

  const komunikasiByNamaLengkap: Record<string, number> = {};
  const komunikasiByNamaDepan: Record<string, number> = {};
  const multiWordUniqueEntries: Array<{ normSheetName: string; nilai: number }> = [];

  for (const entry of formEntries) {
    if (entry.nilai === null) continue;
    if (entry.normSheetName && formFullNameCount[entry.normSheetName] === 1) {
      komunikasiByNamaLengkap[entry.normSheetName] = entry.nilai;
      if (entry.normSheetName.includes(' ')) {
        multiWordUniqueEntries.push({
          normSheetName: entry.normSheetName,
          nilai: entry.nilai,
        });
      }
    }
    if (entry.firstName && formFirstNameCount[entry.firstName] === 1) {
      komunikasiByNamaDepan[entry.firstName] = entry.nilai;
    }
  }

  const cariKomunikasi = (
    nama: string,
    urutanKe: number,
    eksposeFirstNameCount?: Record<string, number>
  ): number | null => {
    const normNama = normalisasiNama(nama);
    if (normNama && komunikasiByNamaLengkap[normNama] !== undefined) {
      return komunikasiByNamaLengkap[normNama];
    }
    if (normNama) {
      const prefixMatches = multiWordUniqueEntries.filter(
        (e) => normNama === e.normSheetName || normNama.startsWith(`${e.normSheetName} `)
      );
      if (prefixMatches.length === 1) {
        return prefixMatches[0].nilai;
      }
    }
    const namaDepan = normNama.split(' ')[0] || '';
    const isUniqueInEkspose =
      !eksposeFirstNameCount || (eksposeFirstNameCount[namaDepan] ?? 0) <= 1;
    if (namaDepan && isUniqueInEkspose && komunikasiByNamaDepan[namaDepan] !== undefined) {
      return komunikasiByNamaDepan[namaDepan];
    }
    return komunikasiByUrutan[urutanKe] ?? null;
  };

  return {
    hasFormPenilaianSheets,
    cariKomunikasi,
  };
}
