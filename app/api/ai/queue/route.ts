import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { cancelQueuedJobs, enqueueAiJobs, getQueueSnapshot } from '@/lib/ai-queue';

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

    const snapshot = await getQueueSnapshot(kegiatanId);
    return NextResponse.json({
      success: true,
      ...snapshot,
    });
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/ai/queue', 'Gagal mengambil status antrean AI.');
  }
}

export async function POST(request: Request) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => ({}));
    const url = new URL(request.url);
    const kegiatanId = String(body.kegiatanId || url.searchParams.get('kegiatanId') || '').trim();
    const grafikKey = String(body.grafikKey || 'all').trim();

    if (!kegiatanId) {
      return NextResponse.json(
        { success: false, error: 'Parameter kegiatanId wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await enqueueAiJobs(kegiatanId, grafikKey);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const totalAdded = result.createdJobs.length;
    const message =
      totalAdded === 0
        ? 'Slide yang dipilih sudah berada di dalam antrian.'
        : grafikKey === 'all'
          ? `${totalAdded} slide dimasukkan ke antrian generasi AI.`
          : `Slide ${grafikKey} dimasukkan ke antrian generasi AI.`;

    return NextResponse.json(
      {
        success: true,
        message,
        batchId: result.batchId,
        createdJobs: result.createdJobs,
        skippedKeys: result.skippedKeys,
        ...result.snapshot,
      },
      { status: 202 }
    );
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/ai/queue', 'Gagal menambahkan antrean AI.');
  }
}

export async function DELETE(request: Request) {
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

    const res = await cancelQueuedJobs(kegiatanId);
    return NextResponse.json({
      success: true,
      message:
        res.cancelledCount > 0
          ? `${res.cancelledCount} antrian slide berhasil dibatalkan.`
          : 'Tidak ada antrian menunggu untuk dibatalkan.',
      cancelledCount: res.cancelledCount,
      ...res.snapshot,
    });
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/ai/queue', 'Gagal membatalkan antrean AI.');
  }
}
