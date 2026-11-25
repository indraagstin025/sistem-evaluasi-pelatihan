import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { generatePembahasanTemplate, type PembahasanItem } from '@/lib/ai';
import {
  getKonfirmasiWawancaraMap,
  getRekapGrafikMap,
  PEMBAHASAN_KEYS,
} from '@/lib/pembahasan-server';
import { generateEksposePptxBuffer } from '@/lib/pptx-ekspose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const kegiatanId = searchParams.get('kegiatanId') || '';
    if (!kegiatanId) {
      return NextResponse.json(
        { success: false, error: 'Parameter kegiatanId wajib diisi.' },
        { status: 400 }
      );
    }

    const kegiatan = await prisma.kegiatan.findUnique({ where: { id: kegiatanId } });
    if (!kegiatan) {
      return NextResponse.json(
        { success: false, error: 'Kegiatan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const totalPeserta = await prisma.peserta.count({ where: { kegiatanId } });
    if (totalPeserta === 0) {
      return NextResponse.json(
        { success: false, error: 'Belum ada data peserta untuk diekspor ke PPTX.' },
        { status: 400 }
      );
    }

    const [rekapMap, konfirmasiMap, saved] = await Promise.all([
      getRekapGrafikMap(kegiatanId),
      getKonfirmasiWawancaraMap(kegiatanId),
      prisma.pembahasan.findMany({ where: { kegiatanId } }),
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
      kegiatanNama: kegiatan.nama,
      rekapMap,
      pembahasanMap,
      konfirmasiMap,
    });

    const dateStamp = new Date().toISOString().slice(0, 10);
    const slug = kegiatan.nama
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
    const filename = `Ekspose_${slug || 'Kegiatan'}_${dateStamp}.pptx`;

    return new NextResponse(new Uint8Array(pptxBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/ekspose/pptx', 'Gagal membuat file PPTX.');
  }
}
