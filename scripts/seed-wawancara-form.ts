/**
 * scripts/seed-wawancara-form.ts
 * Mengisi hasil formulir wawancara (nilai 5 kriteria, statusKonfirmasi YA/TIDAK,
 * deskripsi bukti wawancara, serta penanda selesai wawancaraSelesaiAt) bagi 29 peserta
 * dari berkas Form Penilaian Excel tanpa mengubah Peserta, Survey, maupun InovasiProper.
 * Peserta yang datanya kosong di Form Penilaian (Timbul, S.E, M.P) dilewati agar tetap KOSONG.
 *
 * Penggunaan:
 *   npm run seed:wawancara
 *   npm run seed:wawancara:reset
 *   npx tsx --env-file=.env scripts/seed-wawancara-form.ts --kegiatanId=<id>
 */

import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { prisma } from '../lib/prisma';
import { hitungHasil } from '../lib/hitung';
import {
  buildFormPenilaianLookup,
  normalisasiNama,
  type FormPesertaEntry,
} from '../lib/import-komunikasi';
import {
  WAWANCARA_KRITERIA,
  type KriteriaWawancaraKey,
  type StatusKonfirmasiWawancara,
} from '../lib/wawancara-kriteria';

const DEFAULT_KEGIATAN_ID = 'cmwozfpia0001qtppcacqte7z';

function cleanDigits(raw: string | null | undefined): string {
  return String(raw || '').replace(/[^0-9]/g, '');
}

function findFormPenilaianPath(): string {
  const rootFiles = fs.readdirSync(process.cwd());
  const found = rootFiles.find(
    (f) => f.toLowerCase().includes('form penilaian') && f.toLowerCase().endsWith('.xlsx')
  );
  if (!found) {
    throw new Error(
      'Berkas Excel "Form Penilaian ... .xlsx" tidak ditemukan di direktori utama proyek.'
    );
  }
  return path.join(process.cwd(), found);
}

function buildExactFormMap(formPath: string): {
  byNip: Map<string, FormPesertaEntry>;
  byNormName: Map<string, FormPesertaEntry>;
  totalSheets: number;
} {
  const wb = XLSX.readFile(formPath);
  const lookup = buildFormPenilaianLookup(wb);
  const numberedSheets = wb.SheetNames.filter((s) => /^\d+\.\s*(.+)$/.test(s.trim()));

  const byNip = new Map<string, FormPesertaEntry>();
  const byNormName = new Map<string, FormPesertaEntry>();

  numberedSheets.forEach((sheetName, idx) => {
    const label = sheetName.trim().replace(/^\d+\.\s*/, '');
    const entry = lookup.cariPeserta(`__INDEX_ONLY__${idx}`, idx);
    const resolved = entry || lookup.cariPeserta(label, idx);
    if (!resolved) return;

    const nip = cleanDigits(resolved.nipDariHeader);
    if (nip) {
      byNip.set(nip, resolved);
    }
    if (resolved.namaDariHeader) {
      byNormName.set(normalisasiNama(resolved.namaDariHeader), resolved);
    }
  });

  return { byNip, byNormName, totalSheets: numberedSheets.length };
}

function isSubstantiveDeskripsi(raw: string | null | undefined): boolean {
  const trimmed = String(raw || '').trim();
  return trimmed.length > 0 && trimmed !== '-' && trimmed.toLowerCase() !== 'test';
}

function buildFallbackDeskripsi(
  kriteria: KriteriaWawancaraKey,
  nilai: number,
  pesertaNama: string
): string {
  const lowerNama = pesertaNama.toLowerCase();

  if (kriteria === 'komunikasi') {
    if (nilai >= 90) {
      return 'Peserta menyampaikan penjelasan dan konfirmasi capaian Aksi Perubahan secara sangat tepat, runtut, dan lengkap.';
    }
    if (nilai >= 80) {
      return 'Peserta menyampaikan penjelasan dan konfirmasi pelaksanaan Aksi Perubahan secara tepat dan lengkap.';
    }
    if (nilai >= 61) {
      return 'Peserta menyampaikan penjelasan pelaksanaan Aksi Perubahan secara cukup tepat selama sesi wawancara.';
    }
    return 'Informasi dan bukti dukung yang disampaikan peserta saat konfirmasi wawancara masih kurang lengkap.';
  }

  if (kriteria === 'seluruhTujuan') {
    if (lowerNama.includes('firman komara')) {
      return '- Sebagian kecil tujuan penyusunan database jembatan tercapai di internal UPT, namun pemanfaatannya beririsan dengan aplikasi sejenis yang sudah ada';
    }
    if (lowerNama.includes('ika atikah')) {
      return '- Sebagian tujuan penataan arsip surat digital (DIPADU) tercapai pada tahap uji coba dan peluncuran awal sebelum peserta mengalami mutasi jabatan';
    }
    if (lowerNama.includes('maman')) {
      return '- Tujuan pengelolaan arsip digital (SIPEA) belum tercapai secara berkelanjutan karena aplikasi versi desktop terhapus saat perangkat di-reset';
    }
    if (nilai >= 90) return '- Seluruh tujuan Aksi Perubahan tercapai dan berjalan efektif di unit kerja';
    if (nilai >= 80) return '- Sebagian besar tujuan Aksi Perubahan telah tercapai dan berjalan cukup efektif';
    if (nilai >= 61) return '- Sebagian tujuan Aksi Perubahan telah tercapai pada lingkup internal unit kerja';
    return '- Tujuan Aksi Perubahan belum tercapai secara berkelanjutan sesuai target rencana awal';
  }

  if (kriteria === 'manfaat') {
    if (lowerNama.includes('deddy safriandi')) {
      return '- Mempermudah transaksi pembayaran retribusi parkir secara nontunai melalui QRIS serta membantu pemantauan penerimaan di lingkungan Dinas Perhubungan';
    }
    if (nilai >= 90) {
      return '- Manfaat Aksi Perubahan dirasakan secara luas oleh Perangkat Daerah dan masyarakat penerima layanan';
    }
    if (nilai >= 80) {
      return '- Manfaat Aksi Perubahan dirasakan lintas bidang dan sebagian masyarakat pengguna layanan';
    }
    if (nilai >= 61) {
      return '- Manfaat Aksi Perubahan dirasakan pada peningkatan efektivitas kerja di lingkungan Perangkat Daerah';
    }
    return '- Manfaat Aksi Perubahan baru dirasakan terbatas di internal unit kerja';
  }

  return nilai >= 61
    ? '- Capaian target terkonfirmasi berjalan sesuai tahapan pada unit kerja'
    : '- Target belum tercapai sesuai rencana tahapan awal';
}

function deriveStatusKonfirmasi(nilai: number): StatusKonfirmasiWawancara {
  return nilai >= 61 ? 'YA' : 'TIDAK';
}

function isEntryCompletelyEmpty(entry: FormPesertaEntry): boolean {
  const { menengah, jangkaPanjang, seluruhTujuan, manfaat, komunikasi } = entry.nilai;
  return (
    menengah === null &&
    jangkaPanjang === null &&
    seluruhTujuan === null &&
    manfaat === null &&
    komunikasi === null
  );
}

async function resolveTargetKegiatanId(argId?: string): Promise<string> {
  if (argId) return argId;

  const exact = await prisma.kegiatan.findUnique({
    where: { id: DEFAULT_KEGIATAN_ID },
    select: { id: true },
  });
  if (exact) return exact.id;

  const first = await prisma.kegiatan.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (!first) {
    throw new Error('Tidak ada Kegiatan di database. Buat kegiatan dan impor peserta terlebih dahulu.');
  }
  return first.id;
}

async function seedWawancaraForm(kegiatanId: string) {
  const formPath = findFormPenilaianPath();
  const { byNip, byNormName, totalSheets } = buildExactFormMap(formPath);

  const [adminUser, pesertaList] = await Promise.all([
    prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', aktif: true },
      select: { id: true, nama: true },
    }),
    prisma.peserta.findMany({
      where: { kegiatanId },
      include: {
        wawancara: true,
        inovasiProper: { select: { id: true, dokumenNama: true } },
        tim: {
          select: {
            id: true,
            namaTim: true,
            evaluatorId: true,
          },
        },
      },
      orderBy: { nama: 'asc' },
    }),
  ]);

  if (pesertaList.length === 0) {
    throw new Error(`Tidak ditemukan peserta pada kegiatan ${kegiatanId}.`);
  }

  let filledParticipants = 0;
  let skippedEmptyParticipants: string[] = [];
  let unmatchedParticipants: string[] = [];
  let markedSelesaiCount = 0;
  let fallbackDeskripsiUsed = 0;

  for (const p of pesertaList) {
    const cleanNip = cleanDigits(p.nip);
    const entry =
      (cleanNip ? byNip.get(cleanNip) : undefined) || byNormName.get(normalisasiNama(p.nama));

    if (!entry) {
      unmatchedParticipants.push(`${p.nama} (${p.nip || 'tanpa NIP'})`);
      continue;
    }

    // Lewati peserta yang di Form Penilaian kosong penuh (mis. Timbul, S.E, M.P)
    if (isEntryCompletelyEmpty(entry)) {
      skippedEmptyParticipants.push(`${p.nama} (${p.nip || '-'})`);
      continue;
    }

    const actorId = p.tim?.evaluatorId || adminUser?.id || null;
    const actorSumber = p.tim?.evaluatorId ? 'Evaluator' : 'Super Admin';

    for (const meta of WAWANCARA_KRITERIA) {
      const key = meta.key;
      const rawNilai = entry.nilai[key];
      if (rawNilai === null || rawNilai === undefined) continue;

      const nilai = Math.round(Number(rawNilai));
      const statusKonfirmasi = deriveStatusKonfirmasi(nilai);
      const excelDesk = entry.deskripsi[key];
      let finalDeskripsi: string;

      if (isSubstantiveDeskripsi(excelDesk)) {
        finalDeskripsi = String(excelDesk).trim();
      } else {
        finalDeskripsi = buildFallbackDeskripsi(key, nilai, p.nama);
        fallbackDeskripsiUsed += 1;
      }

      await prisma.wawancara.upsert({
        where: {
          pesertaId_kriteria: {
            pesertaId: p.id,
            kriteria: key,
          },
        },
        update: {
          nilai,
          bobot: meta.bobot,
          statusKonfirmasi,
          lockedFromImport: false,
          deskripsi: finalDeskripsi,
          sumber: actorSumber,
          updatedById: actorId,
        },
        create: {
          pesertaId: p.id,
          kriteria: key,
          bobot: meta.bobot,
          nilai,
          statusKonfirmasi,
          lockedFromImport: false,
          deskripsi: finalDeskripsi,
          sumber: actorSumber,
          updatedById: actorId,
        },
      });
    }

    if (p.inovasiProper) {
      await prisma.peserta.update({
        where: { id: p.id },
        data: {
          wawancaraSelesaiAt: p.wawancaraSelesaiAt ?? new Date(),
        },
      });
      markedSelesaiCount += 1;
    }

    await hitungHasil(p.id);
    filledParticipants += 1;
  }

  console.log(
    JSON.stringify(
      {
        mode: 'seed',
        kegiatanId,
        formWorkbookSheets: totalSheets,
        totalPesertaDb: pesertaList.length,
        filledParticipants,
        markedSelesaiCount,
        fallbackDeskripsiUsed,
        skippedEmptyParticipants,
        unmatchedParticipants,
      },
      null,
      2
    )
  );
}

async function resetWawancaraForm(kegiatanId: string) {
  const formPath = findFormPenilaianPath();
  const { byNip, byNormName } = buildExactFormMap(formPath);

  const pesertaList = await prisma.peserta.findMany({
    where: { kegiatanId },
    orderBy: { nama: 'asc' },
  });

  let resetCount = 0;

  for (const p of pesertaList) {
    const cleanNip = cleanDigits(p.nip);
    const entry =
      (cleanNip ? byNip.get(cleanNip) : undefined) || byNormName.get(normalisasiNama(p.nama));
    if (!entry) continue;

    for (const meta of WAWANCARA_KRITERIA) {
      const key = meta.key;
      const rawNilai = entry.nilai[key];
      const nilai = rawNilai !== null && rawNilai !== undefined ? Math.round(Number(rawNilai)) : null;
      const rawDesk = entry.deskripsi[key] ? String(entry.deskripsi[key]).trim() || null : null;

      await prisma.wawancara.upsert({
        where: {
          pesertaId_kriteria: {
            pesertaId: p.id,
            kriteria: key,
          },
        },
        update: {
          nilai,
          bobot: meta.bobot,
          statusKonfirmasi: 'BELUM_KONFIRMASI',
          lockedFromImport: nilai !== null,
          deskripsi: rawDesk,
          sumber: nilai !== null ? 'Form' : 'KOSONG',
          updatedById: null,
        },
        create: {
          pesertaId: p.id,
          kriteria: key,
          bobot: meta.bobot,
          nilai,
          statusKonfirmasi: 'BELUM_KONFIRMASI',
          lockedFromImport: nilai !== null,
          deskripsi: rawDesk,
          sumber: nilai !== null ? 'Form' : 'KOSONG',
          updatedById: null,
        },
      });
    }

    await prisma.peserta.update({
      where: { id: p.id },
      data: { wawancaraSelesaiAt: null },
    });

    await hitungHasil(p.id);
    resetCount += 1;
  }

  console.log(
    JSON.stringify(
      {
        mode: 'reset',
        kegiatanId,
        resetParticipants: resetCount,
      },
      null,
      2
    )
  );
}

async function main() {
  const args = process.argv.slice(2);
  const isReset = args.includes('--reset');
  const kegArg = args.find((a) => a.startsWith('--kegiatanId='));
  const kegiatanId = await resolveTargetKegiatanId(kegArg ? kegArg.split('=')[1] : undefined);

  if (isReset) {
    await resetWawancaraForm(kegiatanId);
  } else {
    await seedWawancaraForm(kegiatanId);
  }
}

main()
  .catch((err) => {
    console.error('Seed form wawancara gagal:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
