import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        'Skor survei merupakan data impor Excel yang terkunci dan tidak dapat diubah dari dalam aplikasi (UR-F-10 / UR-N-07).',
    },
    { status: 403 }
  );
}
