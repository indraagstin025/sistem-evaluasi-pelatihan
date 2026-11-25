import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { getKegiatanDetailForUser } from '@/lib/queries/kegiatan';
import { handleApiError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const includePeserta = searchParams.get('includePeserta') !== '0';

    const result = await getKegiatanDetailForUser(guard.user, params.id, {
      includePeserta,
    });

    if (result.status === 'forbidden') {
      return NextResponse.json(
        { success: false, error: 'Anda tidak terdaftar pada kegiatan ini.' },
        { status: 403 }
      );
    }
    if (result.status === 'not_found') {
      return NextResponse.json(
        { success: false, error: 'Kegiatan tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/kegiatan/[id]', 'Gagal memuat detail kegiatan.');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const existing = await prisma.kegiatan.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Kegiatan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    const nama = body?.nama !== undefined ? String(body.nama).trim() : existing.nama;
    const jenisPelatihan =
      body?.jenisPelatihan !== undefined
        ? String(body.jenisPelatihan).trim()
        : existing.jenisPelatihan;
    const penyelenggara =
      body?.penyelenggara !== undefined
        ? String(body.penyelenggara).trim()
        : existing.penyelenggara;
    const lokasi = body?.lokasi !== undefined ? String(body.lokasi).trim() : existing.lokasi;

    if (!nama || !jenisPelatihan || !penyelenggara || !lokasi) {
      return NextResponse.json(
        { success: false, error: 'Nama, jenis pelatihan, penyelenggara, dan lokasi wajib diisi.' },
        { status: 400 }
      );
    }

    const tanggalMulai = body?.tanggalMulai ? new Date(body.tanggalMulai) : existing.tanggalMulai;
    const tanggalSelesai = body?.tanggalSelesai
      ? new Date(body.tanggalSelesai)
      : existing.tanggalSelesai;

    if (Number.isNaN(tanggalMulai.getTime()) || Number.isNaN(tanggalSelesai.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Format tanggal mulai atau tanggal selesai tidak valid.' },
        { status: 400 }
      );
    }

    if (tanggalSelesai.getTime() < tanggalMulai.getTime()) {
      return NextResponse.json(
        { success: false, error: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.' },
        { status: 400 }
      );
    }

    const updated = await prisma.kegiatan.update({
      where: { id: params.id },
      data: {
        nama,
        jenisPelatihan,
        penyelenggara,
        lokasi,
        tanggalMulai,
        tanggalSelesai,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return handleApiError(error, 'PATCH /api/kegiatan/[id]', 'Gagal memperbarui kegiatan.');
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    await prisma.kegiatan.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Kegiatan berhasil dihapus.' });
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/kegiatan/[id]', 'Gagal menghapus kegiatan.');
  }
}
