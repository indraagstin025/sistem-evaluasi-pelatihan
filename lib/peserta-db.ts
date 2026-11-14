import { prisma } from './prisma';
import { hitungRingkasanNilai, type InputNilaiPeserta } from './hitung';

export interface SurveyExtraItem {
  kode: string;
  responden?: string;
  jawabanTeks?: string | null;
  skor: number | null;
  sumber?: string;
}

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
  sumberSurvey?: string;
  sumberWawancara?: string;
  sumberKomunikasi?: string;
  l4JawabanTeks?: {
    L4_01?: string | null;
    L4_02?: string | null;
    L4_03?: string | null;
  };
  tambahanSurvey?: SurveyExtraItem[];
}

/**
 * Menyimpan 1 peserta beserta Survey, Wawancara, dan HasilEkspose dalam satu nested write
 * untuk meminimalkan database round-trip pada koneksi PostgreSQL/serverless.
 */
export async function simpanPesertaDenganDetail(input: PesertaDetailInput) {
  const defaultSumber = input.sumber || 'Form';
  const sumberSurvey = input.sumberSurvey || defaultSumber;
  const sumberWawancara = input.sumberWawancara || defaultSumber;
  const sumberKomunikasi = input.sumberKomunikasi || sumberWawancara;
  const ringkasan = hitungRingkasanNilai(input);

  const l4Items = [
    {
      responden: 'alumni',
      kode: 'L4_01',
      jawabanTeks: input.l4JawabanTeks?.L4_01 ?? null,
      skor: input.s_panjang ?? null,
      sumber: sumberSurvey,
    },
    {
      responden: 'alumni',
      kode: 'L4_02',
      jawabanTeks: input.l4JawabanTeks?.L4_02 ?? null,
      skor: input.s_tujuan ?? null,
      sumber: sumberSurvey,
    },
    {
      responden: 'alumni',
      kode: 'L4_03',
      jawabanTeks: input.l4JawabanTeks?.L4_03 ?? null,
      skor: input.s_manfaat ?? null,
      sumber: sumberSurvey,
    },
  ];

  const existingKeys = new Set(l4Items.map((i) => `${i.responden}:${i.kode}`));
  const extraSurveyItems = (input.tambahanSurvey || [])
    .filter((item) => {
      const key = `${item.responden || 'alumni'}:${item.kode}`;
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    })
    .map((item) => ({
      responden: item.responden || 'alumni',
      kode: item.kode,
      jawabanTeks: item.jawabanTeks ?? null,
      skor: item.skor ?? null,
      sumber: item.sumber || 'Jawaban',
    }));

  const wawancaraItems = [
    { kriteria: 'menengah', bobot: 20, nilai: input.w_menengah ?? null, sumber: sumberWawancara },
    { kriteria: 'jangkaPanjang', bobot: 20, nilai: input.w_panjang ?? null, sumber: sumberWawancara },
    { kriteria: 'seluruhTujuan', bobot: 20, nilai: input.w_tujuan ?? null, sumber: sumberWawancara },
    { kriteria: 'manfaat', bobot: 30, nilai: input.w_manfaat ?? null, sumber: sumberWawancara },
    { kriteria: 'komunikasi', bobot: 10, nilai: input.w_komunikasi ?? null, sumber: sumberKomunikasi },
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
        create: [...l4Items, ...extraSurveyItems],
      },
      wawancara: {
        create: wawancaraItems,
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
    ...(includePembahasan
      ? [prisma.pembahasan.deleteMany({}), prisma.aiJob.deleteMany({})]
      : []),
    prisma.hasilEkspose.deleteMany({}),
    prisma.wawancara.deleteMany({}),
    prisma.survey.deleteMany({}),
  ]);
  await prisma.peserta.deleteMany({});
}
