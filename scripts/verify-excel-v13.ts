import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../lib/prisma';
import { executeExcelImport } from '../lib/excel-importer';
import { getHasilSurveyKegiatan } from '../lib/survey-summary';
import { getRekapGrafikMap } from '../lib/pembahasan-server';
import { hitungAlokasiTimAuto10 } from '../lib/pembagian-tim';

async function main() {
  // 1. Uji deterministik algoritma pembagian tim 10/evaluator (IT-12 / UR-N-08)
  const g30 = hitungAlokasiTimAuto10(Array.from({ length: 30 }, (_, i) => i + 1)).map((b) => b.length);
  const g31 = hitungAlokasiTimAuto10(Array.from({ length: 31 }, (_, i) => i + 1)).map((b) => b.length);
  const g32 = hitungAlokasiTimAuto10(Array.from({ length: 32 }, (_, i) => i + 1)).map((b) => b.length);
  console.log('TIM ALOKASI CHECK:', { g30, g31, g32 });
  if (JSON.stringify(g30) !== '[10,10,10]' || JSON.stringify(g31) !== '[11,10,10]' || JSON.stringify(g32) !== '[11,11,10]') {
    throw new Error('Alokasi pembagian tim tidak sesuai aturan deterministik.');
  }

  // 2. Uji impor langsung 2 file Excel asli ke kegiatan sementara
  const rootFiles = fs.readdirSync(process.cwd());
  const olahName = rootFiles.find((f) => f.toLowerCase().includes('olah data') && f.endsWith('.xlsx'));
  const formName = rootFiles.find((f) => f.toLowerCase().includes('form penilaian') && f.endsWith('.xlsx'));
  if (!olahName || !formName) {
    throw new Error('Dua berkas Excel rujukan di root proyek tidak ditemukan.');
  }

  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) throw new Error('Akun Super Admin belum ada; jalankan seed terlebih dahulu.');

  const tempKegiatan = await prisma.kegiatan.create({
    data: {
      nama: '__VERIFY_TMP__ PKP Angkatan VII',
      jenisPelatihan: 'PKP',
      penyelenggara: 'BPSDM Jawa Barat',
      lokasi: 'Kabupaten Bogor',
      tanggalMulai: new Date('2025-10-29'),
      tanggalSelesai: new Date('2025-10-30'),
      createdById: admin.id,
    },
  });

  try {
    const res = await executeExcelImport({
      kegiatanId: tempKegiatan.id,
      primaryBuffer: fs.readFileSync(path.join(process.cwd(), olahName)),
      primaryFilename: olahName,
      secondaryBuffer: fs.readFileSync(path.join(process.cwd(), formName)),
      mode: 'replace',
    });
    console.log('IMPORT RESULT:', res);
    if (!res.ok) throw new Error(res.error);

    const teams = await prisma.timEvaluator.findMany({
      where: { kegiatanId: tempKegiatan.id },
      include: { _count: { select: { peserta: true } } },
      orderBy: { urutan: 'asc' },
    });
    console.log('TEAMS FROM EXCEL:', teams.map((t) => ({ namaTim: t.namaTim, count: t._count.peserta })));

    const timbul = await prisma.peserta.findFirst({
      where: { kegiatanId: tempKegiatan.id, nama: { contains: 'Timbul' } },
      include: { wawancara: true, hasil: true },
    });
    console.log('TIMBUL CHECK (must be KOSONG/null):', {
      nama: timbul?.nama,
      M: timbul?.hasil?.rataWawancaraM,
      totalForm: timbul?.hasil?.totalForm,
      nilaiNonNull: timbul?.wawancara.filter((w) => w.nilai !== null).length,
    });

    const ade = await prisma.peserta.findFirst({
      where: { kegiatanId: tempKegiatan.id, nama: { contains: 'Ade nuryana' } },
      include: { hasil: true, wawancara: true },
    });
    console.log('ADE KP-02 CHECK:', {
      L: ade?.hasil?.rataSurveiL,
      M: ade?.hasil?.rataWawancaraM,
      totalForm: ade?.hasil?.totalForm,
      selisih: ade?.hasil?.selisih,
      lockedCount: ade?.wawancara.filter((w) => w.lockedFromImport).length,
    });

    const surveySummary = await getHasilSurveyKegiatan(tempKegiatan.id);
    console.log('SURVEY SUMMARY CHECK:', {
      totalPeserta: surveySummary.totalPeserta,
      alumni: surveySummary.jumlahRespondenAlumni,
      atasan: surveySummary.jumlahRespondenAtasan,
      mutasi: surveySummary.mutasiJabatan,
      metode: surveySummary.metodePelaksanaan,
      perilakuCount: surveySummary.pertanyaanByKelompok.PERILAKU.length,
      perilakuNo1: surveySummary.pertanyaanByKelompok.PERILAKU[0],
      hasilKontribusiCount: surveySummary.pertanyaanByKelompok.HASIL_KONTRIBUSI.length,
      dukunganCount: surveySummary.pertanyaanByKelompok.DUKUNGAN.length,
      kendalaCount: surveySummary.pertanyaanByKelompok.KENDALA.length,
    });

    const rekapMap = await getRekapGrafikMap(tempKegiatan.id);
    console.log('REKAP 5 GRAFIK (Form Penilaian IT-01 source):', {
      g1: { a: rekapMap.grafik1.dataA, b: rekapMap.grafik1.dataB },
      g4: { a: rekapMap.grafik4.dataA, b: rekapMap.grafik4.dataB },
      g5: { a: rekapMap.grafik5.dataA, b: rekapMap.grafik5.dataB },
    });
  } finally {
    await prisma.kegiatan.delete({ where: { id: tempKegiatan.id } });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
