import { NextResponse } from 'next/server';
import { cancelQueuedJobs, enqueueAiJobs, getQueueSnapshot } from '@/lib/ai-queue';

export const dynamic = 'force-dynamic';

// GET: Ambil status antrian AI saat ini (memulihkan progres pasca-refresh)
export async function GET() {
  try {
    const snapshot = await getQueueSnapshot();
    return NextResponse.json({
      success: true,
      ...snapshot,
    });
  } catch (error: any) {
    console.error('GET /api/ai/queue error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil status antrian AI' },
      { status: 500 }
    );
  }
}

// POST: Masukkan 1 atau seluruh slide ('all') ke dalam antrian AiJob
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const grafikKey = String(body.grafikKey || 'all').trim();

    const result = await enqueueAiJobs(grafikKey);
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
  } catch (error: any) {
    console.error('POST /api/ai/queue error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menambahkan antrian AI' },
      { status: 500 }
    );
  }
}

// DELETE: Batalkan semua job yang masih menunggu (status: queued)
export async function DELETE() {
  try {
    const res = await cancelQueuedJobs();
    return NextResponse.json({
      success: true,
      message:
        res.cancelledCount > 0
          ? `${res.cancelledCount} antrian slide berhasil dibatalkan.`
          : 'Tidak ada antrian menunggu untuk dibatalkan.',
      cancelledCount: res.cancelledCount,
      ...res.snapshot,
    });
  } catch (error: any) {
    console.error('DELETE /api/ai/queue error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal membatalkan antrian AI' },
      { status: 500 }
    );
  }
}
