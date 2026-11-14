import { NextResponse } from 'next/server';
import { processNextAiJob } from '@/lib/ai-queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST: Klaim & proses tepat 1 job tertua dari antrian AiJob
export async function POST() {
  try {
    const result = await processNextAiJob();
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
