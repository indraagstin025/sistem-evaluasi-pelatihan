import { prisma } from './prisma';

export const KATEGORI_RENTANG = ["0", "1-25", "26-50", "51-75", "76-100"] as const;
export type KategoriRentang = typeof KATEGORI_RENTANG[number];

/**
 * Cek apakah nilai adalah angka valid (bukan null, undefined, NaN)
 */
export function isValidNumber(val: any): val is number {
  return val !== null && val !== undefined && val !== "" && !Number.isNaN(Number(val));
}

/**
 * Mengubah jawaban teks survei skala Likert (URD Bab 6.1) atau angka 1-4 menjadi skor numerik.
 * Sangat Sesuai = 4, Sesuai = 3, Kurang Sesuai = 2, Tidak Sesuai = 1.
 */
export function konversiSkorLikert(jawaban: unknown): number | null {
  if (jawaban === null || jawaban === undefined || jawaban === "") return null;
  if (typeof jawaban === "number" && !Number.isNaN(jawaban)) {
    return jawaban >= 1 && jawaban <= 4 ? jawaban : null;
  }
  const text = String(jawaban).trim().toLowerCase();
  if (!text) return null;
  if (text === "sangat sesuai") return 4;
  if (text === "sesuai") return 3;
  if (text === "kurang sesuai") return 2;
  if (text === "tidak sesuai") return 1;
  const parsed = Number(text);
  if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 4) {
    return parsed;
  }
  return null;
}

/**
 * RUMUS 1: Rata-Rata Survei (L)
 * L = AVERAGE(3 skor survei alumni kode L4_01, L4_02, L4_03) x 25
 */
export function hitungRataSurveiL(
  s_panjang: any,
  s_tujuan: any,
  s_manfaat: any
): number | null {
  if (!isValidNumber(s_panjang) || !isValidNumber(s_tujuan) || !isValidNumber(s_manfaat)) {
    return null;
  }
  const avg = (Number(s_panjang) + Number(s_tujuan) + Number(s_manfaat)) / 3;
  return avg * 25;
}

/**
 * RUMUS 2: Rata-Rata Wawancara (M)
 * M = AVERAGE(wawancara jangkaPanjang, seluruhTujuan, manfaat) — tanpa bobot
 */
export function hitungRataWawancaraM(
  w_panjang: any,
  w_tujuan: any,
  w_manfaat: any
): number | null {
  if (!isValidNumber(w_panjang) || !isValidNumber(w_tujuan) || !isValidNumber(w_manfaat)) {
    return null;
  }
  return (Number(w_panjang) + Number(w_tujuan) + Number(w_manfaat)) / 3;
}

/**
 * RUMUS 3: Nilai Total Form (Berbobot)
 * TotalForm = menengah x 20% + jangkaPanjang x 20% + seluruhTujuan x 20% + manfaat x 30% + komunikasi x 10%
 */
export function hitungTotalForm(
  w_menengah: any,
  w_panjang: any,
  w_tujuan: any,
  w_manfaat: any,
  w_komunikasi: any
): number | null {
  if (
    !isValidNumber(w_menengah) ||
    !isValidNumber(w_panjang) ||
    !isValidNumber(w_tujuan) ||
    !isValidNumber(w_manfaat) ||
    !isValidNumber(w_komunikasi)
  ) {
    return null;
  }
  return (
    Number(w_menengah) * 0.20 +
    Number(w_panjang) * 0.20 +
    Number(w_tujuan) * 0.20 +
    Number(w_manfaat) * 0.30 +
    Number(w_komunikasi) * 0.10
  );
}

/**
 * RUMUS 4: Rentang Nilai (Skala 0-100)
 * 0 -> "0", 1-25 -> "1-25", 26-50 -> "26-50", 51-75 -> "51-75", 76-100 -> "76-100"
 * PERHATIAN: skor 1 masuk "1-25", bukan 0.
 * Nilai null / kosong menghasilkan "KOSONG" dan tidak masuk rentang angka.
 */
export function tentukanRentang(nilai: any): string {
  if (!isValidNumber(nilai)) return "KOSONG";
  const n = Number(nilai);
  if (n <= 0) return "0";
  if (n <= 25) return "1-25";
  if (n <= 50) return "26-50";
  if (n <= 75) return "51-75";
  return "76-100";
}

/**
 * RUMUS 5: Rentang Skor Survei Per Item (Skala 1-4)
 * Dikonversi ke skala 100 dengan skor * 25:
 * Skor 1 -> 25 -> "1-25" (BUKAN "0")
 * Skor 2 -> 50 -> "26-50"
 * Skor 3 -> 75 -> "51-75"
 * Skor 4 -> 100 -> "76-100"
 */
export function tentukanRentangItemSurvei(skor: number | null | undefined): string {
  if (!isValidNumber(skor)) return "KOSONG";
  const s = Number(skor);
  if (s <= 0) return "0";
  return tentukanRentang(s * 25);
}

/**
 * Menghitung distribusi frekuensi COUNTIF untuk kategori:
 * ["0", "1-25", "26-50", "51-75", "76-100"]
 * Nilai "KOSONG" diabaikan sehingga tidak merusak hitungan valid.
 */
export function hitungDistribusiRentang(rentangArray: string[]): number[] {
  const counts = [0, 0, 0, 0, 0];
  for (const r of rentangArray) {
    const idx = (KATEGORI_RENTANG as readonly string[]).indexOf(r);
    if (idx !== -1) {
      counts[idx]++;
    }
  }
  return counts;
}

/**
 * Format angka desimal: bulat tampil tanpa koma, desimal maks 2 angka
 */
export function formatAngka(val: number | null | undefined): string {
  if (!isValidNumber(val)) return "KOSONG";
  const n = Number(val);
  return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace('.', ',');
}

export interface InputNilaiPeserta {
  s_panjang?: number | null;
  s_tujuan?: number | null;
  s_manfaat?: number | null;
  w_menengah?: number | null;
  w_panjang?: number | null;
  w_tujuan?: number | null;
  w_manfaat?: number | null;
  w_komunikasi?: number | null;
}

/**
 * Fungsi murni untuk menghitung ringkasan nilai (L, M, TotalForm, Selisih, Rentang)
 * tanpa menyentuh database, agar dapat dipakai ulang pada batch import maupun hitungHasil.
 */
export function hitungRingkasanNilai(input: InputNilaiPeserta) {
  const rataSurveiL = hitungRataSurveiL(input.s_panjang, input.s_tujuan, input.s_manfaat);
  const rataWawancaraM = hitungRataWawancaraM(input.w_panjang, input.w_tujuan, input.w_manfaat);
  const totalForm = hitungTotalForm(
    input.w_menengah,
    input.w_panjang,
    input.w_tujuan,
    input.w_manfaat,
    input.w_komunikasi
  );
  const selisih =
    isValidNumber(rataWawancaraM) && isValidNumber(rataSurveiL)
      ? rataWawancaraM - rataSurveiL
      : null;
  const rangeSurvei = isValidNumber(rataSurveiL) ? tentukanRentang(rataSurveiL) : null;
  const rangeWawancara = isValidNumber(rataWawancaraM) ? tentukanRentang(rataWawancaraM) : null;

  return {
    rataSurveiL,
    rataWawancaraM,
    totalForm,
    selisih,
    rangeSurvei,
    rangeWawancara,
  };
}

/**
 * Fungsi hitungHasil(pesertaId)
 * Mengambil Survey dan Wawancara peserta dari DB, menghitung L, M, TotalForm, Selisih, Range,
 * lalu meng-upsert ke tabel HasilEkspose.
 */
export async function hitungHasil(pesertaId: string) {
  const peserta = await prisma.peserta.findUnique({
    where: { id: pesertaId },
    include: {
      survey: true,
      wawancara: true,
    },
  });

  if (!peserta) {
    throw new Error(`Peserta dengan ID ${pesertaId} tidak ditemukan.`);
  }

  // Ambil survei alumni Level 4 (L4_01, L4_02, L4_03)
  const s_panjang = peserta.survey.find(s => s.kode === 'L4_01' && s.responden === 'alumni')?.skor;
  const s_tujuan = peserta.survey.find(s => s.kode === 'L4_02' && s.responden === 'alumni')?.skor;
  const s_manfaat = peserta.survey.find(s => s.kode === 'L4_03' && s.responden === 'alumni')?.skor;

  // Ambil wawancara 5 kriteria
  const w_menengah = peserta.wawancara.find(w => w.kriteria === 'menengah')?.nilai;
  const w_panjang = peserta.wawancara.find(w => w.kriteria === 'jangkaPanjang')?.nilai;
  const w_tujuan = peserta.wawancara.find(w => w.kriteria === 'seluruhTujuan')?.nilai;
  const w_manfaat = peserta.wawancara.find(w => w.kriteria === 'manfaat')?.nilai;
  const w_komunikasi = peserta.wawancara.find(w => w.kriteria === 'komunikasi')?.nilai;

  const ringkasan = hitungRingkasanNilai({
    s_panjang,
    s_tujuan,
    s_manfaat,
    w_menengah,
    w_panjang,
    w_tujuan,
    w_manfaat,
    w_komunikasi,
  });

  // Simpan / update ke HasilEkspose
  const hasil = await prisma.hasilEkspose.upsert({
    where: { pesertaId },
    update: ringkasan,
    create: {
      pesertaId,
      ...ringkasan,
    },
  });

  return hasil;
}
