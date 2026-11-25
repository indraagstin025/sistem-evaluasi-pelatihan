/**
 * lib/ai.ts
 * Modul Penjelasan AI & Pembahasan 5 Grafik Ekspose + Kesimpulan & Rekomendasi
 * Berdasarkan URD Versi 1.2 Bab 7 dan Slide Paparan Resmi BPSDM (Slide 4-9).
 */

export interface RekapGrafikData {
  judul: string;
  slide: string;
  labelA: string;
  dataA: number[]; // [0, 1-25, 26-50, 51-75, 76-100]
  totalA: number;
  labelB: string;
  dataB: number[]; // [0, 1-25, 26-50, 51-75, 76-100]
  totalB: number;
}

export interface PembahasanItem {
  grafikKey: string;
  judul: string;
  poin1: string;
  poin2: string;
  poin3: string;
  poin4: string;
  teksLengkap: string;
  sumber: 'template' | 'ai' | 'manual';
}

export interface KesimpulanContext {
  totalPeserta: number;
  rekapMap?: Record<string, RekapGrafikData>;
  extraSurveySummary?: string;
  extraKonfirmasiSummary?: string;
}

function ringkasRentangDominan(dataA: number[], dataB: number[]) {
  const labels = ['0%', '1-25%', '26-50%', '51-75%', '76-100%'];
  let bestIdx = 4;
  let bestTotal = -1;
  for (let i = 0; i < 5; i++) {
    const sum = (dataA[i] ?? 0) + (dataB[i] ?? 0);
    if (sum >= bestTotal) {
      bestTotal = sum;
      bestIdx = i;
    }
  }
  return {
    idx: bestIdx,
    label: labels[bestIdx],
    a: dataA[bestIdx] ?? 0,
    b: dataB[bestIdx] ?? 0,
  };
}

/**
 * RUMUS PEMBAHASAN TEMPLAT BAKU RESMI (KP-05 & PPTX BPSDM)
 * Menghasilkan butir pembahasan yang 100% cocok dengan angka rekapitulasi data
 * dan tata bahasa resmi dari slide presentasi evaluasi pasca pelatihan.
 */
export function generatePembahasanTemplate(
  grafikKey: string,
  rekap?: RekapGrafikData
): PembahasanItem {
  const dataA = rekap?.dataA || [0, 0, 0, 0, 0];
  const dataB = rekap?.dataB || [0, 0, 0, 0, 0];
  const a0 = dataA[0] ?? 0;
  const a1 = dataA[1] ?? 0;
  const a2 = dataA[2] ?? 0;
  const a3 = dataA[3] ?? 0;
  const a4 = dataA[4] ?? 0;
  const b2 = dataB[2] ?? 0;
  const b3 = dataB[3] ?? 0;
  const b4 = dataB[4] ?? 0;
  const dom = ringkasRentangDominan(dataA, dataB);

  let poin1 = '';
  let poin2 = '';
  let poin3 = '';
  let poin4 = '';
  let judul = rekap?.judul || '';

  if (grafikKey !== 'kesimpulan' && (rekap?.totalA ?? 0) === 0 && (rekap?.totalB ?? 0) === 0) {
    return {
      grafikKey,
      judul: judul || `Grafik ${grafikKey}`,
      poin1: 'Belum ada data peserta.',
      poin2: 'Silakan impor file Excel survei dan wawancara dari menu Daftar Peserta.',
      poin3: 'Seluruh distribusi rentang saat ini bernilai 0 responden.',
      poin4: 'Pembahasan akan dibuat otomatis setelah data diimpor.',
      teksLengkap: 'Belum ada data peserta.',
      sumber: 'template',
    };
  }

  switch (grafikKey) {
    case 'grafik1':
      // Slide 5 PPT: Perbandingan Capaian Jangka Menengah dengan Jangka Panjang (Hasil wawancara)
      judul = 'Perbandingan Capaian Jangka Menengah dengan Jangka Panjang (Hasil wawancara)';
      poin1 = `Distribusi capaian Rencana Aksi jangka menengah dan jangka panjang berdasarkan hasil wawancara.`;
      poin2 = `Sebanyak ${a4} orang mencapai capaian jangka menengah di atas 75%, sedangkan pada jangka panjang tercatat ${b4} orang.`;
      poin3 = `Selain itu, ${a3} orang berada pada kategori 51–75% untuk jangka menengah, dan ${a2 + a1 + a0} orang berada pada rentang <= 50%.`;
      poin4 = `Secara keseluruhan, ringkasan ini dihitung langsung dari data valid yang tersimpan di database.`;
      break;

    case 'grafik2':
      // Slide 6 PPT: Target Aksi Perubahan Dalam Jangka Panjang Tercapai
      judul = 'Target Aksi Perubahan Dalam Jangka Panjang Tercapai';
      poin1 = `Perbandingan capaian target aksi perubahan jangka panjang antara hasil survei dan hasil wawancara.`;
      poin2 = `Di rentang 76-100%: Hasil wawancara (${b4} orang) dibanding hasil survei (${a4} orang).`;
      poin3 = `Di rentang 51-75%: Hasil survei (${a3} orang) dibanding hasil wawancara (${b3} orang).`;
      poin4 = `Di rentang 26-50%: Hasil survei (${a2} orang) dibanding hasil wawancara (${b2} orang). Di rentang 1-25%: tercatat ${a1} orang pada survei dan ${dataB[1] ?? 0} orang pada wawancara.`;
      break;

    case 'grafik3':
      // Slide 7 PPT: Seluruh Tujuan Aksi Perubahan Dapat Tercapai
      judul = 'Seluruh Tujuan Aksi Perubahan Dapat Tercapai';
      poin1 = `Sebaran pencapaian seluruh tujuan aksi perubahan antara hasil survei dan wawancara.`;
      poin2 = `Rentang Dominan (${dom.label}): Hasil survei (${dom.a} orang) dibanding hasil wawancara (${dom.b} orang).`;
      poin3 = `Rentang Optimal (76-100%): Hasil wawancara (${b4} orang) dibanding hasil survei (${a4} orang).`;
      poin4 = `Rentang Menengah & Rendah: Pada 51-75% tercatat ${a3} survei dan ${b3} wawancara; pada 26-50% tercatat ${a2} survei dan ${b2} wawancara.`;
      break;

    case 'grafik4':
      // Slide 8 PPT: Manfaat Aksi Perubahan
      judul = 'Manfaat Aksi Perubahan';
      poin1 = `Penilaian terhadap manfaat aksi perubahan antara hasil survei dan wawancara.`;
      poin2 = `Rentang Optimal (76-100%): Hasil wawancara (${b4} orang) dibanding hasil survei (${a4} orang).`;
      poin3 = `Rentang Dominan (${dom.label}): Hasil survei (${dom.a} orang) dibanding hasil wawancara (${dom.b} orang).`;
      poin4 = `Rentang Menengah & Rendah: Pada 51-75% tercatat ${a3} survei dan ${b3} wawancara; pada 26-50% tercatat ${a2} survei dan ${b2} wawancara.`;
      break;

    case 'grafik5':
      // Slide 9 PPT: Nilai Keseluruhan
      judul = 'Nilai Keseluruhan';
      poin1 = `Rekapitulasi nilai keseluruhan antara rata-rata survei (L) dan wawancara (M).`;
      poin2 = `Rentang Dominan (${dom.label}): Hasil wawancara (${dom.b} orang) dibanding hasil survei (${dom.a} orang).`;
      poin3 = `Rentang Optimal (76-100%): Hasil survei (${a4} orang) dibanding hasil wawancara (${b4} orang).`;
      poin4 = `Rentang Menengah & Rendah: Pada 51-75% tercatat ${a3} survei dan ${b3} wawancara; pada 26-50% tercatat ${a2} survei dan ${b2} wawancara.`;
      break;

    case 'kesimpulan':
    default:
      // Slide 4 PPT: Kesimpulan dan Rekomendasi (rekomendasi dikosongkan agar dibuat oleh AI)
      judul = 'Kesimpulan dan Rekomendasi';
      poin1 = `Ringkasan capaian hasil wawancara dan survei alumni siap dianalisis menggunakan AI dari data peserta aktif.`;
      poin2 = '';
      poin3 = '';
      poin4 = '';
      break;
  }

  const teksLengkap = [poin1, poin2, poin3, poin4]
    .filter(Boolean)
    .map((p) => `• ${p}`)
    .join('\n');

  return {
    grafikKey,
    judul,
    poin1,
    poin2,
    poin3,
    poin4,
    teksLengkap,
    sumber: 'template',
  };
}

/**
 * Sanitasi pesan error AI agar tidak pernah membocorkan API key, query string,
 * atau stack trace mentah ke database AiJob maupun antarmuka pengguna.
 */
export function sanitizeAiErrorMessage(raw: unknown, fallback = 'Gagal memproses respons AI'): string {
  const str = String(raw || '').trim();
  if (!str) return fallback;
  const cleaned = str
    .replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]')
    .replace(/\b(?:AIza[0-9A-Za-z_-]{20,}|AQ\.[0-9A-Za-z._-]{12,})\b/g, '[REDACTED_KEY]')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 200 ? `${cleaned.slice(0, 197)}...` : cleaned;
}

/**
 * Lapis pengaman privasi (defense-in-depth) sebelum prompt dikirim ke Gemini:
 * memastikan pola NIP/NIK 16-18 digit atau alamat email tidak pernah terkirim keluar.
 */
export function sanitizeAiPromptText(prompt: string): string {
  return String(prompt || '')
    .replace(/\b\d{16,18}\b/g, '[REDACT_ID]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACT_EMAIL]');
}

const UNSUITABLE_MODEL_RE =
  /(?:deep-research|-tts\b|-image\b|nano-banana|lyria|robotics|computer-use|transcribe)/i;

export const DEFAULT_GEMINI_MODEL = 'models/gemini-3.5-flash-lite';

export const GEMINI_FALLBACK_MODELS = [
  'models/gemini-3.5-flash-lite',
  'models/gemini-3.6-flash',
  'models/gemini-3.5-flash',
] as const;

/**
 * Menyusun urutan model Gemini yang cocok untuk keluaran JSON cepat & terstruktur.
 * Model yang tidak cocok (mis. deep-research, TTS, image, audio) otomatis dilewati
 * agar tidak memicu timeout sebelum jatuh ke model Flash yang stabil.
 */
export function resolveGeminiModelOrder(configuredModel?: string): string[] {
  const normalized = (configuredModel || '').trim();
  const candidates: string[] = [];

  if (normalized && !UNSUITABLE_MODEL_RE.test(normalized)) {
    candidates.push(normalized.startsWith('models/') ? normalized : `models/${normalized}`);
  }

  for (const fallback of GEMINI_FALLBACK_MODELS) {
    candidates.push(fallback);
  }

  return Array.from(new Set(candidates));
}

/**
 * PENGAMAN ANGKA (NUMBER SAFEGUARD - URD Bab 7.2)
 * Memeriksa apakah teks yang dihasilkan AI memuat 4 poin substantif,
 * 4 angka kunci (rentang 76-100 & 51-75 untuk dataA dan dataB),
 * serta tidak mengklaim jumlah orang melebihi total responden valid.
 */
export function verifikasiHasilAI(
  teks: string,
  rekap: RekapGrafikData
): boolean {
  if (!teks || typeof teks !== 'string') return false;
  if (/(lorem ipsum|placeholder|\bTODO\b|\bN\/A\b)/i.test(teks)) return false;

  const sections = teks.includes('• ')
    ? teks
        .split(/\r?\n(?=• )/)
        .map((s) => s.replace(/^•\s*/, '').trim())
    : teks
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

  if (sections.length !== 4 || sections.some((s) => s.length < 10)) {
    return false;
  }

  const checkKeyNumber = (val: number): boolean => {
    if (val === 0) {
      return /\b0\b|tidak ada|nihil|nol/i.test(teks);
    }
    return new RegExp(`\\b${val}\\b`).test(teks);
  };

  const optA = rekap.dataA[4] ?? 0;
  const optB = rekap.dataB[4] ?? 0;
  const domA = rekap.dataA[3] ?? 0;
  const domB = rekap.dataB[3] ?? 0;

  if (!checkKeyNumber(optA) || !checkKeyNumber(optB) || !checkKeyNumber(domA) || !checkKeyNumber(domB)) {
    return false;
  }

  const maxTotal = Math.max(rekap.totalA ?? 0, rekap.totalB ?? 0);
  if (maxTotal > 0) {
    const countPattern =
      /(?:^|[^\d.,\-–%])\b(\d+)\s+(?:orang|peserta|responden|alumni)\b/gi;
    const contextIgnorePattern =
      /\b(?:tahun|angkatan|periode|skala|skor|nilai|rentang|kategori|bab|slide|grafik|pkp)\s*$/i;

    for (const match of Array.from(teks.matchAll(countPattern))) {
      const fullIndex = match.index ?? 0;
      const before = teks.slice(Math.max(0, fullIndex - 24), fullIndex);
      if (contextIgnorePattern.test(before)) continue;
      const num = Number(match[1]);
      if (!Number.isNaN(num) && num > maxTotal) {
        return false;
      }
    }
  }

  return true;
}

const OVERPROMISE_RE =
  /\b(?:pasti|dijamin|dipastikan)\s+(?:akan\s+)?(?:meningkat|naik|berhasil|optimal|tercapai\s+100%)/i;

/**
 * PENGAMAN NARASI KESIMPULAN AI (R-7)
 * Memastikan struktur 4 poin terisi substantif, angka total peserta tercantum
 * akurat bila tersedia, tidak ada klaim jumlah melebihi totalPeserta,
 * dan tidak memuat janji hasil pasti tanpa dasar data.
 */
export function verifikasiKesimpulanAI(
  teks: string,
  kesimpulanCtx?: KesimpulanContext
): boolean {
  if (!teks || typeof teks !== 'string') return false;

  const sections = teks.includes('• ')
    ? teks
        .split(/\r?\n(?=• )/)
        .map((s) => s.replace(/^•\s*/, '').trim())
    : teks
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

  if (sections.length !== 4 || sections.some((s) => s.length < 10)) {
    return false;
  }

  if (/(lorem ipsum|placeholder|\bTODO\b|\bN\/A\b)/i.test(teks)) {
    return false;
  }

  if (OVERPROMISE_RE.test(teks)) {
    return false;
  }

  const totalPeserta = kesimpulanCtx?.totalPeserta;
  if (typeof totalPeserta === 'number' && totalPeserta > 0) {
    // Wajib menyebut total peserta aktual agar kesimpulan tertambat ke dataset aktif
    if (!new RegExp(`\\b${totalPeserta}\\b`).test(teks)) {
      return false;
    }

    // Tolak jika terdapat klaim jumlah orang/peserta/responden/alumni melebihi totalPeserta
    const countPattern =
      /(?:^|[^\d.,\-–%])\b(\d+)\s+(?:orang|peserta|responden|alumni)\b/gi;
    const contextIgnorePattern =
      /\b(?:tahun|angkatan|periode|skala|skor|nilai|rentang|kategori|bab|slide|grafik|pkp)\s*$/i;

    for (const match of Array.from(teks.matchAll(countPattern))) {
      const fullIndex = match.index ?? 0;
      const before = teks.slice(Math.max(0, fullIndex - 24), fullIndex);
      if (contextIgnorePattern.test(before)) continue;
      const num = Number(match[1]);
      if (!Number.isNaN(num) && num > totalPeserta) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Helper tahan banting untuk mem-parsing respons JSON dari model Google Gemini.
 * Menangani markdown code fences (```json ... ```), objek terbungkus array, dan teks pengantar
 * tanpa melempar SyntaxError tak tertangani.
 */
export function parseAiJsonResponse(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') return null;
  let text = rawText.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
      return parsed[0];
    }
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

interface AiProviderConfig {
  geminiApiKey?: string;
  geminiModel?: string;
}

export interface AiExecutionMeta {
  item: PembahasanItem;
  modelUsed: string | null;
  rateLimited: boolean;
  errorMessage?: string;
}

const GEMINI_REQUEST_TIMEOUT_MS = 15_000;

interface RawAiAttemptResult {
  item: PembahasanItem | null;
  modelUsed: string | null;
  rateLimited: boolean;
  errorMessage?: string;
}

/**
 * Helper terpadu memanggil Google Gemini API via header x-goog-api-key dan memvalidasi JSON 4 poin.
 */
async function requestAiPembahasan(
  prompt: string,
  grafikKey: string,
  judul: string,
  config: AiProviderConfig,
  validate?: (teksLengkap: string) => boolean
): Promise<RawAiAttemptResult> {
  const safePrompt = sanitizeAiPromptText(prompt);

  const formatResult = (parsed: any): PembahasanItem | null => {
    if (!parsed?.poin1 || !parsed?.poin2 || !parsed?.poin3 || !parsed?.poin4) {
      return null;
    }
    const poin1 = String(parsed.poin1).trim();
    const poin2 = String(parsed.poin2).trim();
    const poin3 = String(parsed.poin3).trim();
    const poin4 = String(parsed.poin4).trim();
    if (!poin1 || !poin2 || !poin3 || !poin4) return null;

    const teksLengkap = [poin1, poin2, poin3, poin4].map((p) => `• ${p}`).join('\n');

    if (validate && !validate(teksLengkap)) {
      return null;
    }

    return {
      grafikKey,
      judul,
      poin1,
      poin2,
      poin3,
      poin4,
      teksLengkap,
      sumber: 'ai',
    };
  };

  let hitRateLimit = false;
  let lastError: string | undefined;

  const apiKey = config.geminiApiKey?.trim();
  if (apiKey) {
    const modelsToTry = resolveGeminiModelOrder(config.geminiModel);

    for (const m of modelsToTry) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);
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
            contents: [{ parts: [{ text: safePrompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json().catch(() => null);
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          const result = formatResult(parseAiJsonResponse(rawText));
          if (result) {
            return {
              item: result,
              modelUsed: m,
              rateLimited: false,
            };
          }
          lastError = `Hasil Gemini (${m}) tidak lolos verifikasi angka/struktur`;
          console.warn(
            `Verifikasi hasil Gemini (${m}) untuk ${grafikKey} tidak sesuai, mencoba model fallback lain`
          );
        } else {
          if (response.status === 429 || response.status === 503) {
            hitRateLimit = true;
          }
          lastError = sanitizeAiErrorMessage(`Gemini API (${m}) status ${response.status}`);
          console.warn(`Gemini API (${m}) returned status ${response.status} untuk ${grafikKey}`);
        }
      } catch (err: any) {
        const isAbort = err?.name === 'AbortError';
        if (isAbort) hitRateLimit = true;
        lastError = isAbort
          ? `Batas waktu ${GEMINI_REQUEST_TIMEOUT_MS / 1000}d terlewati pada ${m}`
          : sanitizeAiErrorMessage(err?.message, `Gagal menghubungi Gemini API (${m})`);
        console.error(`Error memanggil Gemini API (${m}) untuk ${grafikKey}:`, lastError);
      } finally {
        clearTimeout(timeoutHandle);
      }
    }
  }

  return {
    item: null,
    modelUsed: null,
    rateLimited: hitRateLimit,
    errorMessage: lastError,
  };
}

/**
 * Menjalankan generasi pembahasan beserta metadata eksekusi (modelUsed & rateLimited)
 * untuk mendukung retry backoff pada queue worker.
 */
export async function buatPembahasanGrafikWithMeta(
  grafikKey: string,
  rekap?: RekapGrafikData,
  kesimpulanCtx?: KesimpulanContext,
  konfirmasiSummary?: string
): Promise<AiExecutionMeta> {
  const config: AiProviderConfig = {
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  };

  if (!config.geminiApiKey || config.geminiApiKey.trim() === '') {
    return {
      item: generatePembahasanTemplate(grafikKey, rekap),
      modelUsed: null,
      rateLimited: false,
      errorMessage: 'GEMINI_API_KEY kosong, memakai templat KP-05',
    };
  }

  // Khusus Slide Kesimpulan dan Rekomendasi (memakai ringkasan data aktual)
  if (grafikKey === 'kesimpulan') {
    const ringkasanTeks = kesimpulanCtx?.rekapMap
      ? Object.values(kesimpulanCtx.rekapMap)
          .map(
            (g) =>
              `- ${g.judul}\n  ${g.labelA} (N=${g.totalA}): [0: ${g.dataA[0]}, 1-25: ${g.dataA[1]}, 26-50: ${g.dataA[2]}, 51-75: ${g.dataA[3]}, 76-100: ${g.dataA[4]}]\n  ${g.labelB} (N=${g.totalB}): [0: ${g.dataB[0]}, 1-25: ${g.dataB[1]}, 26-50: ${g.dataB[2]}, 51-75: ${g.dataB[3]}, 76-100: ${g.dataB[4]}]`
          )
          .join('\n')
      : 'Ringkasan data terlampir pada database aktif.';

    const totalPesertaLabel =
      typeof kesimpulanCtx?.totalPeserta === 'number' && kesimpulanCtx.totalPeserta > 0
        ? ` — wajib cantumkan angka total ${kesimpulanCtx.totalPeserta} peserta`
        : '';

    const surveyContextBlock = kesimpulanCtx?.extraSurveySummary
      ? `\nRingkasan Hasil Survei Keseluruhan (Alumni vs Atasan):\n${kesimpulanCtx.extraSurveySummary}\n`
      : '';

    const konfirmasiContextBlock = kesimpulanCtx?.extraKonfirmasiSummary
      ? `\nRekapitulasi Status Konfirmasi Wawancara 5 Kriteria (Data Aktual Database):\n${kesimpulanCtx.extraKonfirmasiSummary}\n`
      : '';

    const promptKesimpulan = `Anda adalah analis evaluasi pasca pelatihan di BPSDM Provinsi Jawa Barat.
Berikut adalah data rekapitulasi aktual dari ${kesimpulanCtx?.totalPeserta ?? 'seluruh'} peserta terdaftar:
${ringkasanTeks}${surveyContextBlock}${konfirmasiContextBlock}

Susunlah narasi resmi Slide Kesimpulan & Rekomendasi berbasis data aktual di atas (jangan mengarang angka di luar data):
- "poin1": Paragraf kesimpulan umum tentang capaian implementasi aksi perubahan peserta berdasarkan data survei dan wawancara aktual${totalPesertaLabel}.
- "poin2": Paragraf analisis perbandingan kesenjangan antara hasil survei alumni dengan hasil wawancara evaluator, serta kondisi peserta dengan skor rendah/kosong bila ada.
- "poin3": Satu butir rekomendasi kebijakan pertama yang konkret, spesifik, dan langsung menjawab temuan data di atas (tanpa nomor di awal kalimat).
- "poin4": Dua butir rekomendasi kebijakan lanjutan yang konkret untuk keberlanjutan/replikasi dan penguatan aspek lemah berdasarkan data di atas, pisahkan tepat dengan satu baris baru (\\n) tanpa nomor urut di awal kalimat.

Format balasan wajib JSON:
{
  "poin1": "...",
  "poin2": "...",
  "poin3": "...",
  "poin4": "..."
}`;

    const aiAttempt = await requestAiPembahasan(
      promptKesimpulan,
      'kesimpulan',
      'Kesimpulan dan Rekomendasi',
      config,
      (teksLengkap) => verifikasiKesimpulanAI(teksLengkap, kesimpulanCtx)
    );
    return {
      item: aiAttempt.item || generatePembahasanTemplate('kesimpulan'),
      modelUsed: aiAttempt.modelUsed,
      rateLimited: aiAttempt.rateLimited,
      errorMessage: aiAttempt.errorMessage,
    };
  }

  // Untuk Grafik 1 s.d. 5
  if (!rekap) {
    return {
      item: generatePembahasanTemplate(grafikKey),
      modelUsed: null,
      rateLimited: false,
      errorMessage: 'Data rekap grafik tidak ditemukan',
    };
  }

  const konfirmasiBlock = konfirmasiSummary
    ? `\nCatatan Data Status Konfirmasi Wawancara Terkait (Data Aktual Database):\n${konfirmasiSummary}\n(Jangan mengarang angka di luar data di atas.)\n`
    : '';

  const promptGrafik = `Anda adalah analis evaluasi pasca pelatihan di BPSDM Provinsi Jawa Barat.
Tugas Anda adalah menulis narasi Pembahasan 4 poin gaya slide ekspose resmi untuk grafik berikut:

Judul: "${rekap.judul}"
Data ${rekap.labelA}: [Rentang 0: ${rekap.dataA[0]}, Rentang 1-25: ${rekap.dataA[1]}, Rentang 26-50: ${rekap.dataA[2]}, Rentang 51-75: ${rekap.dataA[3]}, Rentang 76-100: ${rekap.dataA[4]}]
Data ${rekap.labelB}: [Rentang 0: ${rekap.dataB[0]}, Rentang 1-25: ${rekap.dataB[1]}, Rentang 26-50: ${rekap.dataB[2]}, Rentang 51-75: ${rekap.dataB[3]}, Rentang 76-100: ${rekap.dataB[4]}]
${konfirmasiBlock}
Wajib susun tepat 4 poin berurutan dan akurat:
Poin 1: Konsentrasi penilaian secara umum.
Poin 2: Rentang Optimal (76-100) — wajib sebutkan angka ${rekap.dataA[4]} dan ${rekap.dataB[4]}.
Poin 3: Rentang Dominan (51-75) — wajib sebutkan angka ${rekap.dataA[3]} dan ${rekap.dataB[3]}.
Poin 4: Rentang Rendah (26-50).

Format balasan wajib JSON:
{
  "poin1": "...",
  "poin2": "...",
  "poin3": "...",
  "poin4": "..."
}`;

  const aiAttempt = await requestAiPembahasan(
    promptGrafik,
    grafikKey,
    rekap.judul,
    config,
    (teksLengkap) => verifikasiHasilAI(teksLengkap, rekap)
  );
  return {
    item: aiAttempt.item || generatePembahasanTemplate(grafikKey, rekap),
    modelUsed: aiAttempt.modelUsed,
    rateLimited: aiAttempt.rateLimited,
    errorMessage: aiAttempt.errorMessage,
  };
}

/**
 * GENERATOR PEMBAHASAN AI / FALLBACK TEMPLATE
 * Menggunakan Google Gemini API (GEMINI_API_KEY, default model deep-research-preview-04-2026)
 * dengan fallback internal sesama model Gemini bila terkena batas kuota.
 * Jika tidak ada kunci API atau verifikasi gagal, otomatis menggunakan templat resmi (KP-05).
 */
export async function buatPembahasanGrafik(
  grafikKey: string,
  rekap?: RekapGrafikData,
  kesimpulanCtx?: KesimpulanContext,
  konfirmasiSummary?: string
): Promise<PembahasanItem> {
  const { item } = await buatPembahasanGrafikWithMeta(
    grafikKey,
    rekap,
    kesimpulanCtx,
    konfirmasiSummary
  );
  return item;
}
