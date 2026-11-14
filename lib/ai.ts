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
      poin2 = `Rentang Dominan (51-75%): Hasil survei (${a3} orang) dibanding hasil wawancara (${b3} orang).`;
      poin3 = `Rentang Optimal (76-100%): Hasil wawancara (${b4} orang) dibanding hasil survei (${a4} orang).`;
      poin4 = `Rentang Rendah (26-50%): Hasil survei (${a2} orang) dibanding hasil wawancara (${b2} orang).`;
      break;

    case 'grafik4':
      // Slide 8 PPT: Manfaat Aksi Perubahan
      judul = 'Manfaat Aksi Perubahan';
      poin1 = `Penilaian terhadap manfaat aksi perubahan antara hasil survei dan wawancara.`;
      poin2 = `Rentang Optimal (76-100%): Hasil wawancara (${b4} orang) dibanding hasil survei (${a4} orang).`;
      poin3 = `Rentang Dominan (51-75%): Hasil survei (${a3} orang) dibanding hasil wawancara (${b3} orang).`;
      poin4 = `Rentang Rendah (26-50%): Hasil survei (${a2} orang) dan hasil wawancara (${b2} orang).`;
      break;

    case 'grafik5':
      // Slide 9 PPT: Nilai Keseluruhan
      judul = 'Nilai Keseluruhan';
      poin1 = `Rekapitulasi nilai keseluruhan antara rata-rata survei (L) dan wawancara (M).`;
      poin2 = `Rentang Dominan (51-75%): Hasil wawancara (${b3} orang) dibanding hasil survei (${a3} orang).`;
      poin3 = `Rentang Optimal (76-100%): Hasil survei (${a4} orang) dibanding hasil wawancara (${b4} orang).`;
      poin4 = `Rentang Rendah (26-50%): Hasil survei (${a2} orang) dan hasil wawancara (${b2} orang).`;
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
 * PENGAMAN ANGKA (NUMBER SAFEGUARD - URD Bab 7.2)
 * Memeriksa apakah teks yang dihasilkan AI memuat 4 angka kunci:
 * jumlah orang rentang 76-100 dan 51-75 untuk dataA dan dataB.
 */
export function verifikasiHasilAI(
  teks: string,
  rekap: RekapGrafikData
): boolean {
  if (!teks || typeof teks !== 'string') return false;

  const optA = String(rekap.dataA[4] ?? 0);
  const optB = String(rekap.dataB[4] ?? 0);
  const domA = String(rekap.dataA[3] ?? 0);
  const domB = String(rekap.dataB[3] ?? 0);

  // Periksa apakah keempat angka muncul di dalam teks
  const hasOptA = new RegExp(`\\b${optA}\\b`).test(teks);
  const hasOptB = new RegExp(`\\b${optB}\\b`).test(teks);
  const hasDomA = new RegExp(`\\b${domA}\\b`).test(teks);
  const hasDomB = new RegExp(`\\b${domB}\\b`).test(teks);

  return hasOptA && hasOptB && hasDomA && hasDomB;
}

/**
 * PENGAMAN NARASI KESIMPULAN AI (R-7)
 * Memastikan struktur 4 poin terisi substantif, angka total peserta tercantum
 * akurat bila tersedia, dan tidak ada angka jumlah orang/peserta yang melampaui totalPeserta.
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

  if (sections.length !== 4 || sections.some((s) => s.length < 5)) {
    return false;
  }

  if (/(lorem ipsum|placeholder)/i.test(teks)) {
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
 * Helper untuk mem-parsing respons JSON dari model Google Gemini
 * Menangani kasus jika output dibungkus markdown code fences (```json ... ```)
 */
function parseAiJsonResponse(rawText: string): any {
  if (!rawText) return null;
  let text = rawText.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(text);
}

interface AiProviderConfig {
  geminiApiKey?: string;
  geminiModel: string;
}

export interface AiExecutionMeta {
  item: PembahasanItem;
  modelUsed: string | null;
  rateLimited: boolean;
  errorMessage?: string;
}

const GEMINI_FALLBACK_MODELS = [
  'models/gemini-3.8-flash',
  'models/gemini-3.5-flash-lite',
] as const;

const GEMINI_REQUEST_TIMEOUT_MS = 25_000;

interface RawAiAttemptResult {
  item: PembahasanItem | null;
  modelUsed: string | null;
  rateLimited: boolean;
  errorMessage?: string;
}

/**
 * Helper terpadu memanggil Google Gemini API dan memvalidasi JSON 4 poin.
 */
async function requestAiPembahasan(
  prompt: string,
  grafikKey: string,
  judul: string,
  config: AiProviderConfig,
  validate?: (teksLengkap: string) => boolean
): Promise<RawAiAttemptResult> {
  const formatResult = (parsed: any): PembahasanItem | null => {
    if (!parsed?.poin1 || !parsed?.poin2 || !parsed?.poin3 || !parsed?.poin4) {
      return null;
    }
    const poin1 = String(parsed.poin1).trim();
    const poin2 = String(parsed.poin2).trim();
    const poin3 = String(parsed.poin3).trim();
    const poin4 = String(parsed.poin4).trim();
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

  if (config.geminiApiKey && config.geminiApiKey.trim() !== '') {
    const modelsToTry = Array.from(
      new Set([config.geminiModel, ...GEMINI_FALLBACK_MODELS])
    );

    for (const m of modelsToTry) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${m}:generateContent?key=${config.geminiApiKey.trim()}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          const result = formatResult(parseAiJsonResponse(rawText));
          if (result) {
            return {
              item: result,
              modelUsed: m,
              rateLimited: false,
            };
          }
          lastError = `Verifikasi hasil Gemini (${m}) tidak lolos cek angka/struktur KP-05`;
          console.warn(`Verifikasi hasil Gemini (${m}) untuk ${grafikKey} tidak sesuai, mencoba model fallback Gemini lain`);
        } else {
          const errText = await response.text();
          if (response.status === 429 || response.status === 503) {
            hitRateLimit = true;
          }
          lastError = `Gemini API (${m}) status ${response.status}`;
          console.warn(`Gemini API (${m}) returned ${response.status}:`, errText);
        }
      } catch (err: any) {
        const isAbort = err?.name === 'AbortError';
        if (isAbort) hitRateLimit = true;
        lastError = isAbort
          ? `Timeout ${GEMINI_REQUEST_TIMEOUT_MS / 1000}s saat memanggil ${m}`
          : err?.message || `Gagal menghubungi Gemini API (${m})`;
        console.error(`Error memanggil Gemini API (${m}):`, err);
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
  kesimpulanCtx?: KesimpulanContext
): Promise<AiExecutionMeta> {
  const rawGeminiModel = process.env.GEMINI_MODEL || 'deep-research-preview-04-2026';
  const config: AiProviderConfig = {
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: rawGeminiModel.startsWith('models/') ? rawGeminiModel : `models/${rawGeminiModel}`,
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

    const promptKesimpulan = `Anda adalah analis evaluasi pasca pelatihan di BPSDM Provinsi Jawa Barat.
Berikut adalah data rekapitulasi aktual dari ${kesimpulanCtx?.totalPeserta ?? 'seluruh'} peserta terdaftar:
${ringkasanTeks}

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

  const promptGrafik = `Anda adalah analis evaluasi pasca pelatihan di BPSDM Provinsi Jawa Barat.
Tugas Anda adalah menulis narasi Pembahasan 4 poin gaya slide ekspose resmi untuk grafik berikut:

Judul: "${rekap.judul}"
Data ${rekap.labelA}: [Rentang 0: ${rekap.dataA[0]}, Rentang 1-25: ${rekap.dataA[1]}, Rentang 26-50: ${rekap.dataA[2]}, Rentang 51-75: ${rekap.dataA[3]}, Rentang 76-100: ${rekap.dataA[4]}]
Data ${rekap.labelB}: [Rentang 0: ${rekap.dataB[0]}, Rentang 1-25: ${rekap.dataB[1]}, Rentang 26-50: ${rekap.dataB[2]}, Rentang 51-75: ${rekap.dataB[3]}, Rentang 76-100: ${rekap.dataB[4]}]

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
  kesimpulanCtx?: KesimpulanContext
): Promise<PembahasanItem> {
  const { item } = await buatPembahasanGrafikWithMeta(grafikKey, rekap, kesimpulanCtx);
  return item;
}
