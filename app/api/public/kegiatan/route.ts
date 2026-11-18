import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await prisma.kegiatan.findMany({
      select: {
        id: true,
        nama: true,
        jenisPelatihan: true,
        penyelenggara: true,
        lokasi: true,
        tanggalMulai: true,
        tanggalSelesai: true,
      },
      orderBy: [{ tanggalMulai: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar kegiatan.' },
      { status: 500 }
    );
  }
}
