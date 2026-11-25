import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import {
  ANALISIS_TERBUKA_KATEGORI_LIST,
  AnalisisTerbukaKategori,
  analisisJawabanTerbukaDenganAi,
  getAnalisisTerbukaKegiatan,
  isValidAnalisisTerbukaKategori,
} from '@/lib/ai-jawaban-terbuka';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!kegiatan) {
      return NextResponse.json(
        { success: false, error: 'Kegiatan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const data = await getAnalisisTerbukaKegiatan(params.id);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return handleApiError(
      error,
      'GET /api/kegiatan/[id]/analisis-terbuka',
      'Gagal memuat analisis tema jawaban terbuka.'
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!kegiatan) {
      return NextResponse.json(
        { success: false, error: 'Kegiatan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const requestedKategori = body?.kategori;

    let targets: AnalisisTerbukaKategori[];
    if (!requestedKategori || requestedKategori === 'all') {
      targets = [...ANALISIS_TERBUKA_KATEGORI_LIST];
    } else if (isValidAnalisisTerbukaKategori(requestedKategori)) {
      targets = [requestedKategori];
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            'Kategori tidak valid. Gunakan kendala_survei, dukungan_survei, deskripsi_wawancara, atau all.',
        },
        { status: 400 }
      );
    }

    const updatedResults: Partial<Record<AnalisisTerbukaKategori, Awaited<ReturnType<typeof analisisJawabanTerbukaDenganAi>>>> = {};
    for (const kat of targets) {
      updatedResults[kat] = await analisisJawabanTerbukaDenganAi(params.id, kat);
    }

    const data = await getAnalisisTerbukaKegiatan(params.id);
    return NextResponse.json({
      success: true,
      analyzed: targets,
      updated: updatedResults,
      data,
    });
  } catch (error: unknown) {
    return handleApiError(
      error,
      'POST /api/kegiatan/[id]/analisis-terbuka',
      'Gagal menjalankan analisis AI jawaban terbuka.'
    );
  }
}
