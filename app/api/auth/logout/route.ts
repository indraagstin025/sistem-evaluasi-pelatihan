import { NextResponse } from 'next/server';
import { detachSessionCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  return detachSessionCookie(response);
}
