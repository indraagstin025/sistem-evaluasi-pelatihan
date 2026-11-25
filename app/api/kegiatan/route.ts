import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { listKegiatanForUser } from '@/lib/queries/kegiatan';
import { handleApiError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const formatted = await listKegiatanForUser(guard.user);
    return NextResponse.json({ success: true, data: formatted });
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/kegiatan', 'Gagal memuat daftar kegiatan.');
  }
}

export async function POST(request: Request) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    const nama = String(body?.nama || '').trim();
    const jenisPelatihan = String(body?.jenisPelatihan || 'PKP').trim().toUpperCase();
    const penyelenggara = String(body?.penyelenggara || '').trim();
    const lokasi = String(body?.lokasi || '').trim();
    const tanggalMulai = body?.tanggalMulai ? new Date(body.tanggalMulai) : null;
    const tanggalSelesai = body?.tanggalSelesai ? new Date(body.tanggalSelesai) : null;

    if (!nama || !penyelenggara || !lokasi || !tanggalMulai || !tanggalSelesai) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Kelima isian wajib diisi: Nama Kegiatan, Penyelenggara, Lokasi, Tanggal Mulai, dan Tanggal Selesai.',
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(tanggalMulai.getTime()) || Number.isNaN(tanggalSelesai.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Format tanggal mulai atau tanggal selesai tidak valid.' },
        { status: 400 }
      );
    }

    if (tanggalSelesai < tanggalMulai) {
      return NextResponse.json(
        { success: false, error: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.' },
        { status: 400 }
      );
    }

    const allowedJenis = new Set(['PKP', 'PKA', 'PKN']);
    const normalizedJenis = allowedJenis.has(jenisPelatihan) ? jenisPelatihan : 'PKP';

    const created = await prisma.kegiatan.create({
      data: {
        nama,
        jenisPelatihan: normalizedJenis,
        penyelenggara,
        lokasi,
        tanggalMulai,
        tanggalSelesai,
        createdById: guard.user.id,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/kegiatan', 'Gagal membuat kegiatan baru.');
  }
}
