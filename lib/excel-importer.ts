import * as XLSX from 'xlsx';
import { prisma } from './prisma';
import { konversiSkorLikert } from './hitung';
import { parseJawabanSheetRows, type ParsedJawabanRow } from './excel-survey-parser';
import {
  buildFormPenilaianLookup,
  normalisasiNama,
  parseAngkaExcel as parseNum,
  tentukanSumberKomunikasi,
} from './import-komunikasi';
import {
  hapusDataPesertaKegiatan,
  simpanBatchPesertaDenganDetail,
  type PesertaDetailInput,
  type SelisihImportInput,
} from './peserta-db';
import {
  bagiTimDariExcelAtauAuto,
  type GeneratedEvaluatorSummary,
} from './pembagian-tim';

export function detectWorkbookType(wb: XLSX.WorkBook): 'olah_data' | 'form_penilaian' | 'unknown' {
  const sheetNames = wb.SheetNames.map((s) => s.trim().toLowerCase());
  if (
    sheetNames.includes('jawaban') ||
    sheetNames.includes('olahdata') ||
    sheetNames.includes('ekspose')
  ) {
    return 'olah_data';
  }
  const numberedSheets = wb.SheetNames.filter((s) => /^\d+\.\s*(.+)$/.test(s.trim()));
  if (numberedSheets.length >= 3) {
    return 'form_penilaian';
  }
  return 'unknown';
}

function extractAngkatanTahun(
  primaryWb: XLSX.WorkBook,
  secondaryWb: XLSX.WorkBook | null,
  kegiatanNama: string,
  tanggalMulai: Date
): { angkatan: string | null; tahun: number | null } {
  let angkatan: string | null = null;
  let tahun: number | null = null;

  // 1. Dari sheet "Informasi Umum" di Olah Data
  const infoSheetName = primaryWb.SheetNames.find(
    (s) => s.trim().toLowerCase() === 'informasi umum'
  );
  if (infoSheetName) {
    const rows: any[][] = XLSX.utils.sheet_to_json(primaryWb.Sheets[infoSheetName], {
      header: 1,
      defval: '',
    });
    for (const r of rows.slice(0, 15)) {
      const joined = r.map((c) => String(c || '').trim()).filter(Boolean).join(' ');
      if (!joined) continue;
      if (!angkatan) {
        const mAng = joined.match(/angkatan\s*[:\-]?\s*([A-Za-z0-9]+)/i);
        if (mAng && mAng[1]) angkatan = mAng[1].toUpperCase();
      }
      if (!tahun) {
        const mThn = joined.match(/\b(20\d{2})\b/);
        if (mThn) tahun = Number(mThn[1]);
      }
    }
  }

  // 2. Dari header formulir pertama di Form Penilaian (mis. "... PKP ANGKATAN VII TAHUN 2023 ...")
  if (secondaryWb) {
    const numbered = secondaryWb.SheetNames.find((s) => /^\d+\.\s*(.+)$/.test(s.trim()));
    if (numbered) {
      const rows: any[][] = XLSX.utils.sheet_to_json(secondaryWb.Sheets[numbered], {
        header: 1,
        defval: '',
      });
      for (const r of rows.slice(0, 12)) {
        const joined = r.map((c) => String(c || '').trim()).filter(Boolean).join(' ');
        if (!joined) continue;
        if (!angkatan) {
          const mAng = joined.match(/angkatan\s+([A-Za-z0-9]+)/i);
          if (mAng && mAng[1]) angkatan = mAng[1].toUpperCase();
        }
        if (!tahun) {
          const mThn = joined.match(/tahun\s+(20\d{2})/i);
          if (mThn) tahun = Number(mThn[1]);
        }
      }
    }
  }

  // 3. Fallback dari nama / tahun kegiatan aktif
  if (!angkatan) {
    const mAng = kegiatanNama.match(/angkatan\s+([A-Za-z0-9]+)/i);
    if (mAng && mAng[1]) angkatan = mAng[1].toUpperCase();
  }
  if (!tahun && !Number.isNaN(tanggalMulai.getTime())) {
    tahun = tanggalMulai.getFullYear();
  }

  return { angkatan, tahun };
}

function findHeaderColIndex(
  headerRow: any[],
  keywords: string[],
  fallbackIdx: number,
  fromIdx = 0
): number {
  for (let c = fromIdx; c < headerRow.length; c++) {
    const text = String(headerRow[c] ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (keywords.some((kw) => text.includes(kw))) {
      return c;
    }
  }
  return fallbackIdx;
}

export interface ExecuteImportParams {
  kegiatanId: string;
  primaryBuffer: Buffer;
  primaryFilename: string;
  secondaryBuffer?: Buffer | null;
  mode?: 'replace' | 'append';
}

export interface ExecuteImportResult {
  ok: true;
  importedCount: number;
  selisihCount: number;
  pesertaBerselisih: number;
  timResult: {
    teamCount: number;
    totalPeserta: number;
    mode: string;
  };
  evaluatorAccounts: GeneratedEvaluatorSummary[];
  hasFormPenilaian: boolean;
  message: string;
}

/**
 * Mengimpor pasangan berkas Olah Data & Form Penilaian ke dalam 1 Kegiatan.
 * Menegakkan keputusan IT-01 (sumber nilai wawancara dari Form Penilaian + catat selisih vs ekspose)
 * serta membaca seluruh kuesioner Alumni & Atasan (OlahData / OlahData2).
 */
export async function executeExcelImport(
  params: ExecuteImportParams
): Promise<ExecuteImportResult | { ok: false; status: number; error: string }> {
  const { kegiatanId, primaryBuffer, primaryFilename, secondaryBuffer, mode = 'replace' } = params;

  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id: kegiatanId },
    select: { id: true, nama: true, jenisPelatihan: true, tanggalMulai: true },
  });
  if (!kegiatan) {
    return { ok: false, status: 404, error: 'Kegiatan tidak ditemukan.' };
  }

  let primaryWb = XLSX.read(primaryBuffer, { type: 'buffer' });
  let primaryType = detectWorkbookType(primaryWb);
  let secondaryWb = secondaryBuffer ? XLSX.read(secondaryBuffer, { type: 'buffer' }) : null;
  let secondaryType = secondaryWb ? detectWorkbookType(secondaryWb) : null;

  if (secondaryWb) {
    if (primaryType === 'olah_data' && secondaryType === 'olah_data') {
      return {
        ok: false,
        status: 400,
        error:
          'Kedua file terdeteksi sebagai Olah Data Survei. Lampirkan satu Olah Data dan satu Form Penilaian Wawancara.',
      };
    }
    if (primaryType === 'form_penilaian' && secondaryType === 'form_penilaian') {
      return {
        ok: false,
        status: 400,
        error:
          'Kedua file terdeteksi sebagai Form Penilaian Wawancara. Berkas Olah Data Survei wajib dilampirkan.',
      };
    }
    if (primaryType === 'form_penilaian' && secondaryType === 'olah_data') {
      const tmpWb = primaryWb;
      const tmpType = primaryType;
      primaryWb = secondaryWb;
      primaryType = secondaryType;
      secondaryWb = tmpWb;
      secondaryType = tmpType;
    }
  } else if (primaryType === 'form_penilaian') {
    return {
      ok: false,
      status: 400,
      error: 'File Olah Data Survei belum dilampirkan. Unggah Olah Data bersama Form Penilaian.',
    };
  }

  const { angkatan: defaultAngkatan, tahun: defaultTahun } = extractAngkatanTahun(
    primaryWb,
    secondaryWb,
    kegiatan.nama,
    kegiatan.tanggalMulai
  );

  const formLookup = buildFormPenilaianLookup(secondaryWb);
  const hasFormSheets = formLookup.hasFormPenilaianSheets;

  // Lookup metadata dari Data Peserta, Jawaban (Alumni + Atasan), dan Data
  const metaMap: Record<
    string,
    {
      jabatanSaatIni: string | null;
      jabatanPelatihan: string | null;
      instansiPelatihan: string | null;
      instansi: string | null;
      angkatan?: string | null;
      metode?: string;
      jawabanRow?: ParsedJawabanRow;
    }
  > = {};

  const mergeMeta = (
    nama: string,
    nip: string | null | undefined,
    patch: {
      jabatanSaatIni?: string | null;
      jabatanPelatihan?: string | null;
      instansiPelatihan?: string | null;
      instansi?: string | null;
      angkatan?: string | null;
      metode?: string;
      jawabanRow?: ParsedJawabanRow;
    },
    overwrite: boolean
  ) => {
    const cleanNip = nip ? String(nip).replace(/[^0-9]/g, '') : '';
    const cleanNama = nama.toLowerCase().trim();
    const apply = (prev?: (typeof metaMap)[string]) => {
      const base = prev || {
        jabatanSaatIni: null,
        jabatanPelatihan: null,
        instansiPelatihan: null,
        instansi: null,
      };
      return {
        jabatanSaatIni: overwrite
          ? patch.jabatanSaatIni || base.jabatanSaatIni
          : base.jabatanSaatIni || patch.jabatanSaatIni || null,
        jabatanPelatihan: overwrite
          ? patch.jabatanPelatihan || base.jabatanPelatihan
          : base.jabatanPelatihan || patch.jabatanPelatihan || null,
        instansiPelatihan: overwrite
          ? patch.instansiPelatihan || base.instansiPelatihan
          : base.instansiPelatihan || patch.instansiPelatihan || null,
        instansi: overwrite
          ? patch.instansi || base.instansi
          : base.instansi || patch.instansi || null,
        angkatan: patch.angkatan || base.angkatan || null,
        metode: patch.metode || base.metode,
        jawabanRow: patch.jawabanRow || base.jawabanRow,
      };
    };
    if (cleanNip) metaMap[cleanNip] = apply(metaMap[cleanNip]);
    if (cleanNama) metaMap[cleanNama] = apply(metaMap[cleanNama]);
  };

  const sheetDataPesertaName = primaryWb.SheetNames.find(
    (s) => s.trim().toLowerCase() === 'data peserta'
  );
  if (sheetDataPesertaName) {
    const rows: any[][] = XLSX.utils.sheet_to_json(primaryWb.Sheets[sheetDataPesertaName], {
      header: 1,
    });
    const dpHeader = rows[0] || [];
    const angCol = findHeaderColIndex(dpHeader, ['angkatan'], 0);
    const namaCol = findHeaderColIndex(dpHeader, ['nama peserta', 'nama'], 1);
    const jabCol = findHeaderColIndex(dpHeader, ['jabatan'], 2);
    const instCol = findHeaderColIndex(dpHeader, ['instansi'], 3);

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[namaCol]) continue;
      const parts = String(r[namaCol])
        .trim()
        .split('|')
        .map((p) => p.trim());
      const rowAngkatan = r[angCol] !== undefined && r[angCol] !== '' ? String(r[angCol]).trim() : null;
      mergeMeta(
        parts[0],
        parts[1],
        {
          angkatan: rowAngkatan,
          jabatanSaatIni: r[jabCol] ? String(r[jabCol]).trim() : null,
          jabatanPelatihan: r[jabCol] ? String(r[jabCol]).trim() : null,
          instansiPelatihan: r[instCol] ? String(r[instCol]).trim() : null,
          instansi: r[instCol] ? String(r[instCol]).trim() : null,
        },
        false
      );
    }
  }

  const sheetJawabanName = primaryWb.SheetNames.find((s) => s.trim().toLowerCase() === 'jawaban');
  if (sheetJawabanName) {
    const rows: any[][] = XLSX.utils.sheet_to_json(primaryWb.Sheets[sheetJawabanName], {
      header: 1,
      defval: '',
    });
    const parsedJawaban = parseJawabanSheetRows(rows);
    for (const jRow of parsedJawaban) {
      mergeMeta(
        jRow.nama,
        jRow.nip,
        {
          jabatanSaatIni: jRow.jabatanSaatIni || jRow.jabatanPelatihan,
          jabatanPelatihan: jRow.jabatanPelatihan,
          instansi: jRow.instansi,
          metode: jRow.metode,
          jawabanRow: jRow,
        },
        true
      );
    }
  }

  // Sheet "data" berada pada workbook Form Penilaian (secondaryWb) atau fallback di primaryWb
  for (const wbCandidate of [secondaryWb, primaryWb]) {
    if (!wbCandidate) continue;
    const sheetDataName = wbCandidate.SheetNames.find((s) => s.trim().toLowerCase() === 'data');
    if (!sheetDataName) continue;

    const rows: any[][] = XLSX.utils.sheet_to_json(wbCandidate.Sheets[sheetDataName], {
      header: 1,
      defval: '',
    });
    const dHeader = rows[0] || [];
    const namaCol = findHeaderColIndex(dHeader, ['nama'], 0);
    const jabPelCol = findHeaderColIndex(dHeader, ['jabatan saat pelatihan'], 2);
    const instPelCol = findHeaderColIndex(dHeader, ['instansi saat pelatihan'], 3);
    const jabSurvCol = findHeaderColIndex(dHeader, ['jabatan saat survey', 'jabatan saat ini'], 7);
    const instSurvCol = findHeaderColIndex(dHeader, ['instansi saat survey', 'instansi saat ini'], 8);

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[namaCol]) continue;
      const parts = String(r[namaCol])
        .trim()
        .split('|')
        .map((p) => p.trim());
      mergeMeta(
        parts[0],
        parts[1],
        {
          jabatanPelatihan: r[jabPelCol] ? String(r[jabPelCol]).trim() : null,
          instansiPelatihan: r[instPelCol] ? String(r[instPelCol]).trim() : null,
          jabatanSaatIni: r[jabSurvCol] ? String(r[jabSurvCol]).trim() : null,
          instansi: r[instSurvCol]
            ? String(r[instSurvCol]).trim()
            : r[instPelCol]
              ? String(r[instPelCol]).trim()
              : null,
        },
        true
      );
    }
  }

  if (mode === 'replace') {
    await hapusDataPesertaKegiatan(kegiatanId, true);
  }

  const eksposeSheetName = primaryWb.SheetNames.find((s) => s.trim().toLowerCase() === 'ekspose');
  const batchItems: PesertaDetailInput[] = [];
  let selisihTotalCount = 0;
  let pesertaBerselisihCount = 0;

  if (eksposeSheetName) {
    const rows: any[][] = XLSX.utils.sheet_to_json(primaryWb.Sheets[eksposeSheetName], {
      header: 1,
    });
    const expHeader = rows[0] || [];
    const expNamaCol = findHeaderColIndex(expHeader, ['nama peserta', 'nama'], 0);
    const expMenCol = findHeaderColIndex(expHeader, ['jangka menengah'], 1);
    const sPanjangCol = findHeaderColIndex(expHeader, ['jangka panjang'], 2);
    const expPanCol = findHeaderColIndex(expHeader, ['nilai wawancara'], sPanjangCol + 2, sPanjangCol + 1);
    const sTujuanCol = findHeaderColIndex(expHeader, ['seluruh tujuan'], 5);
    const expTujCol = findHeaderColIndex(expHeader, ['nilai wawancara'], sTujuanCol + 2, sTujuanCol + 1);
    const sManfaatCol = findHeaderColIndex(expHeader, ['manfaat'], 8);
    const expManCol = findHeaderColIndex(expHeader, ['nilai wawancara'], sManfaatCol + 2, sManfaatCol + 1);
    const expTimCol = findHeaderColIndex(expHeader, ['nama tim', 'tim evaluator', 'evaluator'], 13);

    const eksposeFirstNameCount: Record<string, number> = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[expNamaCol] || String(row[expNamaCol]).trim() === '') continue;
      const rawNama = String(row[expNamaCol]).trim();
      if (rawNama.toLowerCase().startsWith('rentang') || rawNama.toLowerCase().startsWith('total')) {
        break;
      }
      const firstName = normalisasiNama(rawNama.split('|')[0] || '').split(' ')[0] || '';
      if (firstName) {
        eksposeFirstNameCount[firstName] = (eksposeFirstNameCount[firstName] ?? 0) + 1;
      }
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[expNamaCol] || String(row[expNamaCol]).trim() === '') continue;

      const rawNama = String(row[expNamaCol]).trim();
      if (rawNama.toLowerCase().startsWith('rentang') || rawNama.toLowerCase().startsWith('total')) {
        break;
      }

      const parts = rawNama.split('|').map((p) => p.trim());
      const nama = parts[0];
      const nip = parts.length > 1 ? parts[1] : null;
      const cleanNip = nip ? nip.replace(/[^0-9]/g, '') : '';
      const meta = (cleanNip ? metaMap[cleanNip] : null) || metaMap[nama.toLowerCase().trim()];
      const formEntry = formLookup.cariPeserta(nama, batchItems.length, eksposeFirstNameCount);

      const expMen = parseNum(row[expMenCol]);
      const expPan = parseNum(row[expPanCol]);
      const expTuj = parseNum(row[expTujCol]);
      const expMan = parseNum(row[expManCol]);
      const namaTimExcel = row[expTimCol] ? String(row[expTimCol]).trim() : null;

      // IT-01: Jika Form Penilaian dilampirkan, nilai wawancara memakai Form Penilaian
      // dan setiap selisih terhadap sheet ekspose dicatat ke SelisihImport.
      const w_menengah = hasFormSheets && formEntry ? formEntry.nilai.menengah : expMen;
      const w_panjang = hasFormSheets && formEntry ? formEntry.nilai.jangkaPanjang : expPan;
      const w_tujuan = hasFormSheets && formEntry ? formEntry.nilai.seluruhTujuan : expTuj;
      const w_manfaat = hasFormSheets && formEntry ? formEntry.nilai.manfaat : expMan;
      const w_komunikasi = hasFormSheets && formEntry ? formEntry.nilai.komunikasi : null;

      const selisihList: SelisihImportInput[] = [];
      if (hasFormSheets && formEntry) {
        const checks: Array<{ key: string; formVal: number | null; expVal: number | null }> = [
          { key: 'menengah', formVal: formEntry.nilai.menengah, expVal: expMen },
          { key: 'jangkaPanjang', formVal: formEntry.nilai.jangkaPanjang, expVal: expPan },
          { key: 'seluruhTujuan', formVal: formEntry.nilai.seluruhTujuan, expVal: expTuj },
          { key: 'manfaat', formVal: formEntry.nilai.manfaat, expVal: expMan },
        ];
        for (const c of checks) {
          if (c.formVal !== c.expVal) {
            selisihList.push({
              kriteria: c.key,
              nilaiForm: c.formVal,
              nilaiEkspose: c.expVal,
              catatan: `Form Penilaian (${c.formVal ?? 'KOSONG'}) berbeda dengan lembar ekspose (${c.expVal ?? 'KOSONG'})`,
            });
          }
        }
      }

      if (selisihList.length > 0) {
        pesertaBerselisihCount++;
        selisihTotalCount += selisihList.length;
      }

      batchItems.push({
        kegiatanId,
        nama,
        nip: nip || formEntry?.nipDariHeader || null,
        jabatanPelatihan: meta?.jabatanPelatihan || formEntry?.jabatanPelatihan || null,
        instansiPelatihan: meta?.instansiPelatihan || formEntry?.instansiPelatihan || null,
        jabatanSaatIni: meta?.jabatanSaatIni || formEntry?.jabatanSaatSurvey || meta?.jabatanPelatihan || null,
        instansi: meta?.instansi || formEntry?.instansiSaatSurvey || meta?.instansiPelatihan || formEntry?.instansiPelatihan || null,
        pelatihan: kegiatan.jenisPelatihan,
        angkatan: meta?.angkatan || defaultAngkatan || '-',
        tahun: defaultTahun ?? kegiatan.tanggalMulai.getFullYear(),
        metode: meta?.metode,
        judulAksiPerubahan: formEntry?.judulAksiPerubahan || null,
        periodeMenengah: formEntry?.periodeMenengah || null,
        periodePanjang: formEntry?.periodePanjang || null,
        namaTimExcel,
        namaAtasan: meta?.jawabanRow?.namaAtasan || null,
        jabatanAtasan: meta?.jawabanRow?.jabatanAtasan || null,
        instansiAtasan: meta?.jawabanRow?.instansiAtasan || null,
        lockedImport: true,
        sumber: hasFormSheets ? 'Form' : 'Ekspose',
        sumberSurvey: 'Ekspose',
        sumberWawancara: hasFormSheets && formEntry ? 'Form' : 'Ekspose',
        sumberKomunikasi: tentukanSumberKomunikasi(w_komunikasi, hasFormSheets),
        l4JawabanTeks: meta?.jawabanRow?.l4JawabanTeks,
        tambahanSurvey: meta?.jawabanRow?.surveyItems,
        wawancaraDeskripsi: formEntry?.deskripsi,
        selisihImport: selisihList,
        s_panjang: parseNum(row[sPanjangCol]),
        s_tujuan: parseNum(row[sTujuanCol]),
        s_manfaat: parseNum(row[sManfaatCol]),
        w_menengah,
        w_panjang,
        w_tujuan,
        w_manfaat,
        w_komunikasi,
      });
    }
  } else {
    // Fallback format tabular generik
    const firstSheet = primaryWb.Sheets[primaryWb.SheetNames[0]];
    const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

    for (const item of rawJson) {
      const findVal = (...keys: string[]) => {
        for (const k of Object.keys(item)) {
          const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const target of keys) {
            const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (clean === cleanTarget || clean.includes(cleanTarget)) return item[k];
          }
        }
        return null;
      };

      const nama = findVal('nama', 'peserta', 'namapeserta');
      if (!nama || String(nama).trim() === '') continue;

      const nipVal = findVal('nip');
      const nip = nipVal ? String(nipVal).trim() : null;
      const cleanNip = nip ? nip.replace(/[^0-9]/g, '') : '';
      const meta = (cleanNip ? metaMap[cleanNip] : null) || metaMap[String(nama).toLowerCase().trim()];
      const rowJabatan = findVal('jabatanSaatIni', 'jabatansaatini', 'jabatan', 'jabatansurvey');
      const rowInstansi = findVal('instansi', 'namainstansi', 'instansisaatini');
      const rowAngkatan = findVal('angkatan');
      const rowTahun = parseNum(findVal('tahun'));
      const rowMetode = findVal('metode', 'metodepelaksanaan');
      const rowTim = findVal('namatimevaluator', 'namatim', 'tim');
      const w_komunikasi = parseNum(
        findVal('wawancara_teknik_komunikasi', 'wawancara_komunikasi', 'w_komunikasi', 'komunikasi')
      );

      batchItems.push({
        kegiatanId,
        nama: String(nama).trim(),
        nip,
        jabatanSaatIni: rowJabatan ? String(rowJabatan).trim() : meta?.jabatanSaatIni || null,
        instansi: rowInstansi ? String(rowInstansi).trim() : meta?.instansi || null,
        jabatanPelatihan: meta?.jabatanPelatihan || null,
        instansiPelatihan: meta?.instansiPelatihan || null,
        pelatihan: kegiatan.jenisPelatihan,
        angkatan: rowAngkatan ? String(rowAngkatan).trim() : meta?.angkatan || defaultAngkatan || '-',
        tahun: rowTahun ?? defaultTahun ?? kegiatan.tanggalMulai.getFullYear(),
        metode: rowMetode ? String(rowMetode).trim() : meta?.metode,
        namaTimExcel: rowTim ? String(rowTim).trim() : null,
        lockedImport: true,
        sumber: 'Form',
        sumberSurvey: 'Jawaban',
        sumberWawancara: 'Form',
        sumberKomunikasi: tentukanSumberKomunikasi(w_komunikasi, true),
        l4JawabanTeks: meta?.jawabanRow?.l4JawabanTeks,
        tambahanSurvey: meta?.jawabanRow?.surveyItems,
        s_panjang: konversiSkorLikert(findVal('survei_jangka_panjang', 'survei_panjang', 's_panjang', 'l4_01')),
        s_tujuan: konversiSkorLikert(findVal('survei_seluruh_tujuan', 'survei_tujuan', 's_tujuan', 'l4_02')),
        s_manfaat: konversiSkorLikert(findVal('survei_manfaat', 's_manfaat', 'l4_03')),
        w_menengah: parseNum(findVal('wawancara_jangka_menengah', 'wawancara_menengah', 'w_menengah', 'menengah')),
        w_panjang: parseNum(findVal('wawancara_jangka_panjang', 'wawancara_panjang', 'w_panjang')),
        w_tujuan: parseNum(findVal('wawancara_seluruh_tujuan', 'wawancara_tujuan', 'w_tujuan')),
        w_manfaat: parseNum(findVal('wawancara_manfaat', 'w_manfaat')),
        w_komunikasi,
      });
    }
  }

  const importedCount = await simpanBatchPesertaDenganDetail(batchItems);
  const timResult = await bagiTimDariExcelAtauAuto(kegiatanId);
  const createdAccountsCount = timResult.evaluatorAccounts.filter((a) => a.status === 'created').length;

  return {
    ok: true,
    importedCount,
    selisihCount: selisihTotalCount,
    pesertaBerselisih: pesertaBerselisihCount,
    timResult: {
      teamCount: timResult.teamCount,
      totalPeserta: timResult.totalPeserta,
      mode: timResult.mode,
    },
    evaluatorAccounts: timResult.evaluatorAccounts,
    hasFormPenilaian: hasFormSheets,
    message:
      `Berhasil mengimpor ${importedCount} peserta dari ${primaryFilename} ` +
      `(${timResult.teamCount} tim terbentuk` +
      (createdAccountsCount > 0 ? `, ${createdAccountsCount} akun Evaluator dibuat otomatis` : '') +
      ').',
  };
}
