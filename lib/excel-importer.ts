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
import { bagiTimDariExcelAtauAuto } from './pembagian-tim';

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
    select: { id: true, jenisPelatihan: true },
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

  const formLookup = buildFormPenilaianLookup(secondaryWb);
  const hasFormSheets = formLookup.hasFormPenilaianSheets;

  // Lookup metadata dari Data Peserta, Jawaban (Alumni + Atasan), dan Data
  const metaMap: Record<
    string,
    {
      jabatanSaatIni: string | null;
      jabatanPelatihan: string | null;
      instansi: string | null;
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
      instansi?: string | null;
      metode?: string;
      jawabanRow?: ParsedJawabanRow;
    },
    overwrite: boolean
  ) => {
    const cleanNip = nip ? String(nip).replace(/[^0-9]/g, '') : '';
    const cleanNama = nama.toLowerCase().trim();
    const apply = (prev?: (typeof metaMap)[string]) => {
      const base = prev || { jabatanSaatIni: null, jabatanPelatihan: null, instansi: null };
      return {
        jabatanSaatIni: overwrite
          ? patch.jabatanSaatIni || base.jabatanSaatIni
          : base.jabatanSaatIni || patch.jabatanSaatIni || null,
        jabatanPelatihan: overwrite
          ? patch.jabatanPelatihan || base.jabatanPelatihan
          : base.jabatanPelatihan || patch.jabatanPelatihan || null,
        instansi: overwrite
          ? patch.instansi || base.instansi
          : base.instansi || patch.instansi || null,
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
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[1]) continue;
      const parts = String(r[1])
        .trim()
        .split('|')
        .map((p) => p.trim());
      mergeMeta(
        parts[0],
        parts[1],
        {
          jabatanSaatIni: r[2] ? String(r[2]).trim() : null,
          jabatanPelatihan: r[2] ? String(r[2]).trim() : null,
          instansi: r[3] ? String(r[3]).trim() : null,
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

  const sheetDataName = primaryWb.SheetNames.find((s) => s.trim().toLowerCase() === 'data');
  if (sheetDataName) {
    const rows: any[][] = XLSX.utils.sheet_to_json(primaryWb.Sheets[sheetDataName], { header: 1 });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;
      const parts = String(r[0])
        .trim()
        .split('|')
        .map((p) => p.trim());
      mergeMeta(
        parts[0],
        parts[1],
        {
          jabatanPelatihan: r[2] ? String(r[2]).trim() : null,
          jabatanSaatIni: r[7] ? String(r[7]).trim() : null,
          instansi: r[8] ? String(r[8]).trim() : r[3] ? String(r[3]).trim() : null,
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

    const eksposeFirstNameCount: Record<string, number> = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0] || String(row[0]).trim() === '') continue;
      const rawNama = String(row[0]).trim();
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
      if (!row || !row[0] || String(row[0]).trim() === '') continue;

      const rawNama = String(row[0]).trim();
      if (rawNama.toLowerCase().startsWith('rentang') || rawNama.toLowerCase().startsWith('total')) {
        break;
      }

      const parts = rawNama.split('|').map((p) => p.trim());
      const nama = parts[0];
      const nip = parts.length > 1 ? parts[1] : null;
      const cleanNip = nip ? nip.replace(/[^0-9]/g, '') : '';
      const meta = (cleanNip ? metaMap[cleanNip] : null) || metaMap[nama.toLowerCase().trim()];
      const formEntry = formLookup.cariPeserta(nama, batchItems.length, eksposeFirstNameCount);

      const expMen = parseNum(row[1]);
      const expPan = parseNum(row[4]);
      const expTuj = parseNum(row[7]);
      const expMan = parseNum(row[10]);
      const namaTimExcel = row[13] ? String(row[13]).trim() : null;

      // IT-01 Interim: Jika Form Penilaian dilampirkan, nilai wawancara memakai Form Penilaian
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
        instansiPelatihan: formEntry?.instansiPelatihan || null,
        jabatanSaatIni: meta?.jabatanSaatIni || formEntry?.jabatanSaatSurvey || meta?.jabatanPelatihan || null,
        instansi: meta?.instansi || formEntry?.instansiSaatSurvey || formEntry?.instansiPelatihan || null,
        pelatihan: kegiatan.jenisPelatihan,
        angkatan: 'VII',
        tahun: 2023,
        metode: meta?.metode || 'Blended Learning',
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
        s_panjang: parseNum(row[2]),
        s_tujuan: parseNum(row[5]),
        s_manfaat: parseNum(row[8]),
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
        pelatihan: kegiatan.jenisPelatihan,
        metode: meta?.metode || 'Blended Learning',
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
    hasFormPenilaian: hasFormSheets,
    message: `Berhasil mengimpor ${importedCount} peserta dari ${primaryFilename} (${timResult.teamCount} tim terbentuk).`,
  };
}
