import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePembahasanTemplate, type PembahasanItem } from '@/lib/ai';
import { getRekapGrafikMap, PEMBAHASAN_KEYS } from '@/lib/pembahasan-server';
import { generateEksposePptxBuffer } from '@/lib/pptx-ekspose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ekspose/pptx
 * Menghasilkan dan mengunduh 6 slide Ekspose resmi dalam format PowerPoint (.pptx).
 */
export async function GET() {
  try {
    const totalPeserta = await prisma.peserta.count();
    if (totalPeserta === 0) {
      return NextResponse.json(
        { success: false, error: 'Belum ada data peserta untuk diekspor ke PPTX.' },
        { status: 400 }
      );
    }

    const [rekapMap, saved] = await Promise.all([
      getRekapGrafikMap(),
      prisma.pembahasan.findMany(),
    ]);

    const pembahasanMap: Record<string, PembahasanItem> = {};
    for (const key of PEMBAHASAN_KEYS) {
      const existing = saved.find((s) => s.grafikKey === key);
      if (existing) {
        pembahasanMap[key] = {
          grafikKey: existing.grafikKey,
          judul: existing.judul,
          poin1: existing.poin1,
          poin2: existing.poin2,
          poin3: existing.poin3,
          poin4: existing.poin4,
          teksLengkap: existing.teksLengkap,
          sumber:
            existing.sumber === 'ai' || existing.sumber === 'manual'
              ? existing.sumber
              : 'template',
        };
      } else {
        const rekap = key === 'kesimpulan' ? undefined : rekapMap[key];
        pembahasanMap[key] = generatePembahasanTemplate(key, rekap);
      }
    }

    const pptxBuffer = await generateEksposePptxBuffer({
      rekapMap,
      pembahasanMap,
    });

    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `Ekspose_PKP_Angkatan_VII_${dateStamp}.pptx`;

    return new NextResponse(new Uint8Array(pptxBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('GET /api/ekspose/pptx error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal membuat file PPTX.' },
      { status: 500 }
    );
  }
}
