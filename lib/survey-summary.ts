import { prisma } from './prisma';
import { isValidNumber } from './hitung';

export interface LikertSummarySide {
  counts: [number, number, number, number]; // [Tidak Sesuai(1), Kurang(2), Sesuai(3), Sangat(4)]
  total: number;
  rataRata: number | null;
}

export interface SurveyQuestionSummaryItem {
  kode: string;
  urutan: number;
  kelompok: string;
  subDimensi: string;
  pertanyaan: string;
  alumni: LikertSummarySide;
  atasan: LikertSummarySide;
}

export interface OpenTextResponseEntry {
  pesertaNama: string;
  responden: 'alumni' | 'atasan';
  teks: string;
}

export interface HasilSurveyKegiatanSummary {
  totalPeserta: number;
  mutasiJabatan: { berubah: number; tetap: number; tidakDiketahui: number };
  metodePelaksanaan: Array<{ metode: string; jumlah: number }>;
  instansiList: Array<{ instansi: string; jumlah: number }>;
  jumlahRespondenAlumni: number;
  jumlahRespondenAtasan: number;
  pertanyaanByKelompok: Record<string, SurveyQuestionSummaryItem[]>;
  dukunganTerbuka: OpenTextResponseEntry[];
  kendalaTerbuka: OpenTextResponseEntry[];
}

function normalisasiJabatanAtauInstansi(raw: string | null | undefined): string {
  return (raw || '')
    .toLowerCase()
    .replace(/\bkepala sub bagian\b|\bkepala subbagian\b|\bka\.?\s*subbag\b|\bkasubbag\b/g, 'kasubag')
    .replace(/\bkepala seksi\b/g, 'kasi')
    .replace(/\bkepala bidang\b/g, 'kabid')
    .replace(/\bkepala upt\b|\bka\.?\s*upt\b/g, 'kaupt')
    .replace(/\bkabupaten\b|\bkab\.?\b/g, 'kab')
    .replace(/\bkecamatan\b|\bkec\.?\b/g, 'kec')
    .replace(/\bdpup[r]?\b/g, 'dinas pekerjaan umum dan penataan ruang')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function emptySide(): LikertSummarySide {
  return { counts: [0, 0, 0, 0], total: 0, rataRata: null };
}

function finalizeSide(counts: [number, number, number, number]): LikertSummarySide {
  const total = counts[0] + counts[1] + counts[2] + counts[3];
  if (total === 0) return { counts, total: 0, rataRata: null };
  const weighted = counts[0] * 1 + counts[1] * 2 + counts[2] * 3 + counts[3] * 4;
  return {
    counts,
    total,
    rataRata: Number((weighted / total).toFixed(2)),
  };
}

function extractUrutanFromKode(kode: string): number {
  const m = /(\d+)$/.exec(kode);
  return m ? Number(m[1]) : 999;
}

/**
 * Menyusun ringkasan seluruh 5 kelompok kuesioner (OlahData / OlahData2) per kegiatan,
 * lengkap dengan perbandingan Alumni vs Atasan Alumni dan daftar jawaban terbuka.
 */
export async function getHasilSurveyKegiatan(
  kegiatanId: string
): Promise<HasilSurveyKegiatanSummary> {
  const pesertaList = await prisma.peserta.findMany({
    where: { kegiatanId },
    include: { survey: true },
    orderBy: { nama: 'asc' },
  });

  let berubah = 0;
  let tetap = 0;
  let tidakDiketahui = 0;
  const metodeMap = new Map<string, number>();
  const instansiMap = new Map<string, number>();

  const questionAccumulator = new Map<
    string,
    {
      kode: string;
      kelompok: string;
      subDimensi: string;
      pertanyaan: string;
      alumniCounts: [number, number, number, number];
      atasanCounts: [number, number, number, number];
    }
  >();

  const dukunganTerbuka: OpenTextResponseEntry[] = [];
  const kendalaTerbuka: OpenTextResponseEntry[] = [];
  let jumlahRespondenAlumni = 0;
  let jumlahRespondenAtasan = 0;

  for (const p of pesertaList) {
    const jPel = normalisasiJabatanAtauInstansi(p.jabatanPelatihan);
    const jNow = normalisasiJabatanAtauInstansi(p.jabatanSaatIni);
    const iPel = normalisasiJabatanAtauInstansi(p.instansiPelatihan);
    const iNow = normalisasiJabatanAtauInstansi(p.instansi);

    if ((jPel && jNow) || (iPel && iNow)) {
      const sameJab = !jPel || !jNow || jPel === jNow || jPel.includes(jNow) || jNow.includes(jPel);
      const sameInst = !iPel || !iNow || iPel === iNow || iPel.includes(iNow) || iNow.includes(iPel);
      if (sameJab && sameInst) tetap++;
      else berubah++;
    } else {
      tidakDiketahui++;
    }

    const metode = (p.metode || 'Tidak Diketahui').trim();
    metodeMap.set(metode, (metodeMap.get(metode) ?? 0) + 1);

    const instansi = (p.instansiPelatihan || p.instansi || 'Tidak Diketahui').trim();
    instansiMap.set(instansi, (instansiMap.get(instansi) ?? 0) + 1);

    let hasAlumni = false;
    let hasAtasan = false;

    for (const s of p.survey) {
      if (s.responden === 'alumni') hasAlumni = true;
      if (s.responden === 'atasan') hasAtasan = true;

      if (s.kode === 'DUK_TEXT') {
        const clean = (s.jawabanTeks || '').trim();
        if (clean && clean !== '-') {
          dukunganTerbuka.push({
            pesertaNama: p.nama,
            responden: s.responden === 'atasan' ? 'atasan' : 'alumni',
            teks: clean,
          });
        }
        continue;
      }
      if (s.kode === 'KND_TEXT') {
        const clean = (s.jawabanTeks || '').trim();
        if (clean && clean !== '-') {
          kendalaTerbuka.push({
            pesertaNama: p.nama,
            responden: s.responden === 'atasan' ? 'atasan' : 'alumni',
            teks: clean,
          });
        }
        continue;
      }

      if (!isValidNumber(s.skor) || s.skor < 1 || s.skor > 4) continue;
      const kelompok = s.kelompok || (s.kode.startsWith('L4_') ? 'HASIL_AKSI' : 'PERILAKU');
      if (!questionAccumulator.has(s.kode)) {
        questionAccumulator.set(s.kode, {
          kode: s.kode,
          kelompok,
          subDimensi: s.subDimensi || kelompok,
          pertanyaan: s.pertanyaan || s.kode,
          alumniCounts: [0, 0, 0, 0],
          atasanCounts: [0, 0, 0, 0],
        });
      }

      const acc = questionAccumulator.get(s.kode)!;
      if (s.pertanyaan && acc.pertanyaan === acc.kode) {
        acc.pertanyaan = s.pertanyaan;
      }
      if (s.subDimensi && acc.subDimensi === acc.kelompok) {
        acc.subDimensi = s.subDimensi;
      }

      const scoreIdx = Math.round(s.skor) - 1;
      if (s.responden === 'atasan') {
        acc.atasanCounts[scoreIdx]++;
      } else {
        acc.alumniCounts[scoreIdx]++;
      }
    }

    if (hasAlumni) jumlahRespondenAlumni++;
    if (hasAtasan) jumlahRespondenAtasan++;
  }

  const pertanyaanByKelompok: Record<string, SurveyQuestionSummaryItem[]> = {
    PERILAKU: [],
    HASIL_KONTRIBUSI: [],
    HASIL_AKSI: [],
    DUKUNGAN: [],
    KENDALA: [],
  };

  for (const acc of Array.from(questionAccumulator.values())) {
    const list = pertanyaanByKelompok[acc.kelompok] || (pertanyaanByKelompok[acc.kelompok] = []);
    list.push({
      kode: acc.kode,
      urutan: extractUrutanFromKode(acc.kode),
      kelompok: acc.kelompok,
      subDimensi: acc.subDimensi,
      pertanyaan: acc.pertanyaan,
      alumni: finalizeSide(acc.alumniCounts),
      atasan: finalizeSide(acc.atasanCounts),
    });
  }

  for (const key of Object.keys(pertanyaanByKelompok)) {
    pertanyaanByKelompok[key].sort((a, b) => a.urutan - b.urutan);
  }

  return {
    totalPeserta: pesertaList.length,
    mutasiJabatan: { berubah, tetap, tidakDiketahui },
    metodePelaksanaan: Array.from(metodeMap.entries()).map(([metode, jumlah]) => ({
      metode,
      jumlah,
    })),
    instansiList: Array.from(instansiMap.entries())
      .map(([instansi, jumlah]) => ({ instansi, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah),
    jumlahRespondenAlumni,
    jumlahRespondenAtasan,
    pertanyaanByKelompok,
    dukunganTerbuka,
    kendalaTerbuka,
  };
}

/**
 * Menyusun ringkasan angka survei agregat tanpa nama/NIP untuk konteks AI kesimpulan Ekspose.
 */
export function ringkasHasilSurveyUntukAi(summary: HasilSurveyKegiatanSummary): string {
  const avgKelompok = (kodeKel: string) => {
    const rows = summary.pertanyaanByKelompok[kodeKel] || [];
    const validAlu = rows.map((r) => r.alumni.rataRata).filter((v): v is number => v !== null);
    const validAta = rows.map((r) => r.atasan.rataRata).filter((v): v is number => v !== null);
    const meanAlu =
      validAlu.length > 0
        ? (validAlu.reduce((a, b) => a + b, 0) / validAlu.length).toFixed(2)
        : '-';
    const meanAta =
      validAta.length > 0
        ? (validAta.reduce((a, b) => a + b, 0) / validAta.length).toFixed(2)
        : '-';
    return `Alumni ${meanAlu}/4, Atasan ${meanAta}/4`;
  };

  return [
    `Mutasi jabatan: ${summary.mutasiJabatan.berubah} berubah, ${summary.mutasiJabatan.tetap} tetap.`,
    `Perubahan Perilaku (30 butir): ${avgKelompok('PERILAKU')}`,
    `Produktivitas & Kontribusi: ${avgKelompok('HASIL_KONTRIBUSI')}`,
    `Keberlanjutan Aksi Perubahan: ${avgKelompok('HASIL_AKSI')}`,
    `Faktor Dukungan (5 butir): ${avgKelompok('DUKUNGAN')}`,
    `Faktor Kendala (3 butir, skor rendah berarti kendala kecil): ${avgKelompok('KENDALA')}`,
  ].join('\n');
}
