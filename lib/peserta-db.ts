import { prisma } from './prisma';
import { hitungRingkasanNilai, type InputNilaiPeserta } from './hitung';

export interface SurveyExtraItem {
  kode: string;
  responden?: string;
  kelompok?: string | null;
  subDimensi?: string | null;
  pertanyaan?: string | null;
  jawabanTeks?: string | null;
  skor: number | null;
  sumber?: string;
}

export interface WawancaraDeskripsiInput {
  menengah?: string | null;
  jangkaPanjang?: string | null;
  seluruhTujuan?: string | null;
  manfaat?: string | null;
  komunikasi?: string | null;
}

export interface SelisihImportInput {
  kriteria: string;
  nilaiForm: number | null;
  nilaiEkspose: number | null;
  catatan?: string;
}

export interface PesertaDetailInput extends InputNilaiPeserta {
  kegiatanId: string;
  nama: string;
  nip?: string | null;
  jabatanPelatihan?: string | null;
  instansiPelatihan?: string | null;
  jabatanSaatIni?: string | null;
  instansi?: string | null;
  pelatihan?: string;
  angkatan?: string;
  tahun?: number;
  metode?: string;
  judulAksiPerubahan?: string | null;
  periodeMenengah?: string | null;
  periodePanjang?: string | null;
  namaTimExcel?: string | null;
  namaAtasan?: string | null;
  jabatanAtasan?: string | null;
  instansiAtasan?: string | null;
  lockedImport?: boolean;
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
  wawancaraDeskripsi?: WawancaraDeskripsiInput;
  selisihImport?: SelisihImportInput[];
}

/**
 * Menyimpan 1 peserta beserta Survey (Alumni & Atasan), Wawancara, HasilEkspose, dan SelisihImport.
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
      kelompok: 'HASIL_AKSI',
      subDimensi: 'Keberlanjutan Aksi',
      pertanyaan: '3. Target Aksi Perubahan dalam jangka panjang tercapai',
      jawabanTeks: input.l4JawabanTeks?.L4_01 ?? null,
      skor: input.s_panjang ?? null,
      sumber: sumberSurvey,
    },
    {
      responden: 'alumni',
      kode: 'L4_02',
      kelompok: 'HASIL_AKSI',
      subDimensi: 'Keberlanjutan Aksi',
      pertanyaan: '4. Seluruh tujuan Aksi Perubahan dapat tercapai',
      jawabanTeks: input.l4JawabanTeks?.L4_02 ?? null,
      skor: input.s_tujuan ?? null,
      sumber: sumberSurvey,
    },
    {
      responden: 'alumni',
      kode: 'L4_03',
      kelompok: 'HASIL_AKSI',
      subDimensi: 'Keberlanjutan Aksi',
      pertanyaan: '5. Manfaat Aksi Perubahan',
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
      kelompok: item.kelompok ?? null,
      subDimensi: item.subDimensi ?? null,
      pertanyaan: item.pertanyaan ?? null,
      jawabanTeks: item.jawabanTeks ?? null,
      skor: item.skor ?? null,
      sumber: item.sumber || 'Jawaban',
    }));

  const isLocked = input.lockedImport ?? true;
  const wawancaraItems = [
    {
      kriteria: 'menengah',
      bobot: 20,
      nilai: input.w_menengah ?? null,
      lockedFromImport: isLocked && input.w_menengah !== null && input.w_menengah !== undefined,
      deskripsi: input.wawancaraDeskripsi?.menengah ?? null,
      sumber: input.w_menengah !== null && input.w_menengah !== undefined ? sumberWawancara : 'KOSONG',
    },
    {
      kriteria: 'jangkaPanjang',
      bobot: 20,
      nilai: input.w_panjang ?? null,
      lockedFromImport: isLocked && input.w_panjang !== null && input.w_panjang !== undefined,
      deskripsi: input.wawancaraDeskripsi?.jangkaPanjang ?? null,
      sumber: input.w_panjang !== null && input.w_panjang !== undefined ? sumberWawancara : 'KOSONG',
    },
    {
      kriteria: 'seluruhTujuan',
      bobot: 20,
      nilai: input.w_tujuan ?? null,
      lockedFromImport: isLocked && input.w_tujuan !== null && input.w_tujuan !== undefined,
      deskripsi: input.wawancaraDeskripsi?.seluruhTujuan ?? null,
      sumber: input.w_tujuan !== null && input.w_tujuan !== undefined ? sumberWawancara : 'KOSONG',
    },
    {
      kriteria: 'manfaat',
      bobot: 30,
      nilai: input.w_manfaat ?? null,
      lockedFromImport: isLocked && input.w_manfaat !== null && input.w_manfaat !== undefined,
      deskripsi: input.wawancaraDeskripsi?.manfaat ?? null,
      sumber: input.w_manfaat !== null && input.w_manfaat !== undefined ? sumberWawancara : 'KOSONG',
    },
    {
      kriteria: 'komunikasi',
      bobot: 10,
      nilai: input.w_komunikasi ?? null,
      lockedFromImport: isLocked && input.w_komunikasi !== null && input.w_komunikasi !== undefined,
      deskripsi: input.wawancaraDeskripsi?.komunikasi ?? null,
      sumber: input.w_komunikasi !== null && input.w_komunikasi !== undefined ? sumberKomunikasi : 'KOSONG',
    },
  ];

  return prisma.peserta.create({
    data: {
      kegiatanId: input.kegiatanId,
      nama: input.nama,
      nip: input.nip ?? null,
      jabatanPelatihan: input.jabatanPelatihan ?? null,
      instansiPelatihan: input.instansiPelatihan ?? null,
      jabatanSaatIni: input.jabatanSaatIni ?? null,
      instansi: input.instansi ?? null,
      pelatihan: input.pelatihan || 'PKP',
      angkatan: input.angkatan || '-',
      tahun: input.tahun ?? new Date().getFullYear(),
      metode: input.metode || null,
      judulAksiPerubahan: input.judulAksiPerubahan ?? null,
      periodeMenengah: input.periodeMenengah ?? null,
      periodePanjang: input.periodePanjang ?? null,
      namaTimExcel: input.namaTimExcel ?? null,
      namaAtasan: input.namaAtasan ?? null,
      jabatanAtasan: input.jabatanAtasan ?? null,
      instansiAtasan: input.instansiAtasan ?? null,
      lockedImport: isLocked,
      wawancaraSelesaiAt: null,
      survey: {
        create: [...l4Items, ...extraSurveyItems],
      },
      wawancara: {
        create: wawancaraItems,
      },
      hasil: {
        create: ringkasan,
      },
      ...(input.selisihImport && input.selisihImport.length > 0
        ? {
            selisihImport: {
              create: input.selisihImport.map((s) => ({
                kegiatanId: input.kegiatanId,
                kriteria: s.kriteria,
                nilaiForm: s.nilaiForm,
                nilaiEkspose: s.nilaiEkspose,
                catatan: s.catatan ?? null,
              })),
            },
          }
        : {}),
    },
  });
}

/**
 * Menyimpan daftar peserta dalam batch paralel kecil agar aman bagi koneksi serverless PostgreSQL.
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
 * Menghapus data peserta, selisih impor, tim, pembahasan, dan antrean AI dalam ruang lingkup 1 kegiatan.
 */
export async function hapusDataPesertaKegiatan(
  kegiatanId: string,
  includePembahasan = true
) {
  await prisma.peserta.deleteMany({ where: { kegiatanId } });
  await Promise.all([
    prisma.selisihImport.deleteMany({ where: { kegiatanId } }),
    prisma.timEvaluator.deleteMany({ where: { kegiatanId } }),
    ...(includePembahasan
      ? [
          prisma.pembahasan.deleteMany({ where: { kegiatanId } }),
          prisma.aiJob.deleteMany({ where: { kegiatanId } }),
        ]
      : []),
  ]);
}
