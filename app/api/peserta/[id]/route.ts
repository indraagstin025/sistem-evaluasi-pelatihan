import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const peserta = await prisma.peserta.findUnique({
      where: { id: params.id },
      include: {
        survey: true,
        wawancara: true,
        hasil: true,
      },
    });

    if (!peserta) {
      return NextResponse.json(
        { success: false, error: 'Peserta tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: peserta });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil detail peserta' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { nama, nip, jabatanPelatihan, jabatanSaatIni, instansi } = body;

    const updated = await prisma.peserta.update({
      where: { id: params.id },
      data: {
        nama: nama?.trim(),
        nip: nip !== undefined ? (nip?.trim() || null) : undefined,
        jabatanPelatihan: jabatanPelatihan !== undefined ? (jabatanPelatihan?.trim() || null) : undefined,
        jabatanSaatIni: jabatanSaatIni !== undefined ? (jabatanSaatIni?.trim() || null) : undefined,
        instansi: instansi !== undefined ? (instansi?.trim() || null) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui data peserta' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.peserta.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Peserta berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus peserta' },
      { status: 500 }
    );
  }
}
