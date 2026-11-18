import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hitungHasil } from '@/lib/hitung';
import { canAccessPeserta, requireSession } from '@/lib/auth';

const DEFAULT_BOBOT: Record<string, number> = {
  menengah: 20,
  jangkaPanjang: 20,
  seluruhTujuan: 20,
  manfaat: 30,
  komunikasi: 10,
};

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const access = await canAccessPeserta(guard.user, params.id);
    if (!access.peserta) {
      return NextResponse.json(
        { success: false, error: 'Peserta tidak ditemukan.' },
        { status: 404 }
      );
    }
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak berhak mengisi wawancara peserta di luar tim Anda.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body) ? body : body.items || [body];

    const existingRows = await prisma.wawancara.findMany({
      where: { pesertaId: params.id },
    });
    const existingMap = new Map(existingRows.map((w) => [w.kriteria, w]));

    for (const item of items) {
      const kriteria = String(item?.kriteria || '');
      if (!DEFAULT_BOBOT[kriteria]) continue;

      const existing = existingMap.get(kriteria);
      const hasSubmittedNilai = item.nilai !== undefined;
      const submittedNilai =
        !hasSubmittedNilai || item.nilai === '' || item.nilai === null
          ? null
          : Number(item.nilai);

      if (
        submittedNilai !== null &&
        (Number.isNaN(submittedNilai) || submittedNilai < 0 || submittedNilai > 100)
      ) {
        return NextResponse.json(
          { success: false, error: `Nilai wawancara ${kriteria} harus antara 0 sampai 100.` },
          { status: 400 }
        );
      }

      // IT-07: Angka wawancara dari impor Excel bersifat TERKUNCI jika sudah memiliki nilai
      if (existing?.lockedFromImport && hasSubmittedNilai && submittedNilai !== existing.nilai) {
        return NextResponse.json(
          {
            success: false,
            error: `Angka wawancara pada kriteria "${kriteria}" berasal dari impor Excel yang terkunci dan tidak dapat diubah di dalam sistem (IT-07).`,
          },
          { status: 403 }
        );
      }

      const finalNilai = existing?.lockedFromImport ? existing.nilai : submittedNilai;
      const deskripsi =
        item.deskripsi !== undefined ? (String(item.deskripsi).trim() || null) : existing?.deskripsi ?? null;
      const sumber = existing?.lockedFromImport
        ? existing.sumber
        : finalNilai !== null
          ? 'Evaluator'
          : 'KOSONG';

      await prisma.wawancara.upsert({
        where: {
          pesertaId_kriteria: {
            pesertaId: params.id,
            kriteria,
          },
        },
        update: {
          nilai: finalNilai,
          bobot: DEFAULT_BOBOT[kriteria],
          deskripsi,
          sumber,
          updatedById: guard.user.id,
        },
        create: {
          pesertaId: params.id,
          kriteria,
          bobot: DEFAULT_BOBOT[kriteria],
          nilai: finalNilai,
          lockedFromImport: false,
          deskripsi,
          sumber,
          updatedById: guard.user.id,
        },
      });
    }

    const updatedRows = await prisma.wawancara.findMany({
      where: { pesertaId: params.id },
    });
    const allCoreFilled = ['menengah', 'jangkaPanjang', 'seluruhTujuan', 'manfaat'].every(
      (k) => updatedRows.find((w) => w.kriteria === k)?.nilai !== null
    );

    if (allCoreFilled || body?.markSelesai) {
      await prisma.peserta.update({
        where: { id: params.id },
        data: { wawancaraSelesaiAt: new Date() },
      });
    }

    const hasilBaru = await hitungHasil(params.id);

    return NextResponse.json({
      success: true,
      message: 'Hasil wawancara dan bukti berhasil disimpan.',
      hasil: hasilBaru,
    });
  } catch (error: any) {
    console.error('POST /api/peserta/[id]/wawancara error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan wawancara' },
      { status: 500 }
    );
  }
}
