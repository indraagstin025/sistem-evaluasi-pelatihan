import { NextResponse } from 'next/server';
import {
  hapusSemuaDataPeserta,
  simpanBatchPesertaDenganDetail,
  type PesertaDetailInput,
  type SurveyExtraItem,
} from '@/lib/peserta-db';
import { konversiSkorLikert } from '@/lib/hitung';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getWorkbookType(wb: XLSX.WorkBook): 'olah_data' | 'form_penilaian' | 'unknown' {
  const sheetNames = wb.SheetNames.map(s => s.trim().toLowerCase());
  const hasJawaban = sheetNames.includes('jawaban');
  const hasOlahData = sheetNames.includes('olahdata');
  const hasEkspose = sheetNames.includes('ekspose');
  if (hasJawaban || hasOlahData || hasEkspose) {
    return 'olah_data';
  }

  // Cek apakah memiliki sheet bernomor peserta, misal "1. Ade", "2. Cecep"
  const numberedSheets = wb.SheetNames.filter(s => /^\d+\.\s*(.+)$/.test(s.trim()));
  if (numberedSheets.length >= 3) {
    return 'form_penilaian';
  }

  return 'unknown';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    let file = formData.get('file') as File | null;
    let formFile = formData.get('formFile') as File | null;
    const mode = (formData.get('mode') as string) || 'replace'; // 'replace' atau 'append'

    if (!file && !formFile) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada file yang diunggah.' },
        { status: 400 }
      );
    }

    // Jika hanya formFile yang diunggah tanpa file, jadikan file
    if (!file && formFile) {
      file = formFile;
      formFile = null;
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File utama tidak ditemukan.' },
        { status: 400 }
      );
    }

    let fileBuffer: any = Buffer.from(await file.arrayBuffer());
    let workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    let fileType = getWorkbookType(workbook);

    let formBuffer: any = null;
    let formWb: XLSX.WorkBook | null = null;
    let formFileType: 'olah_data' | 'form_penilaian' | 'unknown' | null = null;

    if (formFile) {
      formBuffer = Buffer.from(await formFile.arrayBuffer());
      formWb = XLSX.read(formBuffer, { type: 'buffer' });
      formFileType = getWorkbookType(formWb);
    }

    // =========================================================================
    // SMART AUTO-DETECTION & AUTO-SWAP:
    // =========================================================================
    if (formFile && formWb) {
      // Kasus 1: Dua-duanya adalah Olah Data Survei
      if (fileType === 'olah_data' && formFileType === 'olah_data') {
        return NextResponse.json(
          {
            success: false,
            error: 'Kedua file yang diunggah terdeteksi sebagai file survei (Olah Data). Unggah satu file survei saja, atau lampirkan Form Penilaian Wawancara.'
          },
          { status: 400 }
        );
      }

      // Kasus 2: Dua-duanya adalah Form Penilaian Wawancara
      if (fileType === 'form_penilaian' && formFileType === 'form_penilaian') {
        return NextResponse.json(
          {
            success: false,
            error: 'Kedua file yang diunggah terdeteksi sebagai Form Penilaian Wawancara. Masih butuh file Olah Data Survei sebagai data utama peserta.'
          },
          { status: 400 }
        );
      }

      // Kasus 3: Terbalik (File adalah Form Penilaian dan formFile adalah Olah Data) -> AUTO-SWAP!
      if (fileType === 'form_penilaian' && formFileType === 'olah_data') {
        const tempBuf = fileBuffer;
        const tempWb = workbook;
        const tempType = fileType;

        fileBuffer = formBuffer!;
        workbook = formWb;
        fileType = formFileType;

        formBuffer = tempBuf;
        formWb = tempWb;
        formFileType = tempType;
      }
    } else {
      // Hanya 1 file yang diunggah
      if (fileType === 'form_penilaian') {
        return NextResponse.json(
          {
            success: false,
            error: 'File yang diunggah adalah Form Penilaian Wawancara. Masih butuh file Olah Data Survei sebagai data utama peserta.'
          },
          { status: 400 }
        );
      }
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { success: false, error: 'File Excel / CSV tidak punya sheet yang bisa dibaca.' },
        { status: 400 }
      );
    }

    const parseNum = (v: any): number | null => {
      if (v === undefined || v === null || v === '' || v === '#DIV/0!') return null;
      const num = Number(v);
      return isNaN(num) ? null : num;
    };

    // =========================================================================
    // 0. BANGUN LOOKUP TEKNIK KOMUNIKASI DARI FORM PENILAIAN (opsional - H33 & J34)
    // =========================================================================
    const komunikasiByNamaDepan: Record<string, number> = {};
    const komunikasiByUrutan: (number | null)[] = [];
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
          let nilai: number | null = parseNum(sheet['H33']?.v);
          void parseNum(sheet['J34']?.v);
          if (nilai === null) {
            const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            for (const r of rows) {
              const label = String(r?.[1] ?? '');
              if (!label.toLowerCase().includes('teknik komunikasi')) continue;
              nilai = parseNum(r[5]);
              break;
            }
          }
          komunikasiByUrutan.push(nilai);
          if (nilai === null) continue;
          komunikasiByNamaDepan[m[1].trim().toLowerCase()] = nilai;
        }
      } catch (e) {
        console.error('Gagal membaca file Form Penilaian:', e);
      }
    }
    const cariKomunikasi = (nama: string, urutanKe: number): number | null => {
      const namaDepan = nama.split(/[\s,]/)[0].toLowerCase();
      if (komunikasiByNamaDepan[namaDepan] !== undefined) {
        return komunikasiByNamaDepan[namaDepan];
      }
      // Fallback urutan: sheet peserta ke-i = baris ekspose ke-i.
      return komunikasiByUrutan[urutanKe] ?? null;
    };

    // =========================================================================
    // 1. BANGUN METADATA & L3 PERILAKU LOOKUP (Jawaban, Data Peserta, data)
    // =========================================================================
    interface L4JawabanTeks {
      L4_01?: string | null;
      L4_02?: string | null;
      L4_03?: string | null;
    }

    interface PesertaMeta {
      nama?: string;
      nip?: string;
      jabatanPelatihan?: string;
      jabatanSaatIni?: string;
      instansi?: string;
      metode?: string;
      l4JawabanTeks?: L4JawabanTeks;
      l3Items?: SurveyExtraItem[];
    }

    const metadataLookup: Record<string, PesertaMeta> = {};

    const registerMeta = (
      namaRaw: string,
      nipRaw: string,
      jabatanSaatIni: string,
      instansi: string,
      jabatanPelatihan: string = '',
      priority: boolean = false,
      extras?: {
        metode?: string;
        l4JawabanTeks?: L4JawabanTeks;
        l3Items?: SurveyExtraItem[];
      }
    ) => {
      const cleanNip = (nipRaw || '').replace(/[^0-9]/g, '').trim();
      const cleanNama = (namaRaw || '').toLowerCase().trim();

      const apply = (existing: PesertaMeta = {}): PesertaMeta => {
        return {
          nama: existing.nama || namaRaw,
          nip: existing.nip || (cleanNip || undefined),
          jabatanSaatIni: priority
            ? (jabatanSaatIni ? String(jabatanSaatIni).trim() : existing.jabatanSaatIni)
            : (existing.jabatanSaatIni || (jabatanSaatIni ? String(jabatanSaatIni).trim() : undefined)),
          instansi: priority
            ? (instansi ? String(instansi).trim() : existing.instansi)
            : (existing.instansi || (instansi ? String(instansi).trim() : undefined)),
          jabatanPelatihan: jabatanPelatihan ? String(jabatanPelatihan).trim() : existing.jabatanPelatihan,
          metode: extras?.metode || existing.metode,
          l4JawabanTeks: extras?.l4JawabanTeks || existing.l4JawabanTeks,
          l3Items: extras?.l3Items && extras.l3Items.length > 0 ? extras.l3Items : existing.l3Items,
        };
      };

      if (cleanNip) {
        metadataLookup[cleanNip] = apply(metadataLookup[cleanNip]);
      }
      if (cleanNama) {
        metadataLookup[cleanNama] = apply(metadataLookup[cleanNama]);
      }
    };

    // Scan sheet "Data Peserta" (Fallback dasar)
    const sheetDataPesertaName = workbook.SheetNames.find(s => s.trim().toLowerCase() === 'data peserta');
    if (sheetDataPesertaName) {
      const sheet = workbook.Sheets[sheetDataPesertaName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[1]) continue;
        const raw = String(r[1]).trim();
        const parts = raw.split('|').map(p => p.trim());
        const nama = parts[0];
        const nip = parts.length > 1 ? parts[1] : '';
        const jabatan = r[2] ? String(r[2]).trim() : '';
        const instansi = r[3] ? String(r[3]).trim() : '';
        registerMeta(nama, nip, jabatan, instansi, jabatan, false);
      }
    }

    // Scan sheet "Jawaban" (Prioritas Tinggi: Jabatan, Instansi, Metode, dan 30 Butir Perilaku L3_01..L3_30)
    const sheetJawabanName = workbook.SheetNames.find(s => s.trim().toLowerCase() === 'jawaban');
    if (sheetJawabanName) {
      const sheet = workbook.Sheets[sheetJawabanName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headerRow = rows[1] || [];
      const hasPerilakuCols =
        String(headerRow[7] ?? '').trim().startsWith('1.') ||
        String(headerRow[36] ?? '').trim().startsWith('30.');

      const strOrNull = (val: any): string | null =>
        val !== undefined && val !== null && String(val).trim() !== ''
          ? String(val).trim()
          : null;

      for (let i = 2; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[1]) continue;
        const raw = String(r[1]).trim();
        const parts = raw.split('|').map(p => p.trim());
        const nama = parts[0];
        const nip = parts.length > 1 ? parts[1] : '';
        const instansi = r[3] ? String(r[3]).trim() : '';
        const jabatanPelatihan = r[4] ? String(r[4]).trim() : '';
        const jabatanSaatIni = r[5] ? String(r[5]).trim() : '';
        const metode = r[6] ? String(r[6]).trim() : undefined;

        const l3Items: SurveyExtraItem[] = [];
        if (hasPerilakuCols) {
          for (let qIdx = 0; qIdx < 30; qIdx++) {
            const rawAns = r[7 + qIdx];
            const jawabanTeks = strOrNull(rawAns);
            const skor = konversiSkorLikert(rawAns);
            if (jawabanTeks === null && skor === null) continue;
            l3Items.push({
              kode: `L3_${String(qIdx + 1).padStart(2, '0')}`,
              responden: 'alumni',
              jawabanTeks,
              skor,
              sumber: 'Jawaban',
            });
          }
        }

        const l4JawabanTeks: L4JawabanTeks = {
          L4_01: strOrNull(r[39]),
          L4_02: strOrNull(r[41]),
          L4_03: strOrNull(r[43]),
        };

        registerMeta(nama, nip, jabatanSaatIni, instansi, jabatanPelatihan, true, {
          metode,
          l4JawabanTeks,
          l3Items,
        });
      }
    }

    // Scan sheet "data" (dari Form Penilaian: Prioritas Tinggi)
    const sheetDataName = workbook.SheetNames.find(s => s.trim().toLowerCase() === 'data');
    if (sheetDataName) {
      const sheet = workbook.Sheets[sheetDataName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[0]) continue;
        const raw = String(r[0]).trim();
        const parts = raw.split('|').map(p => p.trim());
        const nama = parts[0];
        const nip = parts.length > 1 ? parts[1] : '';
        const jabatanPelatihan = r[2] ? String(r[2]).trim() : '';
        const instansiPelatihan = r[3] ? String(r[3]).trim() : '';
        const jabatanSaatSurvey = r[7] ? String(r[7]).trim() : '';
        const instansiSaatSurvey = r[8] ? String(r[8]).trim() : instansiPelatihan;
        registerMeta(nama, nip, jabatanSaatSurvey, instansiSaatSurvey, jabatanPelatihan, true);
      }
    }

    if (mode === 'replace') {
      await hapusSemuaDataPeserta(false);
    }

    // Cek apakah ada sheet khusus bernama "ekspose" (seperti file Olah Data BPSDM)
    const eksposeSheetName = workbook.SheetNames.find(
      (s) => s.trim().toLowerCase() === 'ekspose'
    );

    const batchItems: PesertaDetailInput[] = [];

    if (eksposeSheetName) {
      // =========================================================================
      // 2A. FORMAT RESMI: Sheet "ekspose" dari File Olah Data BPSDM
      // =========================================================================
      const sheet = workbook.Sheets[eksposeSheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[0] || String(row[0]).trim() === '') continue;

        const rawNama = String(row[0]).trim();
        if (rawNama.toLowerCase().startsWith('rentang') || rawNama.toLowerCase().startsWith('total')) {
          break;
        }

        const parts = rawNama.split('|').map((p) => p.trim());
        const nama = parts[0];
        const nip = parts.length > 1 ? parts[1] : null;

        // Cocokkan NIP atau Nama ke Metadata Lookup
        const cleanNip = nip ? nip.replace(/[^0-9]/g, '') : '';
        const cleanNama = nama.toLowerCase().trim();
        const meta = (cleanNip ? metadataLookup[cleanNip] : null) || metadataLookup[cleanNama];

        const jabatanSaatIni = meta?.jabatanSaatIni || meta?.jabatanPelatihan || null;
        const instansi = meta?.instansi || null;
        const jabatanPelatihan = meta?.jabatanPelatihan || null;

        // Komunikasi diambil dari Form Penilaian (sel H33) bila dilampirkan;
        // bila tidak, null — TotalForm jadi null (jujur kosong) daripada angka salah.
        const w_komunikasi = cariKomunikasi(nama, batchItems.length);

        batchItems.push({
          nama,
          nip,
          jabatanSaatIni,
          instansi,
          jabatanPelatihan,
          pelatihan: 'PKP',
          angkatan: 'VII',
          tahun: 2023,
          metode: meta?.metode || 'Blended Learning',
          sumber: 'Ekspose',
          sumberSurvey: 'Ekspose',
          sumberWawancara: 'Ekspose',
          sumberKomunikasi: hasFormPenilaianSheets ? 'Form' : 'Ekspose',
          l4JawabanTeks: meta?.l4JawabanTeks,
          tambahanSurvey: meta?.l3Items,
          s_panjang: parseNum(row[2]),
          s_tujuan: parseNum(row[5]),
          s_manfaat: parseNum(row[8]),
          w_menengah: parseNum(row[1]),
          w_panjang: parseNum(row[4]),
          w_tujuan: parseNum(row[7]),
          w_manfaat: parseNum(row[10]),
          w_komunikasi,
        });
      }
    } else {
      // =========================================================================
      // 2B. FORMAT STANDAR TABULAR (Kolom Header sesuai nama)
      // =========================================================================
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      for (let i = 0; i < rawJson.length; i++) {
        const item = rawJson[i];

        const findVal = (...keys: string[]) => {
          for (const k of Object.keys(item)) {
            const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const target of keys) {
              const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (clean === cleanTarget || clean.includes(cleanTarget)) {
                return item[k];
              }
            }
          }
          return null;
        };

        const nama = findVal('nama', 'peserta', 'namapeserta');
        if (!nama || String(nama).trim() === '') continue;

        const nip = findVal('nip');
        const rowJabatan = findVal('jabatanSaatIni', 'jabatansaatini', 'jabatan', 'jabatansurvey');
        const rowInstansi = findVal('instansi', 'namainstansi', 'instansisaatini');

        // Cocokkan juga ke metadataLookup jika ada
        const cleanNip = nip ? String(nip).replace(/[^0-9]/g, '') : '';
        const cleanNama = String(nama).toLowerCase().trim();
        const meta = (cleanNip ? metadataLookup[cleanNip] : null) || metadataLookup[cleanNama];

        const jabatanSaatIni = rowJabatan ? String(rowJabatan).trim() : (meta?.jabatanSaatIni || meta?.jabatanPelatihan || null);
        const instansi = rowInstansi ? String(rowInstansi).trim() : (meta?.instansi || null);
        const jabatanPelatihan = meta?.jabatanPelatihan || null;

        batchItems.push({
          nama: String(nama).trim(),
          nip: nip ? String(nip).trim() : null,
          jabatanSaatIni,
          instansi,
          jabatanPelatihan,
          pelatihan: findVal('pelatihan') ? String(findVal('pelatihan')).trim() : 'PKP',
          angkatan: findVal('angkatan') ? String(findVal('angkatan')).trim() : 'VII',
          tahun: parseNum(findVal('tahun')) ?? 2023,
          metode: meta?.metode || 'Blended Learning',
          sumber: 'Form',
          sumberSurvey: 'Jawaban',
          sumberWawancara: 'Form',
          sumberKomunikasi: 'Form',
          l4JawabanTeks: meta?.l4JawabanTeks,
          tambahanSurvey: meta?.l3Items,
          s_panjang: konversiSkorLikert(findVal('survei_jangka_panjang', 'survei_panjang', 's_panjang', 'l4_01')),
          s_tujuan: konversiSkorLikert(findVal('survei_seluruh_tujuan', 'survei_tujuan', 's_tujuan', 'l4_02')),
          s_manfaat: konversiSkorLikert(findVal('survei_manfaat', 's_manfaat', 'l4_03')),
          w_menengah: parseNum(findVal('wawancara_jangka_menengah', 'wawancara_menengah', 'w_menengah', 'menengah')),
          w_panjang: parseNum(findVal('wawancara_jangka_panjang', 'wawancara_panjang', 'w_panjang')),
          w_tujuan: parseNum(findVal('wawancara_seluruh_tujuan', 'wawancara_tujuan', 'w_tujuan')),
          w_manfaat: parseNum(findVal('wawancara_manfaat', 'w_manfaat')),
          w_komunikasi: parseNum(findVal('wawancara_teknik_komunikasi', 'wawancara_komunikasi', 'w_komunikasi', 'komunikasi')),
        });
      }
    }

    const importedCount = await simpanBatchPesertaDenganDetail(batchItems);

    return NextResponse.json({
      success: true,
      importedCount,
      message: `Berhasil mengimpor ${importedCount} peserta beserta jabatan dan instansinya dari file ${file.name}.`,
    });
  } catch (error: any) {
    console.error('Error import file Excel/CSV:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses file' },
      { status: 500 }
    );
  }
}
