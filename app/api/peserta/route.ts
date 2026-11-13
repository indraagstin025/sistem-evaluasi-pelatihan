import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  hapusSemuaDataPeserta,
  simpanPesertaDenganDetail,
} from '@/lib/peserta-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const peserta = await prisma.peserta.findMany({
      where: search
        ? {
            OR: [
              { nama: { contains: search, mode: 'insensitive' } },
              { nip: { contains: search, mode: 'insensitive' } },
              { instansi: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        survey: true,
        wawancara: true,
        hasil: true,
      },
      orderBy: { nama: 'asc' },
    });

    return NextResponse.json({ success: true, data: peserta });
  } catch (error: any) {
    console.error('GET /api/peserta error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data peserta' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Tambah satu peserta baru secara manual
    const { nama, nip, jabatanPelatihan, jabatanSaatIni, instansi, pelatihan, angkatan, tahun } =
      body;

    if (!nama || nama.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nama peserta wajib diisi.' },
        { status: 400 }
      );
    }

    const baru = await simpanPesertaDenganDetail({
      nama: nama.trim(),
      nip: nip ? nip.trim() : null,
      jabatanPelatihan: jabatanPelatihan?.trim() || null,
      jabatanSaatIni: jabatanSaatIni?.trim() || null,
      instansi: instansi?.trim() || null,
      pelatihan: pelatihan || 'PKP',
      angkatan: angkatan || 'VII',
      tahun: tahun ? Number(tahun) : 2023,
      sumber: 'Manual',
      s_panjang: 3,
      s_tujuan: 3,
      s_manfaat: 3,
      w_menengah: 75,
      w_panjang: 75,
      w_tujuan: 75,
      w_manfaat: 75,
      w_komunikasi: 75,
    });

    return NextResponse.json({ success: true, data: baru }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/peserta error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan data peserta' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await hapusSemuaDataPeserta(true);

    return NextResponse.json({
      success: true,
      message: 'Seluruh data peserta berhasil dikosongkan.',
    });
  } catch (error: any) {
    console.error('DELETE /api/peserta error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengosongkan data peserta' },
      { status: 500 }
    );
  }
}
