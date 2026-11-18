import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findPesertaByKegiatanAndNip } from '@/lib/public-peserta';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const kegiatanId = String(body?.kegiatanId || '').trim();
    const nip = String(body?.nip || '').trim();

    const peserta = await findPesertaByKegiatanAndNip(kegiatanId, nip);
    if (!peserta) {
      return NextResponse.json(
        { success: false, error: 'NIP/NIK tidak terverifikasi pada kegiatan yang dipilih.' },
        { status: 403 }
      );
    }

    const judulProper = String(body?.judulProper || '').trim();
    const jangkaMenengahMilestone = String(body?.jangkaMenengahMilestone || '').trim();
    const jangkaMenengahStatus =
      body?.jangkaMenengahStatus === 'SUDAH_DILAKSANAKAN'
        ? 'SUDAH_DILAKSANAKAN'
        : 'BELUM_DILAKSANAKAN';
    const jangkaPanjangMilestone = String(body?.jangkaPanjangMilestone || '').trim();
    const jangkaPanjangStatus =
      body?.jangkaPanjangStatus === 'SUDAH_DILAKSANAKAN'
        ? 'SUDAH_DILAKSANAKAN'
        : 'BELUM_DILAKSANAKAN';
    const kondisiSaatIni = String(body?.kondisiSaatIni || '').trim();

    if (!judulProper || !jangkaMenengahMilestone || !jangkaPanjangMilestone || !kondisiSaatIni) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Judul Inovasi/Proper, Jangka Menengah, Jangka Panjang, dan Kondisi Proper Saat Ini wajib diisi.',
        },
        { status: 400 }
      );
    }

    const existing = peserta.inovasiProper;

    const dokumenFileId = body?.dokumenFileId
      ? String(body.dokumenFileId)
      : existing?.dokumenFileId || null;

    const jangkaMenengahFotoId =
      jangkaMenengahStatus === 'SUDAH_DILAKSANAKAN'
        ? body?.jangkaMenengahFotoId
          ? String(body.jangkaMenengahFotoId)
          : existing?.jangkaMenengahFotoId || null
        : null;

    const jangkaPanjangFotoId =
      jangkaPanjangStatus === 'SUDAH_DILAKSANAKAN'
        ? body?.jangkaPanjangFotoId
          ? String(body.jangkaPanjangFotoId)
          : existing?.jangkaPanjangFotoId || null
        : null;

    if (!dokumenFileId) {
      return NextResponse.json(
        { success: false, error: 'Dokumen Inovasi/Proper wajib diunggah (maksimal 3 MB).' },
        { status: 400 }
      );
    }

    if (jangkaMenengahStatus === 'SUDAH_DILAKSANAKAN' && !jangkaMenengahFotoId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Foto evidence Jangka Menengah wajib diunggah karena status Sudah Dilaksanakan.',
        },
        { status: 400 }
      );
    }

    if (jangkaPanjangStatus === 'SUDAH_DILAKSANAKAN' && !jangkaPanjangFotoId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Foto evidence Jangka Panjang wajib diunggah karena status Sudah Dilaksanakan.',
        },
        { status: 400 }
      );
    }

    // Validasi bahwa fileId benar milik kegiatan ini dan ambil metadata nama/ukurannya
    const fileIds = Array.from(
      new Set([dokumenFileId, jangkaMenengahFotoId, jangkaPanjangFotoId].filter(Boolean) as string[])
    );
    const fileRecords = await prisma.uploadedFile.findMany({
      where: { id: { in: fileIds }, kegiatanId },
      select: { id: true, filename: true, sizeBytes: true },
    });
    const fileMap = new Map(fileRecords.map((f) => [f.id, f]));

    const docMeta = fileMap.get(dokumenFileId);
    if (!docMeta) {
      return NextResponse.json(
        { success: false, error: 'Referensi berkas dokumen tidak valid atau sudah kadaluarsa.' },
        { status: 400 }
      );
    }

    const menFotoMeta = jangkaMenengahFotoId ? fileMap.get(jangkaMenengahFotoId) : null;
    const panFotoMeta = jangkaPanjangFotoId ? fileMap.get(jangkaPanjangFotoId) : null;

    // Kumpulkan file lama yang digantikan untuk dihapus bersih setelah upsert (KP-09)
    const staleFileIds: string[] = [];
    if (existing?.dokumenFileId && existing.dokumenFileId !== dokumenFileId) {
      staleFileIds.push(existing.dokumenFileId);
    }
    if (existing?.jangkaMenengahFotoId && existing.jangkaMenengahFotoId !== jangkaMenengahFotoId) {
      staleFileIds.push(existing.jangkaMenengahFotoId);
    }
    if (existing?.jangkaPanjangFotoId && existing.jangkaPanjangFotoId !== jangkaPanjangFotoId) {
      staleFileIds.push(existing.jangkaPanjangFotoId);
    }

    const saved = await prisma.inovasiProper.upsert({
      where: { pesertaId: peserta.id },
      update: {
        judulProper,
        jangkaMenengahMilestone,
        jangkaMenengahStatus,
        jangkaMenengahFotoId,
        jangkaMenengahFotoNama: menFotoMeta?.filename || null,
        jangkaPanjangMilestone,
        jangkaPanjangStatus,
        jangkaPanjangFotoId,
        jangkaPanjangFotoNama: panFotoMeta?.filename || null,
        kondisiSaatIni,
        dokumenFileId,
        dokumenNama: docMeta.filename,
        dokumenSizeBytes: docMeta.sizeBytes,
      },
      create: {
        kegiatanId,
        pesertaId: peserta.id,
        judulProper,
        jangkaMenengahMilestone,
        jangkaMenengahStatus,
        jangkaMenengahFotoId,
        jangkaMenengahFotoNama: menFotoMeta?.filename || null,
        jangkaPanjangMilestone,
        jangkaPanjangStatus,
        jangkaPanjangFotoId,
        jangkaPanjangFotoNama: panFotoMeta?.filename || null,
        kondisiSaatIni,
        dokumenFileId,
        dokumenNama: docMeta.filename,
        dokumenSizeBytes: docMeta.sizeBytes,
      },
    });

    if (staleFileIds.length > 0) {
      await prisma.uploadedFile.deleteMany({
        where: { id: { in: staleFileIds } },
      });
    }

    return NextResponse.json({
      success: true,
      message: existing
        ? 'Dokumen dan informasi Inovasi/Proper berhasil diperbarui (dokumen lama terganti).'
        : 'Dokumen dan informasi Inovasi/Proper berhasil diunggah.',
      data: saved,
    });
  } catch (error: any) {
    console.error('POST /api/public/unggah-inovasi error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal menyimpan unggahan Inovasi/Proper.' },
      { status: 500 }
    );
  }
}
