import { prisma } from './prisma';
import {
  hitungDistribusiRentang,
  isValidNumber,
  tentukanRentang,
  tentukanRentangItemSurvei,
} from './hitung';
import type {
  EvidenceAgregatSummary,
  KesimpulanContext,
  RekapGrafikData,
  SelisihAgregatSummary,
} from './ai';
import type { StoredTemaTerbuka } from './ai-jawaban-terbuka';
import {
  AI_MIN_COMPLETENESS_PCT,
  type AiDataReadiness,
} from './ekspose-config';
import { getHasilSurveyKegiatan, ringkasHasilSurveyUntukAi } from './survey-summary';
import {
  normalizeStatusKonfirmasi,
  WAWANCARA_KRITERIA,
  type KriteriaWawancaraKey,
} from './wawancara-kriteria';

export interface KriteriaKonfirmasiRekap {
  kriteria: KriteriaWawancaraKey;
  judul: string;
  totalPeserta: number;
  ya: number;
  tidak: number;
  belumKonfirmasi: number;
}

export type KonfirmasiWawancaraMap = Record<KriteriaWawancaraKey, KriteriaKonfirmasiRekap>;

/**
 * Menghitung rekapitulasi status konfirmasi dropdown (Belum Konfirmasi, YA, TIDAK)
 * untuk kelima kriteria wawancara langsung dari daftar peserta & baris Wawancara aktual.
 */
export function hitungKonfirmasiWawancaraRekap(
  listPeserta: Array<{
    wawancara: Array<{ kriteria: string; statusKonfirmasi?: string | null }>;
  }>
): KonfirmasiWawancaraMap {
  const totalPeserta = listPeserta.length;
  const result = {} as KonfirmasiWawancaraMap;

  for (const meta of WAWANCARA_KRITERIA) {
    let ya = 0;
    let tidak = 0;
    let belumKonfirmasi = 0;

    for (const p of listPeserta) {
      const row = p.wawancara.find((w) => w.kriteria === meta.key);
      const status = normalizeStatusKonfirmasi(row?.statusKonfirmasi);
      if (status === 'YA') {
        ya += 1;
      } else if (status === 'TIDAK') {
        tidak += 1;
      } else {
        belumKonfirmasi += 1;
      }
    }

    result[meta.key] = {
      kriteria: meta.key,
      judul: meta.judul,
      totalPeserta,
      ya,
      tidak,
      belumKonfirmasi,
    };
  }

  return result;
}

export async function getKonfirmasiWawancaraMap(
  kegiatanId: string
): Promise<KonfirmasiWawancaraMap> {
  const listPeserta = await prisma.peserta.findMany({
    where: { kegiatanId },
    select: {
      id: true,
      wawancara: {
        select: {
          kriteria: true,
          statusKonfirmasi: true,
        },
      },
    },
  });

  return hitungKonfirmasiWawancaraRekap(listPeserta);
}

export function ringkasKonfirmasiUntukAi(
  konfirmasiMap: KonfirmasiWawancaraMap,
  keys?: KriteriaWawancaraKey[]
): string {
  const targetKeys =
    keys && keys.length > 0 ? keys : WAWANCARA_KRITERIA.map((k) => k.key);
  return targetKeys
    .map((key) => {
      const r = konfirmasiMap[key];
      if (!r) return null;
      return `- ${r.judul}: YA ${r.ya} peserta, TIDAK ${r.tidak} peserta, Belum Konfirmasi ${r.belumKonfirmasi} peserta (Total ${r.totalPeserta} peserta)`;
    })
    .filter(Boolean)
    .join('\n');
}

export const PEMBAHASAN_KEYS = [
  'grafik1',
  'grafik2',
  'grafik3',
  'grafik4',
  'grafik5',
  'kesimpulan',
] as const;

export type PembahasanKey = (typeof PEMBAHASAN_KEYS)[number];

/**
 * Menghitung rekapitulasi 5 grafik ekspose dari data peserta aktual dalam satu kegiatan.
 */
export async function getRekapGrafikMap(
  kegiatanId: string
): Promise<
  Record<'grafik1' | 'grafik2' | 'grafik3' | 'grafik4' | 'grafik5', RekapGrafikData>
> {
  const listPeserta = await prisma.peserta.findMany({
    where: { kegiatanId },
    include: {
      survey: true,
      wawancara: true,
      hasil: true,
    },
    orderBy: { nama: 'asc' },
  });

  const mapped = listPeserta.map((p) => {
    const s_panjang = p.survey.find((s) => s.kode === 'L4_01' && s.responden === 'alumni')?.skor;
    const s_tujuan = p.survey.find((s) => s.kode === 'L4_02' && s.responden === 'alumni')?.skor;
    const s_manfaat = p.survey.find((s) => s.kode === 'L4_03' && s.responden === 'alumni')?.skor;

    const w_menengah = p.wawancara.find((w) => w.kriteria === 'menengah')?.nilai;
    const w_panjang = p.wawancara.find((w) => w.kriteria === 'jangkaPanjang')?.nilai;
    const w_tujuan = p.wawancara.find((w) => w.kriteria === 'seluruhTujuan')?.nilai;
    const w_manfaat = p.wawancara.find((w) => w.kriteria === 'manfaat')?.nilai;

    return {
      s_panjang,
      s_tujuan,
      s_manfaat,
      w_menengah,
      w_panjang,
      w_tujuan,
      w_manfaat,
      rangeSurvei: p.hasil?.rangeSurvei || 'KOSONG',
      rangeWawancara: p.hasil?.rangeWawancara || 'KOSONG',
    };
  });

  const g1_menengah = hitungDistribusiRentang(mapped.map((p) => tentukanRentang(p.w_menengah)));
  const g1_panjang = hitungDistribusiRentang(mapped.map((p) => tentukanRentang(p.w_panjang)));

  const g2_survei = hitungDistribusiRentang(mapped.map((p) => tentukanRentangItemSurvei(p.s_panjang)));
  const g2_wawancara = hitungDistribusiRentang(mapped.map((p) => tentukanRentang(p.w_panjang)));

  const g3_survei = hitungDistribusiRentang(mapped.map((p) => tentukanRentangItemSurvei(p.s_tujuan)));
  const g3_wawancara = hitungDistribusiRentang(mapped.map((p) => tentukanRentang(p.w_tujuan)));

  const g4_survei = hitungDistribusiRentang(mapped.map((p) => tentukanRentangItemSurvei(p.s_manfaat)));
  const g4_wawancara = hitungDistribusiRentang(mapped.map((p) => tentukanRentang(p.w_manfaat)));

  const g5_survei = hitungDistribusiRentang(mapped.map((p) => p.rangeSurvei));
  const g5_wawancara = hitungDistribusiRentang(mapped.map((p) => p.rangeWawancara));

  return {
    grafik1: {
      judul: 'Grafik 1: Target Aksi Perubahan Jangka Menengah vs Jangka Panjang (Wawancara)',
      slide: 'Slide PPT 5',
      labelA: 'Jangka Menengah (Wawancara)',
      dataA: g1_menengah,
      totalA: g1_menengah.reduce((a, b) => a + b, 0),
      labelB: 'Jangka Panjang (Wawancara)',
      dataB: g1_panjang,
      totalB: g1_panjang.reduce((a, b) => a + b, 0),
    },
    grafik2: {
      judul: 'Grafik 2: Target Jangka Panjang — Survei vs Wawancara',
      slide: 'Slide PPT 6',
      labelA: 'Survei (Jangka Panjang)',
      dataA: g2_survei,
      totalA: g2_survei.reduce((a, b) => a + b, 0),
      labelB: 'Wawancara (Jangka Panjang)',
      dataB: g2_wawancara,
      totalB: g2_wawancara.reduce((a, b) => a + b, 0),
    },
    grafik3: {
      judul: 'Grafik 3: Seluruh Tujuan Tercapai — Survei vs Wawancara',
      slide: 'Slide PPT 7',
      labelA: 'Survei (Seluruh Tujuan)',
      dataA: g3_survei,
      totalA: g3_survei.reduce((a, b) => a + b, 0),
      labelB: 'Wawancara (Seluruh Tujuan)',
      dataB: g3_wawancara,
      totalB: g3_wawancara.reduce((a, b) => a + b, 0),
    },
    grafik4: {
      judul: 'Grafik 4: Manfaat Aksi Perubahan — Survei vs Wawancara',
      slide: 'Slide PPT 8',
      labelA: 'Survei (Manfaat)',
      dataA: g4_survei,
      totalA: g4_survei.reduce((a, b) => a + b, 0),
      labelB: 'Wawancara (Manfaat)',
      dataB: g4_wawancara,
      totalB: g4_wawancara.reduce((a, b) => a + b, 0),
    },
    grafik5: {
      judul: 'Grafik 5: Nilai Keseluruhan (L vs M) — Survei vs Wawancara',
      slide: 'Slide PPT 9',
      labelA: 'Rata-Rata Survei (L)',
      dataA: g5_survei,
      totalA: g5_survei.reduce((a, b) => a + b, 0),
      labelB: 'Rata-Rata Wawancara (M)',
      dataB: g5_wawancara,
      totalB: g5_wawancara.reduce((a, b) => a + b, 0),
    },
  };
}

/**
 * Menghitung agregat anonim pola selisih Survei (L) vs Wawancara (M) tanpa menyertakan nama/NIP.
 */
export function hitungPolaSelisihAgregat(
  listPeserta: Array<{
    hasil?: {
      rataSurveiL?: number | null;
      rataWawancaraM?: number | null;
      selisih?: number | null;
    } | null;
  }>
): SelisihAgregatSummary {
  const totalPeserta = listPeserta.length;
  let sumL = 0;
  let countL = 0;
  let sumM = 0;
  let countM = 0;
  let sumDiff = 0;
  let countPair = 0;
  let surveiJauhLebihTinggi = 0; // L - M > 15
  let wawancaraJauhLebihTinggi = 0; // M - L > 15
  let selaras = 0; // |M - L| <= 15
  let skorWawancaraRendah = 0; // M < 51
  let wawancaraKosong = 0;

  for (const p of listPeserta) {
    const l = p.hasil?.rataSurveiL;
    const m = p.hasil?.rataWawancaraM;
    const hasL = isValidNumber(l);
    const hasM = isValidNumber(m);

    if (hasL) {
      sumL += l;
      countL += 1;
    }
    if (hasM) {
      sumM += m;
      countM += 1;
      if (m < 51) {
        skorWawancaraRendah += 1;
      }
    } else {
      wawancaraKosong += 1;
    }

    if (hasL && hasM) {
      const diff = isValidNumber(p.hasil?.selisih) ? p.hasil!.selisih! : m - l;
      sumDiff += diff;
      countPair += 1;
      if (l - m > 15) {
        surveiJauhLebihTinggi += 1;
      } else if (m - l > 15) {
        wawancaraJauhLebihTinggi += 1;
      } else {
        selaras += 1;
      }
    }
  }

  return {
    totalPeserta,
    totalValidSurvei: countL,
    totalValidWawancara: countM,
    totalBerpasangan: countPair,
    rataSurveiL: countL > 0 ? Number((sumL / countL).toFixed(2)) : null,
    rataWawancaraM: countM > 0 ? Number((sumM / countM).toFixed(2)) : null,
    rataSelisih: countPair > 0 ? Number((sumDiff / countPair).toFixed(2)) : null,
    surveiJauhLebihTinggi,
    wawancaraJauhLebihTinggi,
    selaras,
    skorWawancaraRendah,
    wawancaraKosong,
  };
}

export function ringkasPolaSelisihUntukAi(stats: SelisihAgregatSummary): string {
  const avgL = stats.rataSurveiL !== null ? stats.rataSurveiL.toFixed(1) : '-';
  const avgM = stats.rataWawancaraM !== null ? stats.rataWawancaraM.toFixed(1) : '-';
  const avgDiff =
    stats.rataSelisih !== null
      ? `${stats.rataSelisih > 0 ? '+' : ''}${stats.rataSelisih.toFixed(1)}`
      : '-';

  return [
    `- Rata-rata Survei (L): ${avgL} (N=${stats.totalValidSurvei}); Rata-rata Wawancara (M): ${avgM} (N=${stats.totalValidWawancara}); Rata-rata selisih (M - L): ${avgDiff} poin.`,
    `- Pola kesenjangan (dari ${stats.totalBerpasangan} peserta berpasangan): ${stats.surveiJauhLebihTinggi} peserta skor survei jauh lebih tinggi dari wawancara (L - M > 15), ${stats.wawancaraJauhLebihTinggi} peserta wawancara jauh lebih tinggi (M - L > 15), dan ${stats.selaras} peserta relatif selaras (|M - L| <= 15).`,
    `- Kelompok prioritas perhatian: ${stats.skorWawancaraRendah} peserta memiliki skor wawancara rendah (< 51), dan ${stats.wawancaraKosong} peserta belum memiliki nilai wawancara.`,
  ].join('\n');
}

export interface AnalisisTerbukaRingkasMeta {
  kendalaTemaCount: number;
  wawancaraTemaCount: number;
  topTemaKendalaNama: string | null;
  topTemaKendalaJumlah: number | null;
  topTemaWawancaraNama: string | null;
  topTemaWawancaraJumlah: number | null;
  summaryText: string;
}

const SKIP_NO_ISSUE_THEME_RE =
  /tidak ada kendala|berjalan baik|berjalan lancar|keberhasilan implementasi|lainnya/i;

/**
 * Membaca tema terverifikasi Batch 2 (hanya agregat nama tema + jumlah catatan/peserta, tanpa PII)
 * untuk memperkaya rekomendasi tindak lanjut di Slide 6.
 */
export async function getRingkasTemaTerbukaUntukAi(
  kegiatanId: string
): Promise<AnalisisTerbukaRingkasMeta> {
  const rows = await prisma.analisisTerbuka.findMany({
    where: {
      kegiatanId,
      kategori: { in: ['kendala_survei', 'deskripsi_wawancara'] },
    },
    select: {
      kategori: true,
      temaJson: true,
      totalTeks: true,
    },
  });

  const parseTemas = (raw: unknown): StoredTemaTerbuka[] =>
    Array.isArray(raw) ? (raw as StoredTemaTerbuka[]) : [];

  const kndRow = rows.find((r) => r.kategori === 'kendala_survei');
  const wawRow = rows.find((r) => r.kategori === 'deskripsi_wawancara');
  const kndTemas = kndRow ? parseTemas(kndRow.temaJson) : [];
  const wawTemas = wawRow ? parseTemas(wawRow.temaJson) : [];

  const pickTopActionable = (temas: StoredTemaTerbuka[]) => {
    const actionable = temas.find((t) => !SKIP_NO_ISSUE_THEME_RE.test(t.namaTema || ''));
    return actionable || temas[0] || null;
  };

  const topKnd = pickTopActionable(kndTemas);
  const topWaw = pickTopActionable(wawTemas);

  const lines: string[] = [];
  if (kndTemas.length > 0) {
    lines.push(
      `Tema Kendala Terbuka Survei (${kndRow?.totalTeks ?? 0} catatan):`
    );
    for (const t of kndTemas.slice(0, 4)) {
      lines.push(`- ${t.namaTema}: ${t.jumlah} catatan (${t.jumlahPeserta} peserta unik)`);
    }
  }
  if (wawTemas.length > 0) {
    lines.push(
      `Tema Catatan Evaluator Wawancara (${wawRow?.totalTeks ?? 0} catatan):`
    );
    for (const t of wawTemas.slice(0, 4)) {
      lines.push(`- ${t.namaTema}: ${t.jumlah} catatan (${t.jumlahPeserta} peserta unik)`);
    }
  }

  return {
    kendalaTemaCount: kndTemas.length,
    wawancaraTemaCount: wawTemas.length,
    topTemaKendalaNama: topKnd?.namaTema ?? null,
    topTemaKendalaJumlah: topKnd?.jumlah ?? null,
    topTemaWawancaraNama: topWaw?.namaTema ?? null,
    topTemaWawancaraJumlah: topWaw?.jumlah ?? null,
    summaryText: lines.join('\n'),
  };
}

/**
 * Menghitung agregat anonim kelengkapan unggah dokumen evidence (InovasiProper) per kegiatan
 * tanpa menyertakan nama/NIP peserta untuk konteks Slide 6 & AI Rekomendasi.
 */
export async function getRingkasEvidenceUntukAi(
  kegiatanId: string,
  totalPesertaOverride?: number
): Promise<EvidenceAgregatSummary & { summaryText: string }> {
  const [totalPeserta, rows] = await Promise.all([
    typeof totalPesertaOverride === 'number'
      ? Promise.resolve(totalPesertaOverride)
      : prisma.peserta.count({ where: { kegiatanId } }),
    prisma.inovasiProper.findMany({
      where: { kegiatanId },
      select: {
        jangkaMenengahStatus: true,
        jangkaPanjangStatus: true,
      },
    }),
  ]);

  const sudahUnggah = rows.length;
  const belumUnggah = Math.max(0, totalPeserta - sudahUnggah);
  const menengahSudah = rows.filter(
    (r) => r.jangkaMenengahStatus === 'SUDAH_DILAKSANAKAN'
  ).length;
  const panjangSudah = rows.filter(
    (r) => r.jangkaPanjangStatus === 'SUDAH_DILAKSANAKAN'
  ).length;

  const summaryText =
    totalPeserta > 0
      ? `- Dokumen evidence diunggah: ${sudahUnggah} dari ${totalPeserta} peserta (${belumUnggah} peserta belum mengunggah).\n- Status milestone pada laporan evidence yang masuk: ${menengahSudah} peserta melaporkan jangka menengah Sudah Dilaksanakan dan ${panjangSudah} peserta melaporkan jangka panjang Sudah Dilaksanakan.`
      : '';

  return {
    totalPeserta,
    sudahUnggah,
    belumUnggah,
    menengahSudah,
    panjangSudah,
    summaryText,
  };
}

/**
 * Merakit konteks lengkap & anonim Slide 6 (Kesimpulan & Rekomendasi) secara terpusat
 * untuk digunakan bersama oleh antrean AI (`lib/ai-queue.ts`) dan route sinkron (`/api/ai/pembahasan`).
 */
export async function buildKesimpulanContext(
  kegiatanId: string,
  preloaded?: {
    totalPeserta?: number;
    rekapMap?: Record<'grafik1' | 'grafik2' | 'grafik3' | 'grafik4' | 'grafik5', RekapGrafikData>;
    konfirmasiMap?: KonfirmasiWawancaraMap;
  }
): Promise<KesimpulanContext> {
  const [rekapMap, konfirmasiMap, surveySummary, pesertaHasilRows, temaMeta, evidenceMeta] =
    await Promise.all([
      preloaded?.rekapMap ? Promise.resolve(preloaded.rekapMap) : getRekapGrafikMap(kegiatanId),
      preloaded?.konfirmasiMap
        ? Promise.resolve(preloaded.konfirmasiMap)
        : getKonfirmasiWawancaraMap(kegiatanId),
      getHasilSurveyKegiatan(kegiatanId),
      prisma.peserta.findMany({
        where: { kegiatanId },
        select: {
          hasil: {
            select: {
              rataSurveiL: true,
              rataWawancaraM: true,
              selisih: true,
            },
          },
        },
      }),
      getRingkasTemaTerbukaUntukAi(kegiatanId),
      getRingkasEvidenceUntukAi(kegiatanId, preloaded?.totalPeserta),
    ]);

  const totalPeserta = preloaded?.totalPeserta ?? pesertaHasilRows.length;
  const selisihStats = hitungPolaSelisihAgregat(pesertaHasilRows);
  const evidenceStats: EvidenceAgregatSummary = {
    totalPeserta,
    sudahUnggah: evidenceMeta.sudahUnggah,
    belumUnggah: Math.max(0, totalPeserta - evidenceMeta.sudahUnggah),
    menengahSudah: evidenceMeta.menengahSudah,
    panjangSudah: evidenceMeta.panjangSudah,
  };

  return {
    totalPeserta,
    rekapMap,
    selisihStats,
    evidenceStats,
    extraSelisihSummary: ringkasPolaSelisihUntukAi(selisihStats),
    extraSurveySummary: ringkasHasilSurveyUntukAi(surveySummary),
    extraKonfirmasiSummary: ringkasKonfirmasiUntukAi(konfirmasiMap),
    extraEvidenceSummary: evidenceMeta.summaryText || undefined,
    extraTemaTerbukaSummary: temaMeta.summaryText || undefined,
    topTemaKendalaNama: temaMeta.topTemaKendalaNama,
    topTemaKendalaJumlah: temaMeta.topTemaKendalaJumlah,
    topTemaWawancaraNama: temaMeta.topTemaWawancaraNama,
    topTemaWawancaraJumlah: temaMeta.topTemaWawancaraJumlah,
  };
}

/**
 * Mengevaluasi kelengkapan data Survei (L) dan Wawancara (M) terhadap ambang ketat 80%:
 * - blocked (< 80% atau 0 peserta): AI tidak boleh dijalankan.
 * - warning (80% - 99%): AI boleh dijalankan dengan dialog konfirmasi peringatan.
 * - ready (100%): AI langsung siap dijalankan.
 */
export function evaluateAiDataReadiness(
  stats: SelisihAgregatSummary,
  minPct = AI_MIN_COMPLETENESS_PCT
): AiDataReadiness {
  const totalPeserta = stats.totalPeserta;
  const validSurvei = stats.totalValidSurvei;
  const validWawancara = stats.totalValidWawancara;
  const missingSurvei = Math.max(0, totalPeserta - validSurvei);
  const missingWawancara = Math.max(0, totalPeserta - validWawancara);

  if (totalPeserta === 0) {
    return {
      status: 'blocked',
      minPct,
      totalPeserta: 0,
      validSurvei: 0,
      validWawancara: 0,
      missingSurvei: 0,
      missingWawancara: 0,
      surveiPct: 0,
      wawancaraPct: 0,
      message: 'Data belum lengkap: belum ada peserta terdaftar. Impor data terlebih dahulu sebelum menjalankan AI.',
    };
  }

  const surveiPct = Number(((validSurvei / totalPeserta) * 100).toFixed(1));
  const wawancaraPct = Number(((validWawancara / totalPeserta) * 100).toFixed(1));

  if (surveiPct < minPct || wawancaraPct < minPct) {
    return {
      status: 'blocked',
      minPct,
      totalPeserta,
      validSurvei,
      validWawancara,
      missingSurvei,
      missingWawancara,
      surveiPct,
      wawancaraPct,
      message: `Data belum lengkap untuk dianalisis AI (minimal ${minPct}% terisi). Saat ini survei terisi ${validSurvei}/${totalPeserta} peserta (${surveiPct}%) dan wawancara ${validWawancara}/${totalPeserta} peserta (${wawancaraPct}%). Lengkapi penilaian terlebih dahulu.`,
    };
  }

  if (missingSurvei > 0 || missingWawancara > 0) {
    const parts: string[] = [];
    if (missingSurvei > 0) {
      parts.push(`${missingSurvei} peserta belum memiliki nilai survei (${surveiPct}% terisi)`);
    }
    if (missingWawancara > 0) {
      parts.push(`${missingWawancara} peserta belum memiliki nilai wawancara (${wawancaraPct}% terisi)`);
    }
    return {
      status: 'warning',
      minPct,
      totalPeserta,
      validSurvei,
      validWawancara,
      missingSurvei,
      missingWawancara,
      surveiPct,
      wawancaraPct,
      message: `Data hampir lengkap: ${parts.join(' dan ')} dari ${totalPeserta} peserta. Hasil AI tetap dapat dibuat dari data yang masuk dan akan mencatat peserta yang belum mengisi.`,
    };
  }

  return {
    status: 'ready',
    minPct,
    totalPeserta,
    validSurvei,
    validWawancara,
    missingSurvei: 0,
    missingWawancara: 0,
    surveiPct: 100,
    wawancaraPct: 100,
    message: `Seluruh data survei dan wawancara (${totalPeserta} peserta) sudah lengkap 100% dan siap dianalisis AI.`,
  };
}

export async function getAiDataReadiness(kegiatanId: string): Promise<AiDataReadiness> {
  const rows = await prisma.peserta.findMany({
    where: { kegiatanId },
    select: {
      hasil: {
        select: {
          rataSurveiL: true,
          rataWawancaraM: true,
          selisih: true,
        },
      },
    },
  });
  return evaluateAiDataReadiness(hitungPolaSelisihAgregat(rows));
}
