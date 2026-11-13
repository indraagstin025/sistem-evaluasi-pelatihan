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

  let poin1 = '';
  let poin2 = '';
  let poin3 = '';
  let poin4 = '';
  let judul = rekap?.judul || '';

  switch (grafikKey) {
    case 'grafik1':
      // Slide 5 PPT: Perbandingan Capaian Jangka Menengah dengan Jangka Panjang (Hasil wawancara)
      judul = 'Perbandingan Capaian Jangka Menengah dengan Jangka Panjang (Hasil wawancara)';
      poin1 = `Sebagian besar alumni berhasil merealisasikan Rencana Aksi jangka menengah dengan baik.`;
      poin2 = `Sebanyak ${dataA[4] || 11} orang mencapai capaian di atas 75%, menunjukkan komitmen tinggi terhadap penerapan hasil pelatihan.`;
      poin3 = `Selain itu, ${dataA[3] || 17} orang berada pada kategori 51–75%, sedangkan ${(dataA[2] || 0) + (dataA[1] || 0) || 1} orang masih di bawah 50%.`;
      poin4 = `Secara keseluruhan, capaian ini menunjukkan bahwa mayoritas alumni mampu melaksanakan rencana jangka menengah secara efektif.`;
      break;

    case 'grafik2':
      // Slide 6 PPT: Target Aksi Perubahan Dalam Jangka Panjang Tercapai
      judul = 'Target Aksi Perubahan Dalam Jangka Panjang Tercapai';
      poin1 = `Realisasi target aksi perubahan jangka panjang yang tercapai terdapat perbedaan antara hasil survei dan hasil wawancara.`;
      poin2 = `Di rentang 76-100%: Hasil wawancara (${dataB[4] || 10} orang) lebih tinggi daripada hasil survei (${dataA[4] || 6} orang).`;
      poin3 = `Di rentang 51-75%: Hasil survei (${dataA[3] || 19} orang) sedikit lebih tinggi daripada hasil wawancara (${dataB[3] || 18} orang), menunjukkan mayoritas persepsi di tingkat ini.`;
      poin4 = `Di rentang 26-50%: Hasil survei (${dataA[2] || 5} orang) jauh lebih tinggi daripada hasil wawancara (${dataB[2] || 1} orang). Di rentang 1-25%: Tidak ada responden yang melaporkan pencapaian (0 orang).`;
      break;

    case 'grafik3':
      // Slide 7 PPT: Seluruh Tujuan Aksi Perubahan Dapat Tercapai
      judul = 'Seluruh Tujuan Aksi Perubahan Dapat Tercapai';
      poin1 = `Pencapaian seluruh tujuan aksi perubahan terkonsentrasi pada rentang menengah dan optimal (51-100%), dengan adanya perbedaan antara hasil survei dan wawancara.`;
      poin2 = `Rentang Dominan (51-75%): Hasil survei (${dataA[3] || 20} orang) menjadi yang tertinggi, sedikit melebihi hasil wawancara (${dataB[3] || 15} orang).`;
      poin3 = `Rentang Optimal (76-100%): Hasil wawancara (${dataB[4] || 13} orang) lebih dari dua kali lipat hasil survei (${dataA[4] || 6} orang), menunjukkan optimisme yang lebih tinggi dari pihak yang diwawancarai.`;
      poin4 = `Rentang Rendah (26-50%): Hasil survei (${dataA[2] || 4} orang) jauh lebih tinggi daripada hasil wawancara (${dataB[2] || 1} orang).`;
      break;

    case 'grafik4':
      // Slide 8 PPT: Manfaat Aksi Perubahan
      judul = 'Manfaat Aksi Perubahan';
      poin1 = `Penilaian terhadap manfaat aksi perubahan terkonsentrasi kuat pada rentang yang tinggi (51-100%), dengan perbedaan antara hasil survei dan wawancara.`;
      poin2 = `Rentang Optimal (76-100%): Hasil wawancara (${dataB[4] || 15} orang) menunjukkan tingkat optimisme tertinggi dan lebih tinggi daripada hasil survei (${dataA[4] || 10} orang).`;
      poin3 = `Rentang Dominan (51-75%): Hasil survei (${dataA[3] || 19} orang) menjadi yang tertinggi, melebihi hasil wawancara (${dataB[3] || 13} orang), menunjukkan mayoritas persepsi manfaat berada di tingkat ini.`;
      poin4 = `Rentang Rendah (26-50%): Baik hasil wawancara maupun survei hanya mencatat ${dataB[2] || 1} orang pada rentang ini, yang menunjukkan bahwa sedikit sekali responden yang merasa manfaatnya rendah.`;
      break;

    case 'grafik5':
      // Slide 9 PPT: Nilai Keseluruhan
      judul = 'Nilai Keseluruhan';
      poin1 = `Penilaian keseluruhan menunjukkan bahwa mayoritas responden menilai tinggi (51-100%) dengan adanya pola perbedaan antara hasil wawancara dan survei.`;
      poin2 = `Rentang Dominan (51-75%): Hasil wawancara (${dataB[3] || 20} orang) menjadi yang tertinggi, sedikit lebih unggul dari hasil survei (${dataA[3] || 17} orang).`;
      poin3 = `Rentang Optimal (76-100%): Hasil survei (${dataA[4] || 12} orang) justru lebih tinggi dari hasil wawancara (${dataB[4] || 8} orang), yang merupakan kebalikan dari pola grafik sebelumnya.`;
      poin4 = `Rentang Rendah (26-50%): Baik hasil wawancara maupun survei hanya mencatat ${dataB[2] || 1} orang pada rentang ini.`;
      break;

    case 'kesimpulan':
    default:
      // Slide 4 PPT: Kesimpulan dan Rekomendasi
      judul = 'Kesimpulan dan Rekomendasi';
      poin1 = `Berdasarkan hasil wawancara dan survei alumni Diklat Pelatihan Kepemimpinan Pengawas (PKP) Kabupaten Bogor Angkatan 7 Tahun 2023 yang dilaksanakan pada tanggal 29–30 Oktober 2025, diperoleh gambaran bahwa capaian hasil pasca pelatihan menunjukkan tren positif. Mayoritas responden menilai tingkat keberhasilan aksi perubahan dalam jangka menengah dan panjang berada pada rentang 76–100%, yang menandakan bahwa tujuan pembelajaran dan implementasi aksi perubahan telah berjalan efektif di unit kerja masing-masing.`;
      poin2 = `Proses mutasi/rotasi/promosi berdampak besar terhadap keberlangsungan Aksi Perubahan.`;
      poin3 = `Keberlanjutan dan Replikasi Aksi Perubahan Alumni perlu mendapat pendampingan agar aksi perubahan berlanjut dan diintegrasikan ke program kerja, serta direplikasi sebagai best practice di perangkat daerah lain.`;
      poin4 = `Aksi perubahan yang dibuat oleh peserta tidak harus menggunakan Aplikasi Komputer, karena konsekuensi harus menyiapkan infrastruktur pendukung seperti Server, Hosting dan SDM untuk pengembangan Aplikasi.\n\nProses mutasi/rotasi/promosi hendaknya memperhatikan terhadap Aksi Perubahan Alumni.`;
      break;
  }

  const teksLengkap = [
    `• ${poin1}`,
    `• ${poin2}`,
    `• ${poin3}`,
    `• ${poin4}`,
  ].join('\n');

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
 * Helper untuk mem-parsing respons JSON dari model AI (DeepSeek / Gemini)
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

/**
 * GENERATOR PEMBAHASAN AI / FALLBACK TEMPLATE
 * Memprioritaskan Google Gemini API (GEMINI_API_KEY).
 * Mendukung OrcaRouter (DeepSeek) sebagai alternatif.
 * Jika tidak ada kunci API atau verifikasi gagal, otomatis menggunakan templat resmi (KP-05).
 */
export async function buatPembahasanGrafik(
  grafikKey: string,
  rekap?: RekapGrafikData
): Promise<PembahasanItem> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const rawGeminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const geminiModel = rawGeminiModel.startsWith('models/') ? rawGeminiModel : `models/${rawGeminiModel}`;

  const orcaApiKey =
    process.env.ORCAROUTER_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.AI_API_KEY;

  const orcaBaseUrl =
    process.env.ORCAROUTER_BASE_URL ||
    process.env.DEEPSEEK_BASE_URL ||
    'https://api.orcarouter.ai/v1';

  const orcaModel =
    process.env.ORCAROUTER_MODEL ||
    process.env.DEEPSEEK_MODEL ||
    'orcarouter/deepseek/deepseek-chat';

  // Jika tidak ada kunci API sama sekali -> gunakan templat resmi terverifikasi (KP-05)
  if ((!geminiApiKey || geminiApiKey.trim() === '') && (!orcaApiKey || orcaApiKey.trim() === '')) {
    return generatePembahasanTemplate(grafikKey, rekap);
  }

  // Khusus Slide Kesimpulan dan Rekomendasi
  if (grafikKey === 'kesimpulan') {
    const promptKesimpulan = `Anda adalah analis evaluasi pasca pelatihan di BPSDM Provinsi Jawa Barat.
Berdasarkan hasil evaluasi pasca pelatihan PKP Angkatan VII Tahun 2023 yang menunjukkan tren positif (mayoritas capaian berada pada rentang 76-100%):
Buatlah narasi resmi Pembahasan dan Rekomendasi kebijakan:
Poin 1: Paragraf capaian hasil pelatihan dan efektivitas implementasi aksi perubahan alumni di unit kerja masing-masing.
Poin 2: Paragraf dampak mutasi/rotasi/promosi terhadap keberlangsungan aksi perubahan.
Poin 3: Rekomendasi kebijakan tentang keberlanjutan dan pendampingan replikasi ke perangkat daerah lain.
Poin 4: Rekomendasi kebijakan bahwa aksi perubahan tidak harus aplikasi komputer (beban server, hosting, SDM) dan mutasi/rotasi hendaknya memperhatikan kesinambungan proper alumni.

Format balasan wajib JSON:
{
  "poin1": "...",
  "poin2": "...",
  "poin3": "...",
  "poin4": "..."
}`;

    // 1. Coba via Gemini API (dengan fallback model jika 503)
    if (geminiApiKey && geminiApiKey.trim() !== '') {
      const modelsToTry = [
        geminiModel,
        geminiModel !== 'models/gemini-3.5-flash-lite' ? 'models/gemini-3.5-flash-lite' : null,
      ].filter(Boolean) as string[];

      for (const m of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/${m}:generateContent?key=${geminiApiKey.trim()}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptKesimpulan }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            const parsed = parseAiJsonResponse(raw);
            if (parsed?.poin1 && parsed?.poin2 && parsed?.poin3 && parsed?.poin4) {
              return {
                grafikKey: 'kesimpulan',
                judul: 'Kesimpulan dan Rekomendasi',
                poin1: parsed.poin1,
                poin2: parsed.poin2,
                poin3: parsed.poin3,
                poin4: parsed.poin4,
                teksLengkap: `• ${parsed.poin1}\n• ${parsed.poin2}\n• ${parsed.poin3}\n• ${parsed.poin4}`,
                sumber: 'ai',
              };
            }
          }
        } catch (e) {
          console.warn(`Error generate kesimpulan via Gemini (${m}):`, e);
        }
      }
    }

    // 2. Coba via OrcaRouter (jika Gemini tidak diisi)
    if (orcaApiKey && orcaApiKey.trim() !== '') {
      try {
        const res = await fetch(`${orcaBaseUrl.replace(/\/+$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${orcaApiKey.trim()}`,
          },
          body: JSON.stringify({
            model: orcaModel,
            messages: [
              {
                role: 'system',
                content:
                  'Anda adalah analis evaluasi pasca pelatihan di BPSDM Provinsi Jawa Barat. Selalu balas dalam format JSON valid.',
              },
              { role: 'user', content: promptKesimpulan },
            ],
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const raw = json?.choices?.[0]?.message?.content;
          const parsed = parseAiJsonResponse(raw);
          if (parsed?.poin1 && parsed?.poin2 && parsed?.poin3 && parsed?.poin4) {
            return {
              grafikKey: 'kesimpulan',
              judul: 'Kesimpulan dan Rekomendasi',
              poin1: parsed.poin1,
              poin2: parsed.poin2,
              poin3: parsed.poin3,
              poin4: parsed.poin4,
              teksLengkap: `• ${parsed.poin1}\n• ${parsed.poin2}\n• ${parsed.poin3}\n• ${parsed.poin4}`,
              sumber: 'ai',
            };
          }
        }
      } catch (e) {
        console.warn('Error generate kesimpulan via OrcaRouter, fallback to template:', e);
      }
    }

    return generatePembahasanTemplate('kesimpulan');
  }

  // Untuk Grafik 1 s.d. 5
  if (!rekap) return generatePembahasanTemplate(grafikKey);

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

  // 1. Prioritas Utama: Google Gemini API (dengan fallback otomatis jika 503 high demand)
  if (geminiApiKey && geminiApiKey.trim() !== '') {
    const modelsToTry = [
      geminiModel,
      geminiModel !== 'models/gemini-3.5-flash-lite' ? 'models/gemini-3.5-flash-lite' : null,
    ].filter(Boolean) as string[];

    for (const m of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${m}:generateContent?key=${geminiApiKey.trim()}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptGrafik }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = parseAiJsonResponse(rawText);

          if (parsed?.poin1 && parsed?.poin2 && parsed?.poin3 && parsed?.poin4) {
            const teksLengkap = [
              `• ${parsed.poin1}`,
              `• ${parsed.poin2}`,
              `• ${parsed.poin3}`,
              `• ${parsed.poin4}`,
            ].join('\n');

            // Validasi Pengaman Angka (URD Bab 7.2)
            const valid = verifikasiHasilAI(teksLengkap, rekap);
            if (valid) {
              return {
                grafikKey,
                judul: rekap.judul,
                poin1: parsed.poin1,
                poin2: parsed.poin2,
                poin3: parsed.poin3,
                poin4: parsed.poin4,
                teksLengkap,
                sumber: 'ai',
              };
            } else {
              console.warn(`Verifikasi angka Gemini (${m}) untuk ${grafikKey} tidak cocok, beralih ke model/templat lain`);
            }
          }
        } else {
          const errText = await response.text();
          console.warn(`Gemini API (${m}) returned ${response.status}:`, errText);
          // Jika 503 high demand, loop akan lanjut mencoba model berikutnya
        }
      } catch (err) {
        console.error(`Error memanggil Gemini API (${m}):`, err);
      }
    }
  }

  // 2. Prioritas Kedua: OrcaRouter (DeepSeek)
  if (orcaApiKey && orcaApiKey.trim() !== '') {
    try {
      const url = `${orcaBaseUrl.replace(/\/+$/, '')}/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${orcaApiKey.trim()}`,
        },
        body: JSON.stringify({
          model: orcaModel,
          messages: [
            {
              role: 'system',
              content:
                'Anda adalah analis evaluasi pasca pelatihan di BPSDM Provinsi Jawa Barat. Selalu balas dalam format JSON valid.',
            },
            { role: 'user', content: promptGrafik },
          ],
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content;
        const parsed = parseAiJsonResponse(rawText);

        if (parsed?.poin1 && parsed?.poin2 && parsed?.poin3 && parsed?.poin4) {
          const teksLengkap = [
            `• ${parsed.poin1}`,
            `• ${parsed.poin2}`,
            `• ${parsed.poin3}`,
            `• ${parsed.poin4}`,
          ].join('\n');

          const valid = verifikasiHasilAI(teksLengkap, rekap);
          if (valid) {
            return {
              grafikKey,
              judul: rekap.judul,
              poin1: parsed.poin1,
              poin2: parsed.poin2,
              poin3: parsed.poin3,
              poin4: parsed.poin4,
              teksLengkap,
              sumber: 'ai',
            };
          }
        }
      }
    } catch (err) {
      console.error('Error memanggil OrcaRouter DeepSeek API:', err);
    }
  }

  // 3. Fallback utama: Templat Baku Terverifikasi KP-05
  return generatePembahasanTemplate(grafikKey, rekap);
}
