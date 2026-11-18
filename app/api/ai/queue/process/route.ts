import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { processNextAiJob } from '@/lib/ai-queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => ({}));
    const url = new URL(request.url);
    const kegiatanId = String(body.kegiatanId || url.searchParams.get('kegiatanId') || '').trim();
    if (!kegiatanId) {
      return NextResponse.json(
        { success: false, error: 'Parameter kegiatanId wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await processNextAiJob(kegiatanId);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('POST /api/ai/queue/process error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses antrian AI' },
      { status: 500 }
    );
  }
}
