import { prisma } from './prisma';
import { hitungRingkasanNilai, type InputNilaiPeserta } from './hitung';

export interface PesertaDetailInput extends InputNilaiPeserta {
  nama: string;
  nip?: string | null;
  jabatanPelatihan?: string | null;
  jabatanSaatIni?: string | null;
  instansi?: string | null;
  pelatihan?: string;
  angkatan?: string;
  tahun?: number;
  metode?: string;
  sumber?: string;
}

/**
 * Menyimpan 1 peserta beserta Survey, Wawancara, dan HasilEkspose dalam satu nested write
 * untuk meminimalkan database round-trip pada koneksi PostgreSQL/serverless.
 */
export async function simpanPesertaDenganDetail(input: PesertaDetailInput) {
  const sumber = input.sumber || 'Manual';
  const ringkasan = hitungRingkasanNilai(input);

  const surveyItems = [
    { kode: 'L4_01', skor: input.s_panjang ?? null },
    { kode: 'L4_02', skor: input.s_tujuan ?? null },
    { kode: 'L4_03', skor: input.s_manfaat ?? null },
  ];

  const wawancaraItems = [
    { kriteria: 'menengah', bobot: 20, nilai: input.w_menengah ?? null },
    { kriteria: 'jangkaPanjang', bobot: 20, nilai: input.w_panjang ?? null },
    { kriteria: 'seluruhTujuan', bobot: 20, nilai: input.w_tujuan ?? null },
    { kriteria: 'manfaat', bobot: 30, nilai: input.w_manfaat ?? null },
    { kriteria: 'komunikasi', bobot: 10, nilai: input.w_komunikasi ?? null },
  ];

  return prisma.peserta.create({
    data: {
      nama: input.nama,
      nip: input.nip ?? null,
      jabatanPelatihan: input.jabatanPelatihan ?? null,
      jabatanSaatIni: input.jabatanSaatIni ?? null,
      instansi: input.instansi ?? null,
      pelatihan: input.pelatihan || 'PKP',
      angkatan: input.angkatan || 'VII',
      tahun: input.tahun ?? 2023,
      metode: input.metode || 'Blended Learning',
      survey: {
        create: surveyItems.map((s) => ({
          responden: 'alumni',
          kode: s.kode,
          skor: s.skor,
          sumber,
        })),
      },
      wawancara: {
        create: wawancaraItems.map((w) => ({
          kriteria: w.kriteria,
          bobot: w.bobot,
          nilai: w.nilai,
          sumber,
        })),
      },
      hasil: {
        create: ringkasan,
      },
    },
  });
}

/**
 * Menyimpan daftar peserta dalam batch paralel kecil agar cepat dan aman
 * terhadap batas koneksi database serverless.
 */
export async function simpanBatchPesertaDenganDetail(
  items: PesertaDetailInput[],
  chunkSize = 5
) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(chunk.map((item) => simpanPesertaDenganDetail(item)));
  }
  return items.length;
}

/**
 * Menghapus seluruh data peserta beserta relasi nilainya (dan opsional tabel pembahasan).
 */
export async function hapusSemuaDataPeserta(includePembahasan = false) {
  await Promise.all([
    ...(includePembahasan ? [prisma.pembahasan.deleteMany({})] : []),
    prisma.hasilEkspose.deleteMany({}),
    prisma.wawancara.deleteMany({}),
    prisma.survey.deleteMany({}),
  ]);
  await prisma.peserta.deleteMany({});
}
