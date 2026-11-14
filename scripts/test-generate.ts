import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
let apiKey = '';
let geminiModel = 'deep-research-preview-04-2026';

for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (trimmed.startsWith('GEMINI_API_KEY=')) {
    apiKey = trimmed.split('=')[1].replace(/["']/g, '').trim();
  } else if (trimmed.startsWith('GEMINI_MODEL=')) {
    const val = trimmed.split('=')[1].replace(/["']/g, '').trim();
    if (val) geminiModel = val;
  }
}

async function testJsonGeneration(modelName: string) {
  const fullModel = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/${fullModel}:generateContent?key=${apiKey}`;

  console.log(`\nMenguji Generasi JSON Pembahasan Evaluasi dengan ${fullModel}...`);
  const prompt = `Anda adalah analis evaluasi pasca pelatihan di BPSDM Provinsi Jawa Barat.
Tulis narasi Pembahasan 4 poin gaya slide ekspose resmi untuk grafik berikut:
Judul: "Grafik 4: Manfaat Aksi Perubahan — Survei vs Wawancara"
Data Survei (Manfaat): [Rentang 0: 0, Rentang 1-25: 0, Rentang 26-50: 1, Rentang 51-75: 19, Rentang 76-100: 10]
Data Wawancara (Manfaat): [Rentang 0: 0, Rentang 1-25: 0, Rentang 26-50: 1, Rentang 51-75: 13, Rentang 76-100: 15]

Wajib format JSON:
{
  "poin1": "...",
  "poin2": "...",
  "poin3": "...",
  "poin4": "..."
}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (res.ok) {
    const data = await res.json();
    console.log('BERHASIL! Hasil JSON dari Gemini:\n', data?.candidates?.[0]?.content?.parts?.[0]?.text);
  } else {
    console.log('Gagal:', res.status, await res.text());
  }
}

async function run() {
  await testJsonGeneration(geminiModel);
}

run();
