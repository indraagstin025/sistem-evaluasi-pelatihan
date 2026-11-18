import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  ALLOWED_DOC_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
  findPesertaByKegiatanAndNip,
  MAX_PUBLIC_UPLOAD_BYTES,
} from '@/lib/public-peserta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const kegiatanId = String(formData.get('kegiatanId') || '').trim();
    const nip = String(formData.get('nip') || '').trim();
    const kind = String(formData.get('kind') || 'dokumen').trim();
    const file = formData.get('file') as File | null;

    if (!kegiatanId || !nip || !file) {
      return NextResponse.json(
        { success: false, error: 'Kegiatan, NIP, dan berkas wajib disertakan.' },
        { status: 400 }
      );
    }

    const peserta = await findPesertaByKegiatanAndNip(kegiatanId, nip);
    if (!peserta) {
      return NextResponse.json(
        { success: false, error: 'Verifikasi peserta gagal untuk berkas ini.' },
        { status: 403 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json({ success: false, error: 'Berkas kosong tidak dapat diunggah.' }, { status: 400 });
    }

    if (file.size > MAX_PUBLIC_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ukuran berkas melebihi batas maksimal 3 MB.',
        },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isPhotoKind = kind === 'foto_menengah' || kind === 'foto_panjang';
    const allowedSet = isPhotoKind ? ALLOWED_IMAGE_EXTENSIONS : ALLOWED_DOC_EXTENSIONS;

    if (!allowedSet.has(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: isPhotoKind
            ? 'Foto evidence harus berformat JPG, JPEG, PNG, atau WEBP.'
            : 'Dokumen Proper harus berformat PDF, Word, PowerPoint, Excel, ZIP, atau RAR.',
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await prisma.uploadedFile.create({
      data: {
        kegiatanId,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        data: buffer,
      },
      select: {
        id: true,
        filename: true,
        sizeBytes: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: saved,
    });
  } catch (error: any) {
    console.error('POST /api/public/upload-file error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal mengunggah berkas.' },
      { status: 500 }
    );
  }
}
