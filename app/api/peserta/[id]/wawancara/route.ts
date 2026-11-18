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

  if (guard.user.role !== 'EVALUATOR') {
    return NextResponse.json(
      {
        success: false,
        error:
          'Mode Super Admin bersifat baca saja (read-only). Hanya Evaluator tim yang berhak mengisi atau memperbarui wawancara.',
      },
      { status: 403 }
    );
  }

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
      const isBlankNilai =
        !hasSubmittedNilai ||
        item.nilai === null ||
        (typeof item.nilai === 'string' && item.nilai.trim() === '');
      const submittedNilai = isBlankNilai
        ? null
        : typeof item.nilai === 'boolean'
          ? Number.NaN
          : Number(item.nilai);

      if (
        submittedNilai !== null &&
        (!Number.isInteger(submittedNilai) || submittedNilai < 0 || submittedNilai > 100)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Nilai wawancara ${kriteria} harus berupa bilangan bulat antara 0 sampai 100.`,
          },
          { status: 400 }
        );
      }

      const finalNilai = hasSubmittedNilai ? submittedNilai : (existing?.nilai ?? null);
      const deskripsi =
        item.deskripsi !== undefined ? (String(item.deskripsi).trim() || null) : existing?.deskripsi ?? null;
      const isStillExcelValue =
        Boolean(existing?.lockedFromImport) && finalNilai !== null && finalNilai === existing?.nilai;
      const sumber =
        finalNilai === null
          ? 'KOSONG'
          : isStillExcelValue
            ? existing?.sumber || 'Form Penilaian Excel'
            : 'Evaluator';

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
          lockedFromImport: isStillExcelValue,
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

    const [updatedRows, properRecord] = await Promise.all([
      prisma.wawancara.findMany({
        where: { pesertaId: params.id },
      }),
      prisma.inovasiProper.findUnique({
        where: { pesertaId: params.id },
        select: { id: true },
      }),
    ]);

    const hasProper = Boolean(properRecord);
    const allCoreFilled = ['menengah', 'jangkaPanjang', 'seluruhTujuan', 'manfaat'].every(
      (k) => updatedRows.find((w) => w.kriteria === k)?.nilai !== null
    );

    let completed = false;
    if (!hasProper || (!body?.markSelesai && !allCoreFilled)) {
      await prisma.peserta.update({
        where: { id: params.id },
        data: { wawancaraSelesaiAt: null },
      });
    } else if (body?.markSelesai || allCoreFilled) {
      await prisma.peserta.update({
        where: { id: params.id },
        data: { wawancaraSelesaiAt: new Date() },
      });
      completed = true;
    }

    const hasilBaru = await hitungHasil(params.id);

    const wantsComplete = Boolean(body?.markSelesai);
    const message =
      !hasProper && wantsComplete
        ? 'Draf nilai dan bukti tersimpan, namun status belum dapat ditandai Selesai karena peserta belum mengunggah Inovasi/Proper.'
        : completed
          ? 'Hasil wawancara dan bukti berhasil disimpan dan ditandai Selesai.'
          : 'Draf hasil wawancara dan bukti berhasil disimpan.';

    return NextResponse.json({
      success: true,
      completed,
      hasProper,
      message,
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
