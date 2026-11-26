import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { AI_OPEN_TEXT_MIN_RECORDS } from '@/lib/ekspose-config';
import {
  ANALISIS_TERBUKA_KATEGORI_LIST,
  AnalisisTerbukaKategori,
  analisisJawabanTerbukaDenganAi,
  collectSumberTeksTerbuka,
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

    if (targets.length === 1) {
      const sumberCheck = await collectSumberTeksTerbuka(params.id, targets[0]);
      if (sumberCheck.length < AI_OPEN_TEXT_MIN_RECORDS) {
        return NextResponse.json(
          {
            success: false,
            error: `Data jawaban terbuka belum cukup untuk dianalisis AI (saat ini ${sumberCheck.length} catatan, minimal ${AI_OPEN_TEXT_MIN_RECORDS} catatan).`,
          },
          { status: 400 }
        );
      }
    }

    const updatedResults: Partial<Record<AnalisisTerbukaKategori, Awaited<ReturnType<typeof analisisJawabanTerbukaDenganAi>>>> = {};
    for (const kat of targets) {
      const sumberCheck = await collectSumberTeksTerbuka(params.id, kat);
      if (sumberCheck.length < AI_OPEN_TEXT_MIN_RECORDS) continue;
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
