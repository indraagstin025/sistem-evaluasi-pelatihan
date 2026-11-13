import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hitungHasil } from '@/lib/hitung';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    // body can be an array of { kode, skor, jawabanTeks, responden, sumber }
    // or an object { items: [...] } or single item
    const items = Array.isArray(body) ? body : body.items || [body];

    for (const item of items) {
      const kode = item.kode;
      const skor = item.skor === '' || item.skor === null || item.skor === undefined ? null : Number(item.skor);
      const responden = item.responden || 'alumni';
      const jawabanTeks = item.jawabanTeks || null;
      const sumber = item.sumber || 'Form';

      await prisma.survey.upsert({
        where: {
          pesertaId_responden_kode: {
            pesertaId: params.id,
            responden,
            kode,
          },
        },
        update: {
          skor,
          jawabanTeks,
          sumber,
        },
        create: {
          pesertaId: params.id,
          responden,
          kode,
          skor,
          jawabanTeks,
          sumber,
        },
      });
    }

    // Hitung ulang otomatis di database
    const hasilBaru = await hitungHasil(params.id);

    return NextResponse.json({
      success: true,
      message: 'Survei berhasil disimpan',
      hasil: hasilBaru,
    });
  } catch (error: any) {
    console.error('POST /api/peserta/[id]/survey error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan survei' },
      { status: 500 }
    );
  }
}
