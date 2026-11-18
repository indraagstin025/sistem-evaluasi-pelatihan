import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getHasilSurveyKegiatan } from '@/lib/survey-summary';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const summary = await getHasilSurveyKegiatan(params.id);
    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('GET /api/kegiatan/[id]/hasil-survei error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal memuat hasil survei keseluruhan.' },
      { status: 500 }
    );
  }
}
