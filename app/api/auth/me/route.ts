import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }
    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/auth/me', 'Gagal memeriksa sesi pengguna.');
  }
}
