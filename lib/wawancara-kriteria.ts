/**
 * lib/wawancara-kriteria.ts
 * Definisi resmi 5 kriteria wawancara evaluasi pasca pelatihan (Form Penilaian BPSDM Jabar)
 * lengkap beserta bobot dan keterangan rentang nilai spesifik per kriteria.
 */

export type KriteriaWawancaraKey =
  | 'menengah'
  | 'jangkaPanjang'
  | 'seluruhTujuan'
  | 'manfaat'
  | 'komunikasi';

export interface KriteriaWawancaraMeta {
  no: number;
  key: KriteriaWawancaraKey;
  bobot: number;
  judul: string;
  petunjukPertanyaan: string;
  masukRataM: boolean;
  keteranganRentang: Array<{
    rentang: string;
    arti: string;
  }>;
}

export const WAWANCARA_KRITERIA: KriteriaWawancaraMeta[] = [
  {
    no: 1,
    key: 'menengah',
    bobot: 20,
    judul: 'Target aksi perubahan jangka menengah tercapai',
    petunjukPertanyaan:
      'Apakah peserta masih ditugaskan pada jabatan sama saat periode pemenuhan target jangka menengah?',
    masukRataM: false,
    keteranganRentang: [
      { rentang: 'Nilai <= 60', arti: 'Tidak ada target jangka menengah yang tercapai' },
      { rentang: 'Nilai 61-79', arti: 'Sebagian kecil target jangka menengah tercapai' },
      { rentang: 'Nilai 80-89', arti: 'Sebagian besar target jangka menengah tercapai' },
      { rentang: 'Nilai 90-100', arti: 'Seluruh target tercapai' },
    ],
  },
  {
    no: 2,
    key: 'jangkaPanjang',
    bobot: 20,
    judul: 'Target aksi perubahan jangka panjang tercapai',
    petunjukPertanyaan:
      'Apakah peserta masih ditugaskan pada jabatan sama saat periode pemenuhan target jangka panjang?',
    masukRataM: true,
    keteranganRentang: [
      { rentang: 'Nilai <= 60', arti: 'Tidak ada target jangka panjang yang tercapai' },
      { rentang: 'Nilai 61-79', arti: 'Sebagian kecil target jangka panjang tercapai' },
      { rentang: 'Nilai 80-89', arti: 'Sebagian besar target jangka panjang tercapai' },
      { rentang: 'Nilai 90-100', arti: 'Seluruh target tercapai' },
    ],
  },
  {
    no: 3,
    key: 'seluruhTujuan',
    bobot: 20,
    judul: 'Seluruh tujuan aksi perubahan tercapai',
    petunjukPertanyaan:
      'Bagaimana capaian target dari tujuan proper? Semakin besar yang tercapai maka proper tersebut semakin efektif.',
    masukRataM: true,
    keteranganRentang: [
      { rentang: 'Nilai <= 60', arti: 'Tujuan proper tidak tercapai, proper tidak efektif' },
      {
        rentang: 'Nilai 61-79',
        arti: 'Sebagian kecil tujuan proper tercapai, proper kurang efektif',
      },
      {
        rentang: 'Nilai 80-89',
        arti: 'Sebagian besar tujuan proper tercapai, proper cukup efektif',
      },
      { rentang: 'Nilai 90-100', arti: 'Seluruh tujuan proper tercapai, proper efektif' },
    ],
  },
  {
    no: 4,
    key: 'manfaat',
    bobot: 30,
    judul: 'Manfaat aksi perubahan',
    petunjukPertanyaan:
      'Sejauh mana manfaat aksi perubahan dirasakan oleh unit kerja, perangkat daerah, atau masyarakat?',
    masukRataM: true,
    keteranganRentang: [
      { rentang: 'Nilai <= 60', arti: 'Manfaat hanya dirasakan unit kerja' },
      { rentang: 'Nilai 61-79', arti: 'Manfaat dirasakan Perangkat Daerah' },
      {
        rentang: 'Nilai 80-89',
        arti: 'Manfaat dirasakan beberapa Perangkat Daerah / sebagian masyarakat',
      },
      {
        rentang: 'Nilai 90-100',
        arti: 'Manfaat dirasakan sebagian besar Perangkat Daerah / sebagian masyarakat',
      },
    ],
  },
  {
    no: 5,
    key: 'komunikasi',
    bobot: 10,
    judul: 'Teknik Komunikasi saat konfirmasi/wawancara',
    petunjukPertanyaan:
      'Kejelasan, ketepatan, dan kelengkapan informasi yang disampaikan alumni saat wawancara.',
    masukRataM: false,
    keteranganRentang: [
      { rentang: 'Nilai <= 60', arti: 'Informasi yang diberikan kurang tepat / kurang lengkap' },
      { rentang: 'Nilai 61-79', arti: 'Informasi yang diberikan cukup tepat / kurang lengkap' },
      { rentang: 'Nilai 80-89', arti: 'Informasi yang diberikan tepat / lengkap' },
      { rentang: 'Nilai 90-100', arti: 'Informasi yang diberikan sangat tepat / sangat lengkap' },
    ],
  },
];

export const KRITERIA_LABEL_MAP: Record<string, string> = {
  menengah: 'Target Jangka Menengah (20%)',
  jangkaPanjang: 'Target Jangka Panjang (20%)',
  seluruhTujuan: 'Seluruh Tujuan Tercapai (20%)',
  manfaat: 'Manfaat Aksi Perubahan (30%)',
  komunikasi: 'Teknik Komunikasi (10%)',
};
