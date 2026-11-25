import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getHasilSurveyKegiatan } from '@/lib/survey-summary';
import { handleApiError } from '@/lib/api-error';

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
  } catch (error: unknown) {
    return handleApiError(
      error,
      'GET /api/kegiatan/[id]/hasil-survei',
      'Gagal memuat hasil survei keseluruhan.'
    );
  }
}
