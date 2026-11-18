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

export interface FormPesertaEntry {
  normSheetName: string;
  firstName: string;
  namaDariHeader: string | null;
  nipDariHeader: string | null;
  judulAksiPerubahan: string | null;
  jabatanPelatihan: string | null;
  instansiPelatihan: string | null;
  periodeMenengah: string | null;
  periodePanjang: string | null;
  jabatanSaatSurvey: string | null;
  instansiSaatSurvey: string | null;
  nilai: {
    menengah: number | null;
    jangkaPanjang: number | null;
    seluruhTujuan: number | null;
    manfaat: number | null;
    komunikasi: number | null;
  };
  deskripsi: {
    menengah: string | null;
    jangkaPanjang: string | null;
    seluruhTujuan: string | null;
    manfaat: string | null;
    komunikasi: string | null;
  };
}

export interface FormPenilaianLookup {
  hasFormPenilaianSheets: boolean;
  cariPeserta: (
    nama: string,
    urutanKe: number,
    eksposeFirstNameCount?: Record<string, number>
  ) => FormPesertaEntry | null;
  cariKomunikasi: (
    nama: string,
    urutanKe: number,
    eksposeFirstNameCount?: Record<string, number>
  ) => number | null;
}

function getCellString(sheet: XLSX.WorkSheet, rowIdx: number, colIdx: number): string {
  const addr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
  const val = sheet[addr]?.v;
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

function getCellValue(sheet: XLSX.WorkSheet, rowIdx: number, colIdx: number): unknown {
  const addr = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
  return sheet[addr]?.v;
}

function findHeaderValueInRow(sheet: XLSX.WorkSheet, rowIdx: number, maxCols = 12): string | null {
  let foundLabelCol = -1;
  for (let c = 0; c <= maxCols; c++) {
    const val = getCellString(sheet, rowIdx, c);
    if (!val) continue;
    if (foundLabelCol === -1) {
      foundLabelCol = c;
      continue;
    }
    if (val === ':') continue;
    return val;
  }
  return null;
}

function parseSingleFormSheet(sheet: XLSX.WorkSheet, sheetLabel: string): FormPesertaEntry {
  const normSheetName = normalisasiNama(sheetLabel);
  const firstName = normSheetName.split(' ')[0] || '';

  let namaDariHeader: string | null = null;
  let nipDariHeader: string | null = null;
  let judulAksiPerubahan: string | null = null;
  let jabatanPelatihan: string | null = null;
  let instansiPelatihan: string | null = null;
  let periodeMenengah: string | null = null;
  let periodePanjang: string | null = null;
  let jabatanSaatSurvey: string | null = null;
  let instansiSaatSurvey: string | null = null;

  let kriteriaCol = 3; // Default kolom D (index 3)
  let nilaiCol = 7;    // Default kolom H (index 7)
  let deskripsiCol = 8; // Default kolom I (index 8)

  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:L45');
  const maxR = Math.min(range.e.r, 55);
  const maxC = Math.min(range.e.c, 15);

  // Pindai header informasi umum & lokasi kolom tabel form penilaian
  for (let r = 0; r <= maxR; r++) {
    let rowText = '';
    for (let c = 0; c <= Math.min(maxC, 6); c++) {
      const s = getCellString(sheet, r, c);
      if (s) {
        rowText = s.toLowerCase();
        break;
      }
    }

    if (rowText.includes('nama | nip')) {
      const val = findHeaderValueInRow(sheet, r, maxC);
      if (val) {
        const parts = val.split('|').map((p) => p.trim());
        namaDariHeader = parts[0] || null;
        nipDariHeader = parts.length > 1 ? parts[1] : null;
      }
    } else if (rowText.includes('nama aksi perubahan')) {
      judulAksiPerubahan = findHeaderValueInRow(sheet, r, maxC);
    } else if (rowText.includes('jabatan saat mengikuti pelatihan')) {
      jabatanPelatihan = findHeaderValueInRow(sheet, r, maxC);
    } else if (rowText.includes('instansi saat mengikuti pelatihan')) {
      instansiPelatihan = findHeaderValueInRow(sheet, r, maxC);
    } else if (rowText.includes('periode target jangka menengah')) {
      periodeMenengah = findHeaderValueInRow(sheet, r, maxC);
    } else if (rowText.includes('periode target jangka panjang')) {
      periodePanjang = findHeaderValueInRow(sheet, r, maxC);
    } else if (rowText.includes('jabatan saat mengisi survey')) {
      jabatanSaatSurvey = findHeaderValueInRow(sheet, r, maxC);
    } else if (rowText.includes('instansi saat mengisi survey')) {
      instansiSaatSurvey = findHeaderValueInRow(sheet, r, maxC);
    }

    // Temukan baris header tabel penilaian ("Kriteria" + "Nilai" + "Deskripsi")
    for (let c = 0; c <= maxC; c++) {
      const cellLower = getCellString(sheet, r, c).toLowerCase();
      if (cellLower === 'kriteria') kriteriaCol = c;
      else if (cellLower.startsWith('nilai') && !cellLower.includes('akhir') && !cellLower.includes('total')) {
        nilaiCol = c;
      } else if (cellLower === 'deskripsi') {
        deskripsiCol = c;
      }
    }
  }

  const nilai = {
    menengah: null as number | null,
    jangkaPanjang: null as number | null,
    seluruhTujuan: null as number | null,
    manfaat: null as number | null,
    komunikasi: null as number | null,
  };

  const deskripsi = {
    menengah: null as string | null,
    jangkaPanjang: null as string | null,
    seluruhTujuan: null as string | null,
    manfaat: null as string | null,
    komunikasi: null as string | null,
  };

  // Pindai 5 kriteria wawancara berdasarkan kata kunci baris (tahan pergeseran baris & kolom)
  for (let r = 0; r <= maxR; r++) {
    const label = getCellString(sheet, r, kriteriaCol).toLowerCase();
    if (!label) continue;

    // Wajib baca kolom input Nilai (kolom H / nilaiCol), bukan Nilai Akhir (J) agar sel kosong tetap null (KOSONG)
    const rawVal = parseAngkaExcel(getCellValue(sheet, r, nilaiCol));
    const rawDesk = getCellString(sheet, r, deskripsiCol) || null;

    if (label.includes('jangka menengah') && label.includes('target aksi')) {
      nilai.menengah = rawVal;
      deskripsi.menengah = rawDesk;
    } else if (label.includes('jangka panjang') && label.includes('target aksi')) {
      nilai.jangkaPanjang = rawVal;
      deskripsi.jangkaPanjang = rawDesk;
    } else if (label.includes('seluruh tujuan')) {
      nilai.seluruhTujuan = rawVal;
      deskripsi.seluruhTujuan = rawDesk;
    } else if (label.includes('manfaat aksi perubahan')) {
      nilai.manfaat = rawVal;
      deskripsi.manfaat = rawDesk;
    } else if (label.includes('teknik komunikasi')) {
      nilai.komunikasi = rawVal ?? parseAngkaExcel(sheet['H33']?.v);
      deskripsi.komunikasi = rawDesk;
    }
  }

  return {
    normSheetName,
    firstName,
    namaDariHeader,
    nipDariHeader,
    judulAksiPerubahan,
    jabatanPelatihan,
    instansiPelatihan,
    periodeMenengah,
    periodePanjang,
    jabatanSaatSurvey,
    instansiSaatSurvey,
    nilai,
    deskripsi,
  };
}

/**
 * Membangun lookup lengkap Form Penilaian (5 kriteria nilai, deskripsi evaluator,
 * nama/periode aksi perubahan, dan profil pelatihan) untuk dicocokkan per peserta.
 * Urutan prioritas pencocokan (R-3):
 * 1. Nama lengkap ternormalisasi yang unik di Form Penilaian.
 * 2. Awalan nama multi-kata yang unik (menangani batas 31 karakter nama tab Excel).
 * 3. Nama depan yang unik di Form Penilaian sekaligus di sheet Ekspose.
 * 4. Fallback urutan sheet peserta ke-i = baris ekspose ke-i.
 */
export function buildFormPenilaianLookup(
  formWb: XLSX.WorkBook | null
): FormPenilaianLookup {
  const formEntries: FormPesertaEntry[] = [];
  const formFullNameCount: Record<string, number> = {};
  const formFirstNameCount: Record<string, number> = {};
  let hasFormPenilaianSheets = false;

  if (formWb) {
    try {
      for (const sheetName of formWb.SheetNames) {
        if (/^(data|deksripsi|deskripsi|evidence)$/i.test(sheetName.trim())) continue;
        const m = sheetName.trim().match(/^\d+\.\s*(.+)$/);
        if (!m) continue;

        hasFormPenilaianSheets = true;
        const sheet = formWb.Sheets[sheetName];
        const entry = parseSingleFormSheet(sheet, m[1]);
        formEntries.push(entry);

        if (entry.normSheetName) {
          formFullNameCount[entry.normSheetName] =
            (formFullNameCount[entry.normSheetName] ?? 0) + 1;
        }
        if (entry.firstName) {
          formFirstNameCount[entry.firstName] = (formFirstNameCount[entry.firstName] ?? 0) + 1;
        }
      }
    } catch (e) {
      console.error('Gagal membaca file Form Penilaian:', e);
    }
  }

  const byNamaLengkap: Record<string, FormPesertaEntry> = {};
  const byNamaDepan: Record<string, FormPesertaEntry> = {};
  const multiWordUniqueEntries: FormPesertaEntry[] = [];

  for (const entry of formEntries) {
    if (entry.normSheetName && formFullNameCount[entry.normSheetName] === 1) {
      byNamaLengkap[entry.normSheetName] = entry;
      if (entry.normSheetName.includes(' ')) {
        multiWordUniqueEntries.push(entry);
      }
    }
    if (entry.firstName && formFirstNameCount[entry.firstName] === 1) {
      byNamaDepan[entry.firstName] = entry;
    }
  }

  const cariPeserta = (
    nama: string,
    urutanKe: number,
    eksposeFirstNameCount?: Record<string, number>
  ): FormPesertaEntry | null => {
    if (!hasFormPenilaianSheets) return null;
    const normNama = normalisasiNama(nama);

    if (normNama && byNamaLengkap[normNama]) {
      return byNamaLengkap[normNama];
    }
    if (normNama) {
      const prefixMatches = multiWordUniqueEntries.filter(
        (e) => normNama === e.normSheetName || normNama.startsWith(`${e.normSheetName} `)
      );
      if (prefixMatches.length === 1) {
        return prefixMatches[0];
      }
    }
    const namaDepan = normNama.split(' ')[0] || '';
    const isUniqueInEkspose =
      !eksposeFirstNameCount || (eksposeFirstNameCount[namaDepan] ?? 0) <= 1;
    if (namaDepan && isUniqueInEkspose && byNamaDepan[namaDepan]) {
      return byNamaDepan[namaDepan];
    }
    return formEntries[urutanKe] ?? null;
  };

  const cariKomunikasi = (
    nama: string,
    urutanKe: number,
    eksposeFirstNameCount?: Record<string, number>
  ): number | null => {
    return cariPeserta(nama, urutanKe, eksposeFirstNameCount)?.nilai.komunikasi ?? null;
  };

  return {
    hasFormPenilaianSheets,
    cariPeserta,
    cariKomunikasi,
  };
}

/** Alias kompatibilitas untuk pemanggil lama. */
export const buildFormKomunikasiLookup = buildFormPenilaianLookup;
