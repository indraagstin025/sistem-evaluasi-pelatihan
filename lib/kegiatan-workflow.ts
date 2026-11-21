export interface WorkflowStepDef {
  step: number;
  label: string;
  shortLabel: string;
  hint: string;
  path: string;
  exact?: boolean;
}

export const ADMIN_KEGIATAN_STEPS: WorkflowStepDef[] = [
  {
    step: 1,
    label: 'Ringkasan',
    shortLabel: '1. Ringkasan',
    hint: 'Ringkasan capaian evaluasi, panduan alur 4 tahap, daftar nilai yang belum lengkap, serta selisih impor.',
    path: '',
    exact: true,
  },
  {
    step: 2,
    label: 'Input Data',
    shortLabel: '2. Input Data',
    hint: 'Impor file Excel Olah Data Survei dan Form Penilaian Wawancara sebagai data dasar kegiatan.',
    path: '/input-data',
  },
  {
    step: 3,
    label: 'Pembagian Tim',
    shortLabel: '3. Pembagian Tim',
    hint: 'Bagi peserta ke tim evaluator, acak otomatis, atau tautkan akun evaluator & tautan meeting.',
    path: '/pembagian-tim',
  },
  {
    step: 4,
    label: 'Pantau Wawancara',
    shortLabel: '4. Pantau Wawancara',
    hint: 'Pantau progres unggahan Proper peserta, kelengkapan nilai tiap tim, dan salin tautan meeting.',
    path: '/pantau-wawancara',
  },
  {
    step: 5,
    label: 'Daftar Wawancara',
    shortLabel: '5. Daftar Wawancara',
    hint: 'Lihat daftar peserta, periksa dokumen Proper, dan isi atau tinjau nilai wawancara per peserta.',
    path: '/wawancara',
  },
  {
    step: 6,
    label: 'Hasil Survei',
    shortLabel: '6. Hasil Survei',
    hint: 'Tinjau rekapitulasi survei Alumni dan Atasan per dimensi dan indikator pertanyaan.',
    path: '/hasil-survei',
  },
  {
    step: 7,
    label: 'Perbandingan',
    shortLabel: '7. Perbandingan',
    hint: 'Bandingkan skor rata-rata Survei (L) terhadap Wawancara (M) dan selisih per peserta.',
    path: '/perbandingan',
  },
  {
    step: 8,
    label: 'Slide Ekspose',
    shortLabel: '8. Slide Ekspose',
    hint: 'Susun pembahasan AI, tinjau grafik paparan, dan unduh presentasi PowerPoint (PPTX) resmi.',
    path: '/ekspose',
  },
];

export const EVALUATOR_KEGIATAN_STEPS: WorkflowStepDef[] = [
  {
    step: 1,
    label: 'Daftar Wawancara',
    shortLabel: 'Peserta & Wawancara',
    hint: 'Periksa dokumen Proper peserta pada tim Anda, isi penilaian 5 kriteria, dan tandai Selesai.',
    path: '/wawancara',
  },
];

export function getKegiatanWorkflowSteps(
  kegiatanId: string,
  role: 'SUPER_ADMIN' | 'EVALUATOR'
): Array<WorkflowStepDef & { href: string }> {
  const base = `/kegiatan/${kegiatanId}`;
  const defs = role === 'SUPER_ADMIN' ? ADMIN_KEGIATAN_STEPS : EVALUATOR_KEGIATAN_STEPS;
  return defs.map((item) => ({
    ...item,
    href: `${base}${item.path}`,
  }));
}
