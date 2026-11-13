import { NextResponse } from 'next/server';
import {
  hapusSemuaDataPeserta,
  simpanBatchPesertaDenganDetail,
  type PesertaDetailInput,
} from '@/lib/peserta-db';
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
        { success: false, error: 'Tidak ada berkas yang diunggah.' },
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
        { success: false, error: 'Berkas utama tidak ditemukan.' },
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
            error: 'Kedua berkas yang diunggah terdeteksi sebagai Berkas Survei (Olah Data). Silakan unggah salah satu berkas survei saja, atau lampirkan berkas Form Penilaian Wawancara.'
          },
          { status: 400 }
        );
      }

      // Kasus 2: Dua-duanya adalah Form Penilaian Wawancara
      if (fileType === 'form_penilaian' && formFileType === 'form_penilaian') {
        return NextResponse.json(
          {
            success: false,
            error: 'Kedua berkas yang diunggah terdeteksi sebagai Form Penilaian Wawancara. Sistem membutuhkan berkas Olah Data Survei sebagai data induk peserta.'
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
            error: 'Berkas yang diunggah adalah Form Penilaian Wawancara. Sistem membutuhkan berkas Olah Data Survei sebagai berkas data induk peserta.'
          },
          { status: 400 }
        );
      }
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Berkas Excel / CSV tidak memiliki sheet yang dapat dibaca.' },
        { status: 400 }
      );
    }

    const parseNum = (v: any): number | null => {
      if (v === undefined || v === null || v === '' || v === '#DIV/0!') return null;
      const num = Number(v);
      return isNaN(num) ? null : num;
    };

    // =========================================================================
    // 0. BANGUN LOOKUP TEKNIK KOMUNIKASI DARI FORM PENILAIAN (opsional)
    // =========================================================================
    const komunikasiByNamaDepan: Record<string, number> = {};
    const komunikasiByUrutan: (number | null)[] = [];

    if (formWb) {
      try {
        for (const sheetName of formWb.SheetNames) {
          if (/^(data|deksripsi|evidence)$/i.test(sheetName.trim())) continue;
          const m = sheetName.trim().match(/^\d+\.\s*(.+)$/);
          if (!m) continue;
          const sheet = formWb.Sheets[sheetName];
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          let nilai: number | null = null;
          for (const r of rows) {
            const label = String(r?.[1] ?? '');
            if (!label.toLowerCase().includes('teknik komunikasi')) continue;
            nilai = parseNum(r[5]);
            break;
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
    // 1. BANGUN METADATA LOOKUP DARI SHEET LAIN (Jawaban, Data Peserta, data)
    // =========================================================================
    interface PesertaMeta {
      nama?: string;
      nip?: string;
      jabatanPelatihan?: string;
      jabatanSaatIni?: string;
      instansi?: string;
    }

    const metadataLookup: Record<string, PesertaMeta> = {};

    const registerMeta = (
      namaRaw: string,
      nipRaw: string,
      jabatanSaatIni: string,
      instansi: string,
      jabatanPelatihan: string = '',
      priority: boolean = false
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

    // Scan sheet "Jawaban" (Prioritas Tinggi: Jabatan Saat Ini & Instansi Saat Survey)
    const sheetJawabanName = workbook.SheetNames.find(s => s.trim().toLowerCase() === 'jawaban');
    if (sheetJawabanName) {
      const sheet = workbook.Sheets[sheetJawabanName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
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
        registerMeta(nama, nip, jabatanSaatIni, instansi, jabatanPelatihan, true);
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

        // Komunikasi diambil dari Form Penilaian (H33) bila dilampirkan;
        // bila tidak, null — TotalForm jadi null (jujur kosong) daripada angka salah.
        const w_komunikasi = cariKomunikasi(nama, i - 1);

        batchItems.push({
          nama,
          nip,
          jabatanSaatIni,
          instansi,
          jabatanPelatihan,
          pelatihan: 'PKP',
          angkatan: 'VII',
          tahun: 2023,
          metode: 'Blended Learning',
          sumber: 'Excel (Ekspose)',
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
          pelatihan: 'PKP',
          angkatan: 'VII',
          tahun: 2023,
          metode: 'Blended Learning',
          sumber: 'Impor File',
          s_panjang: parseNum(findVal('survei_jangka_panjang', 'survei_panjang', 's_panjang', 'l4_01')),
          s_tujuan: parseNum(findVal('survei_seluruh_tujuan', 'survei_tujuan', 's_tujuan', 'l4_02')),
          s_manfaat: parseNum(findVal('survei_manfaat', 's_manfaat', 'l4_03')),
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
      message: `Berhasil mengimpor ${importedCount} data peserta lengkap dengan Jabatan Saat Ini dan Instansi dari file ${file.name}.`,
    });
  } catch (error: any) {
    console.error('Error import file Excel/CSV:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses file' },
      { status: 500 }
    );
  }
}
