import fs from 'fs';
import path from 'path';

// Baca file .env manual untuk memastikan kunci terbaca
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
let apiKey = '';

for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (trimmed.startsWith('GEMINI_API_KEY=')) {
    apiKey = trimmed.split('=')[1].replace(/["']/g, '').trim();
    break;
  }
}

if (!apiKey) {
  console.error('GEMINI_API_KEY tidak ditemukan di file .env');
  process.exit(1);
}

console.log(`Menguji API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-6)}`);

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Gagal mengambil daftar model (Status ${res.status}):`);
      console.error(errText);
      return;
    }

    const data = await res.json();
    const models = data?.models || [];

    console.log(`\nBerhasil! Ditemukan ${models.length} model yang tersedia untuk API Key ini:\n`);
    console.log('='.repeat(80));

    // Filter model yang mendukung generateContent
    const contentModels = models.filter((m: any) =>
      m.supportedGenerationMethods?.includes('generateContent')
    );

    console.log(`Model yang mendukung generateContent (${contentModels.length} model):\n`);

    contentModels.forEach((m: any) => {
      const name = m.name.replace('models/', '');
      console.log(`- Nama Model   : ${name}`);
      console.log(`  Nama Lengkap : ${m.displayName || '-'}`);
      console.log(`  Deskripsi    : ${m.description?.slice(0, 100) || '-'}...`);
      console.log(`  Input Limit  : ${m.inputTokenLimit?.toLocaleString() || '-'} tokens`);
      console.log(`  Output Limit : ${m.outputTokenLimit?.toLocaleString() || '-'} tokens`);
      console.log('-'.repeat(80));
    });
  } catch (err: any) {
    console.error('Error saat menghubungi endpoint Gemini:', err.message);
  }
}

listModels();
