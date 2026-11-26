/**
 * scripts/seed-dummy-evidence.ts
 * Mengisi data dummy dokumen evidence (InovasiProper + UploadedFile PDF & PNG valid)
 * bagi peserta yang sudah memiliki nilai wawancara namun belum mengunggah evidence.
 *
 * Keamanan data asli:
 * - Tidak mengubah nilai wawancara, statusKonfirmasi, deskripsi evaluator, atau Survey.
 * - Tidak menimpa InovasiProper asli yang sudah diunggah (mis. Stock Barang.pdf).
 * - Semua berkas dummy ditandai prefix "Dummy_" dan dapat dibersihkan kapan saja via `--reset`.
 *
 * Penggunaan:
 *   npx tsx --env-file=.env scripts/seed-dummy-evidence.ts
 *   npx tsx --env-file=.env scripts/seed-dummy-evidence.ts --reset
 *   npx tsx --env-file=.env scripts/seed-dummy-evidence.ts --kegiatanId=<id>
 */

import zlib from 'node:zlib';
import { prisma } from '../lib/prisma';

const DEFAULT_KEGIATAN_ID = 'cmwozfpia0001qtppcacqte7z';
const DUMMY_PREFIX = 'Dummy_';

function slugifyName(raw: string): string {
  return String(raw || 'peserta')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32) || 'peserta';
}

function escapePdfText(raw: string): string {
  return String(raw || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapLines(text: string, maxChars = 76): string[] {
  const words = escapePdfText(text).split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (!current) {
      current = w;
    } else if (current.length + 1 + w.length <= maxChars) {
      current += ` ${w}`;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Menghasilkan buffer PDF 1.4 valid minimal (tanpa dependensi eksternal)
 * yang dapat langsung dibuka di Chrome/Edge/PDF viewer.
 */
function buildValidDummyPdf(opts: {
  pesertaNama: string;
  judulProper: string;
  periodeMenengah: string;
  periodePanjang: string;
  statusMenengah: string;
  statusPanjang: string;
  kondisiSaatIni: string;
}): Buffer {
  const lines: string[] = [
    'DOKUMEN EVIDENCE AKSI PERUBAHAN (DATA DUMMY SIMULASI)',
    'BPSDM Provinsi Jawa Barat - Evaluasi Pasca Pelatihan',
    '----------------------------------------------------------------------------',
    `Peserta : ${escapePdfText(opts.pesertaNama)}`,
    'Judul Aksi Perubahan:',
    ...wrapLines(opts.judulProper, 74).map((l) => `  ${l}`),
    '',
    `Milestone Jangka Menengah (${escapePdfText(opts.periodeMenengah)}) : ${opts.statusMenengah}`,
    `Milestone Jangka Panjang  (${escapePdfText(opts.periodePanjang)}) : ${opts.statusPanjang}`,
    '',
    'Kondisi Implementasi Saat Ini:',
    ...wrapLines(opts.kondisiSaatIni, 74).map((l) => `  ${l}`),
    '',
    'Catatan: Berkas ini adalah dokumen dummy valid untuk pengujian dan pratinjau',
    'sistem Evaluasi Pasca Pelatihan (dapat dihapus dengan flag --reset).',
  ];

  const streamOps = [
    'BT',
    '/F1 11 Tf',
    '48 770 Td',
    '16 TL',
    ...lines.map((line, idx) =>
      idx === 0 ? `(${escapePdfText(line)}) Tj` : `T* (${escapePdfText(line)}) Tj`
    ),
    'ET',
  ].join('\n');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(streamOps, 'utf8')} >>\nstream\n${streamOps}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/**
 * Menghasilkan gambar PNG valid (320x180) dengan bingkai monokrom BPSDM
 * sehingga pratinjau foto evidence di browser selalu tampil bersih.
 */
function buildValidDummyPng(accentRgb: [number, number, number]): Buffer {
  const width = 320;
  const height = 180;
  const stride = 1 + width * 3;
  const raw = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y++) {
    const rowOff = y * stride;
    raw[rowOff] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const px = rowOff + 1 + x * 3;
      const isBorder = x < 8 || x >= width - 8 || y < 8 || y >= height - 8;
      const isHeader = y >= 8 && y < 44 && x >= 8 && x < width - 8;
      const isCardBar =
        (y >= 64 && y < 78 && x >= 28 && x < 230) ||
        (y >= 92 && y < 104 && x >= 28 && x < 280) ||
        (y >= 114 && y < 126 && x >= 28 && x < 250) ||
        (y >= 136 && y < 148 && x >= 28 && x < 190);

      if (isBorder) {
        raw[px] = 24;
        raw[px + 1] = 24;
        raw[px + 2] = 27;
      } else if (isHeader) {
        raw[px] = accentRgb[0];
        raw[px + 1] = accentRgb[1];
        raw[px + 2] = accentRgb[2];
      } else if (isCardBar) {
        raw[px] = 212;
        raw[px + 1] = 212;
        raw[px + 2] = 216;
      } else {
        raw[px] = 250;
        raw[px + 1] = 250;
        raw[px + 2] = 250;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 6 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function cleanSnippet(raw: string | null | undefined, fallback: string): string {
  const clean = String(raw || '')
    .replace(/\r?\n+/g, '; ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean || clean === '-') return fallback;
  return clean.length > 260 ? `${clean.slice(0, 257).trim()}...` : clean;
}

async function resetDummyEvidence(kegiatanId: string) {
  const dummyInov = await prisma.inovasiProper.findMany({
    where: {
      kegiatanId,
      dokumenNama: { startsWith: DUMMY_PREFIX },
    },
    select: {
      id: true,
      dokumenFileId: true,
      jangkaMenengahFotoId: true,
      jangkaPanjangFotoId: true,
    },
  });

  const fileIds = Array.from(
    new Set(
      dummyInov
        .flatMap((row) => [
          row.dokumenFileId,
          row.jangkaMenengahFotoId,
          row.jangkaPanjangFotoId,
        ])
        .filter((id): id is string => Boolean(id))
    )
  );

  const deletedInov = await prisma.inovasiProper.deleteMany({
    where: { id: { in: dummyInov.map((d) => d.id) } },
  });

  const deletedFiles = await prisma.uploadedFile.deleteMany({
    where: {
      kegiatanId,
      OR: [
        { id: { in: fileIds } },
        { filename: { startsWith: DUMMY_PREFIX } },
      ],
    },
  });

  console.log(
    `RESET selesai untuk kegiatan ${kegiatanId}: ${deletedInov.count} InovasiProper dummy & ${deletedFiles.count} UploadedFile dummy dihapus.`
  );
}

async function seedDummyEvidence(kegiatanId: string) {
  const pesertaList = await prisma.peserta.findMany({
    where: { kegiatanId },
    include: {
      hasil: true,
      wawancara: true,
      inovasiProper: { select: { id: true, dokumenNama: true } },
    },
    orderBy: { nama: 'asc' },
  });

  if (pesertaList.length === 0) {
    console.log(`Tidak ada peserta pada kegiatan ${kegiatanId}.`);
    return;
  }

  let createdCount = 0;
  let skippedExisting = 0;
  let skippedUninterviewed = 0;
  let filesCreated = 0;

  const pngMenengahBuf = buildValidDummyPng([39, 39, 42]); // slate/zinc header
  const pngPanjangBuf = buildValidDummyPng([68, 114, 196]); // BPSDM blue accent

  for (const p of pesertaList) {
    if (p.inovasiProper) {
      skippedExisting += 1;
      continue;
    }

    // Lewati peserta yang belum memiliki nilai wawancara (realistis: belum unggah)
    if (p.hasil?.rataWawancaraM === null || p.hasil?.rataWawancaraM === undefined) {
      skippedUninterviewed += 1;
      continue;
    }

    const wMen = p.wawancara.find((w) => w.kriteria === 'menengah');
    const wPan = p.wawancara.find((w) => w.kriteria === 'jangkaPanjang');
    const wMan = p.wawancara.find((w) => w.kriteria === 'manfaat');

    const menStatus =
      wMen?.nilai !== null && wMen?.nilai !== undefined && wMen.nilai >= 61
        ? 'SUDAH_DILAKSANAKAN'
        : 'BELUM_DILAKSANAKAN';
    const panStatus =
      wPan?.nilai !== null && wPan?.nilai !== undefined && wPan.nilai >= 61
        ? 'SUDAH_DILAKSANAKAN'
        : 'BELUM_DILAKSANAKAN';

    const judulProper =
      (p.judulAksiPerubahan || '').trim() ||
      `Optimalisasi Layanan Unit Kerja (${p.instansi || 'Perangkat Daerah'})`;
    const periodeMen = (p.periodeMenengah || 'Nov 2023 - Mei 2024').trim();
    const periodePan = (p.periodePanjang || 'sd Nov 2024').trim();

    const menengahMilestone = cleanSnippet(
      wMen?.deskripsi,
      `Pelaksanaan milestone jangka menengah (${periodeMen}) sesuai rancangan aksi perubahan di unit kerja.`
    );
    const panjangMilestone = cleanSnippet(
      wPan?.deskripsi,
      `Target pengembangan jangka panjang (${periodePan}) untuk keberlanjutan aksi perubahan.`
    );
    const kondisiSaatIni = cleanSnippet(
      wMan?.deskripsi || wMen?.deskripsi,
      menStatus === 'SUDAH_DILAKSANAKAN'
        ? 'Implementasi aksi perubahan telah berjalan di unit kerja dan terus dimonitor secara berkala.'
        : 'Implementasi mengalami kendala operasional/mutasi jabatan sehingga memerlukan penyesuaian lanjutan.'
    );

    const slug = slugifyName(p.nama);
    const pdfFilename = `${DUMMY_PREFIX}Evidence_Proper_${slug}.pdf`;
    const pdfBuffer = buildValidDummyPdf({
      pesertaNama: p.nama,
      judulProper,
      periodeMenengah: periodeMen,
      periodePanjang: periodePan,
      statusMenengah: menStatus === 'SUDAH_DILAKSANAKAN' ? 'Sudah Dilaksanakan' : 'Belum Dilaksanakan',
      statusPanjang: panStatus === 'SUDAH_DILAKSANAKAN' ? 'Sudah Dilaksanakan' : 'Belum Dilaksanakan',
      kondisiSaatIni,
    });

    const pdfRecord = await prisma.uploadedFile.create({
      data: {
        kegiatanId,
        filename: pdfFilename,
        mimeType: 'application/pdf',
        sizeBytes: pdfBuffer.length,
        data: pdfBuffer,
      },
      select: { id: true, filename: true, sizeBytes: true },
    });
    filesCreated += 1;

    let menFotoId: string | null = null;
    let menFotoNama: string | null = null;
    if (menStatus === 'SUDAH_DILAKSANAKAN') {
      const f = await prisma.uploadedFile.create({
        data: {
          kegiatanId,
          filename: `${DUMMY_PREFIX}Foto_Menengah_${slug}.png`,
          mimeType: 'image/png',
          sizeBytes: pngMenengahBuf.length,
          data: pngMenengahBuf,
        },
        select: { id: true, filename: true },
      });
      menFotoId = f.id;
      menFotoNama = f.filename;
      filesCreated += 1;
    }

    let panFotoId: string | null = null;
    let panFotoNama: string | null = null;
    if (panStatus === 'SUDAH_DILAKSANAKAN') {
      const f = await prisma.uploadedFile.create({
        data: {
          kegiatanId,
          filename: `${DUMMY_PREFIX}Foto_Panjang_${slug}.png`,
          mimeType: 'image/png',
          sizeBytes: pngPanjangBuf.length,
          data: pngPanjangBuf,
        },
        select: { id: true, filename: true },
      });
      panFotoId = f.id;
      panFotoNama = f.filename;
      filesCreated += 1;
    }

    await prisma.inovasiProper.create({
      data: {
        kegiatanId,
        pesertaId: p.id,
        judulProper,
        jangkaMenengahMilestone: menengahMilestone,
        jangkaMenengahStatus: menStatus,
        jangkaMenengahFotoId: menFotoId,
        jangkaMenengahFotoNama: menFotoNama,
        jangkaPanjangMilestone: panjangMilestone,
        jangkaPanjangStatus: panStatus,
        jangkaPanjangFotoId: panFotoId,
        jangkaPanjangFotoNama: panFotoNama,
        kondisiSaatIni,
        dokumenFileId: pdfRecord.id,
        dokumenNama: pdfRecord.filename,
        dokumenSizeBytes: pdfRecord.sizeBytes,
      },
    });
    createdCount += 1;
  }

  const totalInovNow = await prisma.inovasiProper.count({ where: { kegiatanId } });
  console.log(
    JSON.stringify(
      {
        kegiatanId,
        totalPeserta: pesertaList.length,
        createdDummyEvidence: createdCount,
        skippedExistingEvidence: skippedExisting,
        skippedUninterviewed,
        uploadedFilesCreated: filesCreated,
        totalInovasiProperNow: totalInovNow,
      },
      null,
      2
    )
  );
}

async function main() {
  const args = process.argv.slice(2);
  const isReset = args.includes('--reset');
  const kegArg = args.find((a) => a.startsWith('--kegiatanId='));
  const kegiatanId = kegArg ? kegArg.split('=')[1] : DEFAULT_KEGIATAN_ID;

  if (isReset) {
    await resetDummyEvidence(kegiatanId);
  } else {
    await seedDummyEvidence(kegiatanId);
  }
}

main()
  .catch((err) => {
    console.error('Seed dummy evidence gagal:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
