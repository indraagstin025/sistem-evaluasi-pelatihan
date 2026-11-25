/**
 * lib/ai-jawaban-terbuka.ts
 * Batch 2: AI Analisis Jawaban Terbuka (Kendala Survei, Dukungan Survei, & Catatan Wawancara Evaluator)
 *
 * Prinsip wajib:
 * 1. Hanya teks anonim yang dikirim ke Gemini (tanpa nama, NIP, email, atau nomor telepon).
 * 2. Setiap tema diverifikasi terhadap ID jawaban nyata; jumlah catatan & peserta dihitung server.
 * 3. Bila Gemini gagal atau verifikasi ditolak, jatuh ke pengelompokan templat deterministik.
 * 4. Setiap tema tetap dapat ditelusuri sampai ke jawaban asli peserta pada antarmuka internal.
 */

import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import {
  DEFAULT_GEMINI_MODEL,
  parseAiJsonResponse,
  resolveGeminiModelOrder,
  sanitizeAiErrorMessage,
  sanitizeAiPromptText,
} from './ai';

export type AnalisisTerbukaKategori =
  | 'kendala_survei'
  | 'dukungan_survei'
  | 'deskripsi_wawancara';

export const ANALISIS_TERBUKA_KATEGORI_LIST: readonly AnalisisTerbukaKategori[] = [
  'kendala_survei',
  'dukungan_survei',
  'deskripsi_wawancara',
] as const;

export const ANALISIS_TERBUKA_META: Record<
  AnalisisTerbukaKategori,
  {
    judul: string;
    deskripsi: string;
    sumberLabel: string;
    instruksiKonteks: string;
  }
> = {
  kendala_survei: {
    judul: 'Analisis Tema Kendala Terbuka (Survei)',
    deskripsi:
      'Pengelompokan jawaban terbuka butir kendala lain dari alumni dan atasan agar hambatan dominan terbaca cepat.',
    sumberLabel: 'Butir Kendala Lain (Survei)',
    instruksiKonteks:
      'jawaban terbuka kendala/hambatan pelaksanaan aksi perubahan dari survei alumni dan atasan',
  },
  dukungan_survei: {
    judul: 'Analisis Tema Dukungan Terbuka (Survei)',
    deskripsi:
      'Pengelompokan jawaban terbuka faktor pendukung dari alumni dan atasan beserta jumlah penyebutannya.',
    sumberLabel: 'Butir Dukungan Lain (Survei)',
    instruksiKonteks:
      'jawaban terbuka faktor pendukung pelaksanaan aksi perubahan dari survei alumni dan atasan',
  },
  deskripsi_wawancara: {
    judul: 'Analisis Tema Catatan Evaluator (Wawancara)',
    deskripsi:
      'Pengelompokan catatan deskripsi evaluator pada 5 kriteria penilaian wawancara untuk melihat pola temuan lapangan.',
    sumberLabel: 'Deskripsi Form Penilaian Wawancara',
    instruksiKonteks:
      'catatan evaluator wawancara pasca pelatihan pada 5 kriteria penilaian (jangka menengah, jangka panjang, seluruh tujuan, manfaat, komunikasi)',
  },
};

const KRITERIA_LABEL: Record<string, string> = {
  menengah: 'Jangka Menengah',
  jangkaPanjang: 'Jangka Panjang',
  seluruhTujuan: 'Seluruh Tujuan',
  manfaat: 'Manfaat',
  komunikasi: 'Komunikasi',
};

export interface SumberTeksTerbuka {
  recordId: string;
  token: string; // Anonymous prompt token: T01, T02, ...
  pesertaId: string;
  pesertaNama: string;
  labelKonteks: string; // "Alumni" | "Atasan" | "Jangka Menengah" | ...
  teksAsli: string;
  teksAnonim: string;
}

export interface StoredTemaTerbuka {
  namaTema: string;
  ringkasan: string;
  recordIds: string[];
  jumlah: number;
  jumlahPeserta: number;
}

export interface HydratedSumberItem {
  recordId: string;
  pesertaId: string;
  pesertaNama: string;
  labelKonteks: string;
  teks: string;
  linkWawancara: string;
}

export interface HydratedTemaTerbuka {
  namaTema: string;
  ringkasan: string;
  jumlah: number;
  jumlahPeserta: number;
  persentase: number;
  sumberItems: HydratedSumberItem[];
}

export interface AnalisisTerbukaView {
  kategori: AnalisisTerbukaKategori;
  judul: string;
  deskripsi: string;
  sumberLabel: string;
  hasSavedResult: boolean;
  isStale: boolean;
  totalTeksAktual: number;
  totalPesertaAktual: number;
  totalTeksTersimpan: number;
  sumber: 'ai' | 'template' | null;
  modelUsed: string | null;
  catatan: string | null;
  updatedAt: string | null;
  temas: HydratedTemaTerbuka[];
}

export function isValidAnalisisTerbukaKategori(
  val: unknown
): val is AnalisisTerbukaKategori {
  return (
    typeof val === 'string' &&
    (ANALISIS_TERBUKA_KATEGORI_LIST as readonly string[]).includes(val)
  );
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const HONORIFIC_PREFIX_RE =
  /^(?:dr\.?|drs\.?|dra\.?|ir\.?|prof\.?|h\.?|hj\.?|kh\.?|ust\.?|bpk\.?|bapak|ibu)\s+/i;

const DEGREE_SUFFIX_RE =
  /(?:,|\s)+(?:s\.[a-z]{1,6}\.?|m\.[a-z]{1,6}\.?|a\.md\.?|ph\.d\.?|s\.sos\.?|m\.si\.?|s\.kom\.?|m\.kom\.?|s\.ip\.?|m\.ap\.?|s\.e\.?|m\.m\.?|s\.h\.?|m\.h\.?|s\.pd\.?|m\.pd\.?)(?=\s|,|$)/gi;

function extractCleanNameVariants(rawName: string | null | undefined): string[] {
  const trimmed = String(rawName || '').trim();
  if (trimmed.length < 4) return [];

  const variants = new Set<string>();
  variants.add(trimmed);

  let core = trimmed.replace(DEGREE_SUFFIX_RE, ' ').trim();
  while (HONORIFIC_PREFIX_RE.test(core)) {
    core = core.replace(HONORIFIC_PREFIX_RE, '').trim();
  }
  core = core.replace(/[,.;]+$/g, '').replace(/\s+/g, ' ').trim();
  if (core.length >= 4) {
    variants.add(core);
  }

  return Array.from(variants).sort((a, b) => b.length - a.length);
}

/**
 * Membersihkan teks bebas dari identitas pribadi (nama peserta/atasan, NIP/NIK 16-18 digit,
 * alamat email, dan nomor telepon) sebelum dikirim ke Gemini API.
 */
export function scrubTeksUntukAi(
  rawText: string,
  sensitiveNames: string[] = [],
  maxLength = 280
): string {
  let cleaned = sanitizeAiPromptText(String(rawText || ''));

  // Redaksi nomor telepon Indonesia (+628..., 628..., 08...)
  cleaned = cleaned.replace(
    /(?:^|[\s(:])(?:\+62|62|0)8[1-9][0-9\-\s.]{6,13}\b/g,
    ' [REDACT_TELP]'
  );

  // Redaksi nama lengkap peserta/atasan bila kebetulan tertulis di dalam catatan bebas
  const uniquePatterns = new Set<string>();
  for (const name of sensitiveNames) {
    for (const variant of extractCleanNameVariants(name)) {
      if (variant.length >= 4) {
        uniquePatterns.add(variant);
      }
    }
  }

  const sortedNames = Array.from(uniquePatterns).sort((a, b) => b.length - a.length);
  for (const pattern of sortedNames) {
    const re = new RegExp(`\\b${escapeRegExp(pattern)}\\b`, 'gi');
    cleaned = cleaned.replace(re, '[PESERTA]');
  }

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  if (cleaned.length > maxLength) {
    return `${cleaned.slice(0, maxLength - 3).trim()}...`;
  }
  return cleaned;
}

function isSubstantiveOpenText(raw: string | null | undefined): boolean {
  const clean = String(raw || '').trim();
  if (!clean) return false;
  if (/^[-–—_.,:;!?/\\()\[\]\s]+$/.test(clean)) return false;
  return true;
}

function formatToken(indexZeroBased: number): string {
  return `T${String(indexZeroBased + 1).padStart(2, '0')}`;
}

/**
 * Mengambil seluruh sumber jawaban terbuka untuk 1 kegiatan & 1 kategori,
 * sekaligus menyiapkan teks anonim & token anonim untuk prompt Gemini.
 */
export async function collectSumberTeksTerbuka(
  kegiatanId: string,
  kategori: AnalisisTerbukaKategori
): Promise<SumberTeksTerbuka[]> {
  if (kategori === 'kendala_survei' || kategori === 'dukungan_survei') {
    const kode = kategori === 'kendala_survei' ? 'KND_TEXT' : 'DUK_TEXT';
    const rows = await prisma.survey.findMany({
      where: {
        kode,
        peserta: { kegiatanId },
      },
      select: {
        id: true,
        responden: true,
        jawabanTeks: true,
        peserta: {
          select: {
            id: true,
            nama: true,
            namaAtasan: true,
          },
        },
      },
      orderBy: [{ peserta: { nama: 'asc' } }, { responden: 'asc' }, { id: 'asc' }],
    });

    const allSensitiveNames = rows.flatMap((r) => [
      r.peserta.nama,
      r.peserta.namaAtasan || '',
    ]);

    const items: SumberTeksTerbuka[] = [];
    for (const r of rows) {
      if (!isSubstantiveOpenText(r.jawabanTeks)) continue;
      const teksAsli = String(r.jawabanTeks).trim();
      items.push({
        recordId: r.id,
        token: formatToken(items.length),
        pesertaId: r.peserta.id,
        pesertaNama: r.peserta.nama,
        labelKonteks: r.responden === 'atasan' ? 'Atasan' : 'Alumni',
        teksAsli,
        teksAnonim: scrubTeksUntukAi(teksAsli, allSensitiveNames),
      });
    }
    return items;
  }

  // kategori === 'deskripsi_wawancara'
  const rows = await prisma.wawancara.findMany({
    where: {
      peserta: { kegiatanId },
      deskripsi: { not: null },
    },
    select: {
      id: true,
      kriteria: true,
      deskripsi: true,
      peserta: {
        select: {
          id: true,
          nama: true,
          namaAtasan: true,
        },
      },
    },
    orderBy: [{ peserta: { nama: 'asc' } }, { kriteria: 'asc' }, { id: 'asc' }],
  });

  const allSensitiveNames = rows.flatMap((r) => [
    r.peserta.nama,
    r.peserta.namaAtasan || '',
  ]);

  const items: SumberTeksTerbuka[] = [];
  for (const r of rows) {
    if (!isSubstantiveOpenText(r.deskripsi)) continue;
    const teksAsli = String(r.deskripsi).trim();
    items.push({
      recordId: r.id,
      token: formatToken(items.length),
      pesertaId: r.peserta.id,
      pesertaNama: r.peserta.nama,
      labelKonteks: KRITERIA_LABEL[r.kriteria] || r.kriteria,
      teksAsli,
      teksAnonim: scrubTeksUntukAi(teksAsli, allSensitiveNames),
    });
  }
  return items;
}

const PLACEHOLDER_RE = /(lorem ipsum|placeholder|\bTODO\b|\bN\/A\b|tema\s*#\d)/i;
const OVERPROMISE_RE =
  /\b(?:pasti|dijamin|dipastikan)\s+(?:akan\s+)?(?:meningkat|naik|berhasil|optimal|tercapai\s+100%)/i;

function normalizePromptToken(raw: unknown): string | null {
  const str = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/^\[|\]$/g, '');
  const m = /^T0*(\d+)$/.exec(str);
  if (!m) return null;
  const num = Number(m[1]);
  if (!Number.isInteger(num) || num <= 0) return null;
  return `T${String(num).padStart(2, '0')}`;
}

export interface VerifikasiTemaResult {
  ok: boolean;
  themes: StoredTemaTerbuka[];
  reason?: string;
}

/**
 * VERIFIKATOR DETERMINISTIK TEMA AI (Zero-Hallucination Guard)
 * - Memeriksa setiap sourceId terhadap daftar jawaban nyata (menolak ID fiktif).
 * - Menghitung ulang `jumlah` catatan dan `jumlahPeserta` unik 100% di server.
 * - Menjamin cakupan minimal 75% jawaban terpetakan oleh AI, dan menempatkan sisa valid ke bucket transparan.
 */
export function verifikasiDanNormalisasiTema(
  rawParsed: any,
  sumberList: SumberTeksTerbuka[]
): VerifikasiTemaResult {
  if (sumberList.length === 0) {
    return { ok: true, themes: [] };
  }

  const rawThemes = Array.isArray(rawParsed?.themes)
    ? rawParsed.themes
    : Array.isArray(rawParsed?.tema)
      ? rawParsed.tema
      : null;

  if (!rawThemes || rawThemes.length === 0 || rawThemes.length > 10) {
    return { ok: false, themes: [], reason: 'Struktur daftar tema AI tidak valid (harus 1-10 tema).' };
  }

  const tokenToItem = new Map<string, SumberTeksTerbuka>();
  for (const item of sumberList) {
    tokenToItem.set(item.token, item);
  }

  const usedRecordIds = new Set<string>();
  const verifiedThemes: StoredTemaTerbuka[] = [];

  for (const entry of rawThemes) {
    const namaTema = String(entry?.namaTema ?? entry?.nama ?? '').trim();
    const ringkasan = String(entry?.ringkasan ?? entry?.deskripsi ?? '').trim();
    const rawIds = Array.isArray(entry?.sourceIds)
      ? entry.sourceIds
      : Array.isArray(entry?.ids)
        ? entry.ids
        : null;

    if (!namaTema || namaTema.length < 3 || namaTema.length > 90 || PLACEHOLDER_RE.test(namaTema)) {
      return { ok: false, themes: [], reason: `Nama tema AI tidak valid: "${namaTema}".` };
    }
    if (
      !ringkasan ||
      ringkasan.length < 10 ||
      ringkasan.length > 360 ||
      PLACEHOLDER_RE.test(ringkasan) ||
      OVERPROMISE_RE.test(ringkasan)
    ) {
      return { ok: false, themes: [], reason: `Ringkasan tema AI tidak lolos verifikasi: "${namaTema}".` };
    }
    if (!rawIds || rawIds.length === 0) {
      continue;
    }

    const themeRecordIds: string[] = [];
    const themePesertaIds = new Set<string>();

    for (const rawId of rawIds) {
      const normalizedToken = normalizePromptToken(rawId);
      if (!normalizedToken || !tokenToItem.has(normalizedToken)) {
        return {
          ok: false,
          themes: [],
          reason: `AI merujuk ID jawaban yang tidak ada di data (${String(rawId)}).`,
        };
      }
      const matched = tokenToItem.get(normalizedToken)!;
      if (usedRecordIds.has(matched.recordId)) {
        // Satu jawaban dihitung di 1 tema utama agar total tidak ganda
        continue;
      }
      usedRecordIds.add(matched.recordId);
      themeRecordIds.push(matched.recordId);
      themePesertaIds.add(matched.pesertaId);
    }

    if (themeRecordIds.length > 0) {
      verifiedThemes.push({
        namaTema,
        ringkasan,
        recordIds: themeRecordIds,
        jumlah: themeRecordIds.length,
        jumlahPeserta: themePesertaIds.size,
      });
    }
  }

  if (verifiedThemes.length === 0) {
    return { ok: false, themes: [], reason: 'Tidak ada tema valid yang terhubung ke jawaban asli.' };
  }

  const minCoverage = Math.max(1, Math.ceil(sumberList.length * 0.75));
  if (usedRecordIds.size < minCoverage) {
    return {
      ok: false,
      themes: [],
      reason: `Cakupan pemetaan AI terlalu rendah (${usedRecordIds.size}/${sumberList.length} jawaban).`,
    };
  }

  // Sortir tema utama berdasarkan jumlah catatan terbanyak
  verifiedThemes.sort((a, b) => b.jumlah - a.jumlah || a.namaTema.localeCompare(b.namaTema));

  // Jika ada sisa jawaban valid (<25%) yang belum masuk tema AI, masukkan secara transparan
  const unmapped = sumberList.filter((item) => !usedRecordIds.has(item.recordId));
  if (unmapped.length > 0) {
    const pesertaSet = new Set(unmapped.map((i) => i.pesertaId));
    verifiedThemes.push({
      namaTema: 'Lainnya / Jawaban Spesifik',
      ringkasan:
        'Jawaban atau catatan spesifik yang berada di luar kelompok tema utama dan tetap ditautkan ke sumber aslinya.',
      recordIds: unmapped.map((i) => i.recordId),
      jumlah: unmapped.length,
      jumlahPeserta: pesertaSet.size,
    });
  }

  return { ok: true, themes: verifiedThemes };
}

interface FallbackRule {
  namaTema: string;
  ringkasan: string;
  pattern: RegExp;
}

const FALLBACK_RULES: Record<AnalisisTerbukaKategori, FallbackRule[]> = {
  kendala_survei: [
    {
      namaTema: 'Tidak Ada Kendala / Berjalan Baik',
      ringkasan:
        'Responden menyatakan pelaksanaan aksi perubahan berjalan lancar, terkendali, atau tidak menemui kendala berarti.',
      pattern:
        /\b(tidak ada kendala|tdk ada kendala|nihil|belum ada kendala|berjalan baik|berjalan lancar|lancar|masih bisa terkendali|terkendali|aman|tidak ditemukan kendala)\b/i,
    },
    {
      namaTema: 'Keterbatasan SDM, Kompetensi & Mutasi',
      ringkasan:
        'Hambatan terkait jumlah atau kompetensi sumber daya manusia, beban kerja pegawai, maupun rotasi/mutasi petugas.',
      pattern:
        /\b(sdm|sumber daya manusia|pegawai|petugas|operator|personil|personel|kompetensi|mutasi|rotasi|pindah|beban kerja|kekurangan tenaga|kurang tenaga)\b/i,
    },
    {
      namaTema: 'Anggaran, Sarana Prasarana & Sistem Digital',
      ringkasan:
        'Keterbatasan dukungan anggaran, fasilitas kerja, jaringan internet, maupun pemeliharaan aplikasi/sistem digital.',
      pattern:
        /\b(anggaran|dana|biaya|apbd|sarana|prasarana|fasilitas|peralatan|server|jaringan|internet|aplikasi|website|sistem|digital|teknologi|error|mati)\b/i,
    },
    {
      namaTema: 'Koordinasi, Regulasi & Pengawasan',
      ringkasan:
        'Tantangan pada koordinasi lintas unit/instansi, kejelasan regulasi/SOP, komitmen, serta konsistensi pengawasan.',
      pattern:
        /\b(koordinasi|regulasi|aturan|kebijakan|sop|pengawsan|pengawasan|monitoring|evaluasi|birokrasi|komitmen|pimpinan|stakeholder|lintas|waktu)\b/i,
    },
    {
      namaTema: 'Pemahaman & Partisipasi Masyarakat/Pengguna',
      ringkasan:
        'Adaptasi masyarakat atau pengguna layanan terhadap perubahan sistem serta kebutuhan sosialisasi dan apresiasi berkelanjutan.',
      pattern:
        /\b(masyarakat|pengguna|warga|sosialisasi|edukasi|literasi|partisipasi|apresiasi|pengemudi|pelanggan|publik|pemahaman|belum paham)\b/i,
    },
  ],
  dukungan_survei: [
    {
      namaTema: 'Dukungan Pimpinan, OPD & Instansi Pemerintah',
      ringkasan:
        'Dukungan langsung dari pimpinan perangkat daerah, mentor, atasan, serta unit pemerintah terkait.',
      pattern:
        /\b(pimpinan|kepala|dinas|opd|pemerintah|pemda|instansi|camat|lurah|mentor|atasan|sekda|bupati|kadis|kabid)\b/i,
    },
    {
      namaTema: 'Kolaborasi Mitra, Swasta & Lintas Sektor',
      ringkasan:
        'Fasilitasi dan kerja sama dari mitra eksternal, perbankan daerah, perusahaan, aparat penegak hukum, atau lintas sektor.',
      pattern:
        /\b(bank|bjb|perusahaan|mitra|swasta|stakeholder|kepolisian|kepolosian|polres|tni|lintas|kolaborasi|kerjasama|kerja sama|pihak ketiga|asosiasi)\b/i,
    },
    {
      namaTema: 'Dukungan Anggaran, Regulasi & Fasilitas',
      ringkasan:
        'Ketersediaan pembiayaan (APBD/anggaran), dasar hukum/regulasi, serta sarana prasarana pendukung implementasi.',
      pattern:
        /\b(apbd|anggaran|dana|biaya|regulasi|peraturan|perbup|sk|kebijakan|fasilitas|sarana|prasarana|aplikasi|sistem|teknologi)\b/i,
    },
    {
      namaTema: 'Partisipasi Masyarakat & Tim Kerja Internal',
      ringkasan:
        'Keterlibatan aktif masyarakat pengguna layanan serta kekompakan tim efektif dan pegawai internal.',
      pattern:
        /\b(masyarakat|maysrakat|warga|pengguna|pengguma|tim|pegawai|staf|rekan|komunitas|partisipasi|antusias|internal|sdm)\b/i,
    },
  ],
  deskripsi_wawancara: [
    {
      namaTema: 'Kendala Teknis, Sistem & Target Belum Tercapai',
      ringkasan:
        'Catatan evaluator mengenai target yang belum tercapai optimal, aplikasi/website bermasalah, atau ketergantungan pihak ketiga.',
      pattern:
        /\b(mati|rusak|pihak ke\s*3|pihak ketiga|tidak tercapai|belum tercapai|kendala|terhambat|berhenti|belum berjalan|belum terlaksana|tidak berjalan|kurang optimal|anggaran)\b/i,
    },
    {
      namaTema: 'Implementasi Berlanjut, Bimtek & Monitoring Rutin',
      ringkasan:
        'Catatan evaluator bahwa aksi perubahan masih berjalan, dilaksanakan melalui bimtek/sosialisasi, atau dimonitor secara berkala.',
      pattern:
        /\b(berjalan|berlanjut|rutin|monitoring|evaluasi|digunakan|aktif|terlaksana|dilaksanakan|bimtek|sosialisasi|tiap hari|setiap hari|tercapai)\b/i,
    },
    {
      namaTema: 'Manfaat Nyata & Kemudahan Layanan',
      ringkasan:
        'Catatan evaluator tentang manfaat langsung berupa kemudahan pengaduan, pembayaran, percepatan pelayanan, atau efisiensi kerja.',
      pattern:
        /\b(mempermudah|manfaat|bermanfaat|efektif|efisien|cepat|pengaduan|pelayanan|layanan|pembayaran|masyarakat|membantu|meningkatkan)\b/i,
    },
    {
      namaTema: 'Status Penugasan, Mutasi & Unit Kerja Peserta',
      ringkasan:
        'Catatan evaluator mengenai status penugasan peserta di instansi asal, perpindahan/mutasi jabatan, atau implementasi lintas UPT.',
      pattern:
        /\b(mutasi|pindah|rotasi|pensiun|masih bertugas|bertugas|jabatan|upt|instansi tersebut)\b/i,
    },
  ],
};

/**
 * FALLBACK TEMPLAT DETERMINISTIK
 * Digunakan bila Gemini API tidak tersedia, gagal jaringan, atau hasil AI tidak lolos verifikasi.
 * Seluruh jumlah & tautan sumber tetap 100% akurat terhadap database.
 */
export function buatTemaFallbackDeterministik(
  kategori: AnalisisTerbukaKategori,
  sumberList: SumberTeksTerbuka[]
): StoredTemaTerbuka[] {
  if (sumberList.length === 0) return [];

  const rules = FALLBACK_RULES[kategori];
  const buckets = new Map<
    string,
    { namaTema: string; ringkasan: string; items: SumberTeksTerbuka[] }
  >();

  for (const r of rules) {
    buckets.set(r.namaTema, { namaTema: r.namaTema, ringkasan: r.ringkasan, items: [] });
  }
  const otherKey = 'Lainnya / Jawaban Spesifik';
  buckets.set(otherKey, {
    namaTema: otherKey,
    ringkasan:
      'Jawaban atau catatan yang memuat konteks khusus dan tidak termasuk kata kunci kelompok utama.',
    items: [],
  });

  for (const item of sumberList) {
    let matched = false;
    for (const r of rules) {
      if (r.pattern.test(item.teksAsli)) {
        buckets.get(r.namaTema)!.items.push(item);
        matched = true;
        break;
      }
    }
    if (!matched) {
      buckets.get(otherKey)!.items.push(item);
    }
  }

  const themes: StoredTemaTerbuka[] = [];
  for (const [key, bucket] of Array.from(buckets.entries())) {
    if (bucket.items.length === 0) continue;
    const pesertaSet = new Set(bucket.items.map((i) => i.pesertaId));
    themes.push({
      namaTema: bucket.namaTema,
      ringkasan: bucket.ringkasan,
      recordIds: bucket.items.map((i) => i.recordId),
      jumlah: bucket.items.length,
      jumlahPeserta: pesertaSet.size,
    });
    void key;
  }

  // Urutkan terbanyak dahulu, tapi taruh "Lainnya" paling bawah
  themes.sort((a, b) => {
    if (a.namaTema === otherKey) return 1;
    if (b.namaTema === otherKey) return -1;
    return b.jumlah - a.jumlah;
  });

  return themes;
}

const GEMINI_OPEN_TEXT_TIMEOUT_MS = 25_000;
const GEMINI_OPEN_TEXT_LARGE_TIMEOUT_MS = 45_000;

function buildOpenTextPrompt(
  kategori: AnalisisTerbukaKategori,
  sumberList: SumberTeksTerbuka[]
): string {
  const meta = ANALISIS_TERBUKA_META[kategori];
  const isLarge = sumberList.length > 60;
  const maxSnippet = isLarge ? 150 : 280;
  const daftarAnonim = sumberList
    .map((item) => {
      const snippet =
        item.teksAnonim.length > maxSnippet
          ? `${item.teksAnonim.slice(0, maxSnippet - 3).trim()}...`
          : item.teksAnonim;
      return isLarge
        ? `${item.token}: ${snippet}`
        : `[${item.token}] (${item.labelKonteks}) ${snippet}`;
    })
    .join('\n');

  const rawPrompt = `Anda adalah analis evaluasi pasca pelatihan di BPSDM Provinsi Jawa Barat.
Berikut adalah ${sumberList.length} ${meta.instruksiKonteks} yang seluruhnya telah dianonimkan:

${daftarAnonim}

Tugas Anda:
1. Kelompokkan seluruh kode jawaban [T01] s.d. [${sumberList[sumberList.length - 1]?.token}] ke dalam 3 sampai 7 tema utama berbahasa Indonesia yang jelas, ringkas, dan tidak saling tumpang tindih.
2. Setiap kode jawaban [Txx] WAJIB dimasukkan ke TEPAT SATU tema yang paling sesuai (jangan membiarkan jawaban tercecer, dan DILARANG KERAS mengarang kode [Txx] yang tidak ada di daftar).
3. Untuk setiap tema, tulis:
   - "namaTema": judul tema singkat (maksimal 8 kata).
   - "ringkasan": 1 kalimat ringkas faktual yang merangkum pola jawaban dalam tema tersebut (tanpa janji hasil pasti dan tanpa mengarang angka di luar data).
   - "sourceIds": array kode token persis seperti di daftar (contoh: ["T01", "T04"]).
4. Jika ada jawaban menyatakan "tidak ada kendala" / "berjalan lancar", jadikan tema tersendiri (misalnya "Tidak Ada Kendala / Berjalan Baik").

Format balasan WAJIB berupa JSON murni:
{
  "themes": [
    {
      "namaTema": "...",
      "ringkasan": "...",
      "sourceIds": ["T01", "T02"]
    }
  ]
}`;

  return sanitizeAiPromptText(rawPrompt);
}

/**
 * Memanggil Google Gemini API (dengan model order tervalidasi & header x-goog-api-key)
 * untuk mengelompokkan jawaban terbuka anonim, lalu memverifikasi 100% terhadap data nyata.
 */
export async function analisisJawabanTerbukaDenganAi(
  kegiatanId: string,
  kategori: AnalisisTerbukaKategori
): Promise<AnalisisTerbukaView> {
  const sumberList = await collectSumberTeksTerbuka(kegiatanId, kategori);

  if (sumberList.length === 0) {
    await prisma.analisisTerbuka.deleteMany({
      where: { kegiatanId, kategori },
    });
    return hydrateAnalisisTerbuka(kegiatanId, kategori, sumberList, null);
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const configuredModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  let finalThemes: StoredTemaTerbuka[] | null = null;
  let sumber: 'ai' | 'template' = 'template';
  let modelUsed: string | null = null;
  let catatan: string | null = null;

  if (!apiKey) {
    catatan = 'GEMINI_API_KEY belum dikonfigurasi; menggunakan pengelompokan templat deterministik.';
  } else {
    const prompt = buildOpenTextPrompt(kategori, sumberList);
    const modelsToTry = resolveGeminiModelOrder(configuredModel);
    const timeoutMs =
      sumberList.length > 60
        ? GEMINI_OPEN_TEXT_LARGE_TIMEOUT_MS
        : GEMINI_OPEN_TEXT_TIMEOUT_MS;
    let lastReason = 'Respons Gemini tidak dapat diverifikasi.';

    for (const m of modelsToTry) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${m}:generateContent`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.15,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json().catch(() => null);
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = parseAiJsonResponse(rawText);
          const verified = verifikasiDanNormalisasiTema(parsed, sumberList);
          if (verified.ok && verified.themes.length > 0) {
            finalThemes = verified.themes;
            sumber = 'ai';
            modelUsed = m;
            catatan = `Terverifikasi terhadap ${sumberList.length} sumber jawaban asli.`;
            break;
          }
          lastReason = sanitizeAiErrorMessage(
            verified.reason || `Hasil Gemini (${m}) tidak lolos verifikasi tema`
          );
          console.warn(`[analisis-terbuka:${kategori}] Model ${m} ditolak verifikator:`, lastReason);
        } else {
          lastReason = sanitizeAiErrorMessage(`Gemini API (${m}) mengembalikan status ${response.status}`);
          console.warn(`[analisis-terbuka:${kategori}] ${lastReason}`);
        }
      } catch (err: any) {
        const isAbort = err?.name === 'AbortError';
        lastReason = isAbort
          ? `Batas waktu ${timeoutMs / 1000}d terlewati pada ${m}`
          : sanitizeAiErrorMessage(err?.message, `Gagal menghubungi Gemini API (${m})`);
        console.error(`[analisis-terbuka:${kategori}] Error ${m}:`, lastReason);
      } finally {
        clearTimeout(timeoutHandle);
      }
    }

    if (!finalThemes) {
      catatan = `Fallback templat deterministik aktif (${lastReason}).`;
    }
  }

  if (!finalThemes) {
    finalThemes = buatTemaFallbackDeterministik(kategori, sumberList);
    sumber = 'template';
    modelUsed = null;
  }

  const saved = await prisma.analisisTerbuka.upsert({
    where: { kegiatanId_kategori: { kegiatanId, kategori } },
    update: {
      temaJson: finalThemes as unknown as Prisma.InputJsonValue,
      totalTeks: sumberList.length,
      sumber,
      modelUsed,
      catatan,
    },
    create: {
      kegiatanId,
      kategori,
      temaJson: finalThemes as unknown as Prisma.InputJsonValue,
      totalTeks: sumberList.length,
      sumber,
      modelUsed,
      catatan,
    },
  });

  return hydrateAnalisisTerbuka(kegiatanId, kategori, sumberList, saved);
}

/**
 * Menghidrasi tema tersimpan di database dengan teks jawaban asli & tautan ke halaman wawancara peserta
 * (hanya untuk konsumsi antarmuka internal terautentikasi).
 */
export function hydrateAnalisisTerbuka(
  kegiatanId: string,
  kategori: AnalisisTerbukaKategori,
  sumberList: SumberTeksTerbuka[],
  saved: {
    temaJson: unknown;
    totalTeks: number;
    sumber: string;
    modelUsed: string | null;
    catatan: string | null;
    updatedAt: Date;
  } | null
): AnalisisTerbukaView {
  const meta = ANALISIS_TERBUKA_META[kategori];
  const recordMap = new Map(sumberList.map((s) => [s.recordId, s]));
  const totalPesertaAktual = new Set(sumberList.map((s) => s.pesertaId)).size;

  if (!saved) {
    return {
      kategori,
      judul: meta.judul,
      deskripsi: meta.deskripsi,
      sumberLabel: meta.sumberLabel,
      hasSavedResult: false,
      isStale: false,
      totalTeksAktual: sumberList.length,
      totalPesertaAktual,
      totalTeksTersimpan: 0,
      sumber: null,
      modelUsed: null,
      catatan: null,
      updatedAt: null,
      temas: [],
    };
  }

  const storedArray = Array.isArray(saved.temaJson)
    ? (saved.temaJson as StoredTemaTerbuka[])
    : [];

  let missingAnyRecord = false;
  const temas: HydratedTemaTerbuka[] = [];
  const totalBase = Math.max(1, sumberList.length);

  for (const t of storedArray) {
    const recIds = Array.isArray(t?.recordIds) ? t.recordIds : [];
    const hydratedItems: HydratedSumberItem[] = [];
    const pesertaSet = new Set<string>();

    for (const recId of recIds) {
      const matched = recordMap.get(recId);
      if (!matched) {
        missingAnyRecord = true;
        continue;
      }
      pesertaSet.add(matched.pesertaId);
      hydratedItems.push({
        recordId: matched.recordId,
        pesertaId: matched.pesertaId,
        pesertaNama: matched.pesertaNama,
        labelKonteks: matched.labelKonteks,
        teks: matched.teksAsli,
        linkWawancara: `/kegiatan/${kegiatanId}/wawancara/${matched.pesertaId}`,
      });
    }

    if (hydratedItems.length === 0) continue;

    temas.push({
      namaTema: String(t.namaTema || 'Tema'),
      ringkasan: String(t.ringkasan || ''),
      jumlah: hydratedItems.length,
      jumlahPeserta: pesertaSet.size,
      persentase: Math.round((hydratedItems.length / totalBase) * 100),
      sumberItems: hydratedItems,
    });
  }

  const isStale =
    saved.totalTeks !== sumberList.length || missingAnyRecord;

  return {
    kategori,
    judul: meta.judul,
    deskripsi: meta.deskripsi,
    sumberLabel: meta.sumberLabel,
    hasSavedResult: true,
    isStale,
    totalTeksAktual: sumberList.length,
    totalPesertaAktual,
    totalTeksTersimpan: saved.totalTeks,
    sumber: saved.sumber === 'ai' ? 'ai' : 'template',
    modelUsed: saved.modelUsed,
    catatan: saved.catatan,
    updatedAt: saved.updatedAt.toISOString(),
    temas,
  };
}

/**
 * Mengambil seluruh status & hasil analisis jawaban terbuka (3 kategori) untuk 1 kegiatan.
 */
export async function getAnalisisTerbukaKegiatan(
  kegiatanId: string
): Promise<Record<AnalisisTerbukaKategori, AnalisisTerbukaView>> {
  const [savedRows, kndList, dukList, wawList] = await Promise.all([
    prisma.analisisTerbuka.findMany({ where: { kegiatanId } }),
    collectSumberTeksTerbuka(kegiatanId, 'kendala_survei'),
    collectSumberTeksTerbuka(kegiatanId, 'dukungan_survei'),
    collectSumberTeksTerbuka(kegiatanId, 'deskripsi_wawancara'),
  ]);

  const savedByKat = new Map(savedRows.map((row) => [row.kategori, row]));

  return {
    kendala_survei: hydrateAnalisisTerbuka(
      kegiatanId,
      'kendala_survei',
      kndList,
      savedByKat.get('kendala_survei') ?? null
    ),
    dukungan_survei: hydrateAnalisisTerbuka(
      kegiatanId,
      'dukungan_survei',
      dukList,
      savedByKat.get('dukungan_survei') ?? null
    ),
    deskripsi_wawancara: hydrateAnalisisTerbuka(
      kegiatanId,
      'deskripsi_wawancara',
      wawList,
      savedByKat.get('deskripsi_wawancara') ?? null
    ),
  };
}
