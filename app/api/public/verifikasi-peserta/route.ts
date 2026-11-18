import { NextResponse } from 'next/server';
import { findPesertaByKegiatanAndNip } from '@/lib/public-peserta';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const kegiatanId = String(body?.kegiatanId || '').trim();
    const nip = String(body?.nip || '').trim();

    if (!kegiatanId || !nip) {
      return NextResponse.json(
        { success: false, error: 'Pilih kegiatan dan masukkan NIP/NIK terlebih dahulu.' },
        { status: 400 }
      );
    }

    const peserta = await findPesertaByKegiatanAndNip(kegiatanId, nip);
    if (!peserta) {
      return NextResponse.json(
        {
          success: false,
          error: 'NIP/NIK tidak ditemukan pada kegiatan yang dipilih. Periksa kembali NIP Anda.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        pesertaId: peserta.id,
        nama: peserta.nama,
        nip: peserta.nip,
        instansi: peserta.instansi || peserta.instansiPelatihan,
        jabatanSaatIni: peserta.jabatanSaatIni || peserta.jabatanPelatihan,
        judulAksiPerubahanAwal: peserta.judulAksiPerubahan,
        properSebelumnya: peserta.inovasiProper
          ? {
              judulProper: peserta.inovasiProper.judulProper,
              jangkaMenengahMilestone: peserta.inovasiProper.jangkaMenengahMilestone,
              jangkaMenengahStatus: peserta.inovasiProper.jangkaMenengahStatus,
              jangkaMenengahFotoId: peserta.inovasiProper.jangkaMenengahFotoId,
              jangkaMenengahFotoNama: peserta.inovasiProper.jangkaMenengahFotoNama,
              jangkaPanjangMilestone: peserta.inovasiProper.jangkaPanjangMilestone,
              jangkaPanjangStatus: peserta.inovasiProper.jangkaPanjangStatus,
              jangkaPanjangFotoId: peserta.inovasiProper.jangkaPanjangFotoId,
              jangkaPanjangFotoNama: peserta.inovasiProper.jangkaPanjangFotoNama,
              kondisiSaatIni: peserta.inovasiProper.kondisiSaatIni,
              dokumenFileId: peserta.inovasiProper.dokumenFileId,
              dokumenNama: peserta.inovasiProper.dokumenNama,
              dokumenSizeBytes: peserta.inovasiProper.dokumenSizeBytes,
              updatedAt: peserta.inovasiProper.updatedAt,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error('POST /api/public/verifikasi-peserta error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memverifikasi NIP peserta.' },
      { status: 500 }
    );
  }
}
