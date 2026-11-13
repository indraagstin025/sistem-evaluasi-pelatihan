import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  hapusSemuaDataPeserta,
  simpanBatchPesertaDenganDetail,
  simpanPesertaDenganDetail,
  type PesertaDetailInput,
} from '@/lib/peserta-db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const peserta = await prisma.peserta.findMany({
      where: search
        ? {
            OR: [
              { nama: { contains: search, mode: 'insensitive' } },
              { nip: { contains: search, mode: 'insensitive' } },
              { instansi: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        survey: true,
        wawancara: true,
        hasil: true,
      },
      orderBy: { nama: 'asc' },
    });

    return NextResponse.json({ success: true, data: peserta });
  } catch (error: any) {
    console.error('GET /api/peserta error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data peserta' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support action: "muat-dummy" atau "muat-asli"
    if (body.action === 'muat-dummy' || body.action === 'muat-asli') {
      const fileName =
        body.action === 'muat-dummy'
          ? 'uji-dummy-evaluasi-pasca-pelatihan.csv'
          : 'data-anonim-pkp-30-peserta-ekspose.csv';

      const filePath = path.join(process.cwd(), 'prisma', 'data', fileName);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { success: false, error: `File ${fileName} tidak ditemukan.` },
          { status: 404 }
        );
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      const parseLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const headers = parseLine(lines[0]);
      const parseNum = (v: string | undefined) =>
        !v || v.trim() === '' || isNaN(Number(v)) ? null : Number(v.trim());

      // Hapus data lama agar bersih
      await hapusSemuaDataPeserta(false);

      const defaultSumber = body.action === 'muat-dummy' ? 'Dummy' : 'Ekspose';
      const batchItems: PesertaDetailInput[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx] ?? '';
        });

        batchItems.push({
          nama: row.nama,
          nip: row.nip || null,
          jabatanPelatihan: row.jabatanPelatihan || null,
          jabatanSaatIni: row.jabatanSaatIni || null,
          instansi: row.instansi || null,
          pelatihan: 'PKP',
          angkatan: 'VII',
          tahun: 2023,
          metode: 'Blended Learning',
          sumber: defaultSumber,
          s_panjang: parseNum(row.survei_jangka_panjang),
          s_tujuan: parseNum(row.survei_seluruh_tujuan),
          s_manfaat: parseNum(row.survei_manfaat),
          w_menengah: parseNum(row.wawancara_jangka_menengah),
          w_panjang: parseNum(row.wawancara_jangka_panjang),
          w_tujuan: parseNum(row.wawancara_seluruh_tujuan),
          w_manfaat: parseNum(row.wawancara_manfaat),
          w_komunikasi: parseNum(row.wawancara_teknik_komunikasi),
        });
      }

      const loadedCount = await simpanBatchPesertaDenganDetail(batchItems);

      return NextResponse.json({
        success: true,
        message: `Berhasil memuat ${loadedCount} data peserta.`,
      });
    }

    // Default: Tambah satu peserta baru
    const { nama, nip, jabatanPelatihan, jabatanSaatIni, instansi, pelatihan, angkatan, tahun } =
      body;

    if (!nama || nama.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nama peserta wajib diisi.' },
        { status: 400 }
      );
    }

    const baru = await simpanPesertaDenganDetail({
      nama: nama.trim(),
      nip: nip ? nip.trim() : null,
      jabatanPelatihan: jabatanPelatihan?.trim() || null,
      jabatanSaatIni: jabatanSaatIni?.trim() || null,
      instansi: instansi?.trim() || null,
      pelatihan: pelatihan || 'PKP',
      angkatan: angkatan || 'VII',
      tahun: tahun ? Number(tahun) : 2023,
      sumber: 'Manual',
      s_panjang: 3,
      s_tujuan: 3,
      s_manfaat: 3,
      w_menengah: 75,
      w_panjang: 75,
      w_tujuan: 75,
      w_manfaat: 75,
      w_komunikasi: 75,
    });

    return NextResponse.json({ success: true, data: baru }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/peserta error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan data peserta' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await hapusSemuaDataPeserta(true);

    return NextResponse.json({
      success: true,
      message: 'Seluruh data peserta berhasil dikosongkan.',
    });
  } catch (error: any) {
    console.error('DELETE /api/peserta error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengosongkan data peserta' },
      { status: 500 }
    );
  }
}
