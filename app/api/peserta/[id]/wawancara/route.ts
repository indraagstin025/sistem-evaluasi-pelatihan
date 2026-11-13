import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hitungHasil } from '@/lib/hitung';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : body.items || [body];

    const defaultBobot: Record<string, number> = {
      menengah: 20,
      jangkaPanjang: 20,
      seluruhTujuan: 20,
      manfaat: 30,
      komunikasi: 10,
    };

    for (const item of items) {
      const kriteria = item.kriteria;
      const nilai = item.nilai === '' || item.nilai === null || item.nilai === undefined ? null : Number(item.nilai);
      const bobot = item.bobot || defaultBobot[kriteria] || 20;
      const deskripsi = item.deskripsi !== undefined ? (item.deskripsi?.trim() || null) : undefined;
      const sumber = item.sumber || 'Form';

      await prisma.wawancara.upsert({
        where: {
          pesertaId_kriteria: {
            pesertaId: params.id,
            kriteria,
          },
        },
        update: {
          nilai,
          bobot,
          ...(deskripsi !== undefined ? { deskripsi } : {}),
          sumber,
        },
        create: {
          pesertaId: params.id,
          kriteria,
          bobot,
          nilai,
          deskripsi: deskripsi || null,
          sumber,
        },
      });
    }

    // Hitung ulang otomatis di database
    const hasilBaru = await hitungHasil(params.id);

    return NextResponse.json({
      success: true,
      message: 'Wawancara berhasil disimpan',
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
