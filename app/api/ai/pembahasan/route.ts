import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { buatPembahasanGrafik, generatePembahasanTemplate } from '@/lib/ai';
import {
  buildKesimpulanContext,
  getAiDataReadiness,
  getKonfirmasiWawancaraMap,
  getRekapGrafikMap,
  PEMBAHASAN_KEYS,
  ringkasKonfirmasiUntukAi,
} from '@/lib/pembahasan-server';
import { EKSPOSE_SLIDE_KRITERIA_MAP } from '@/lib/wawancara-kriteria';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const kegiatanId = searchParams.get('kegiatanId') || '';
    if (!kegiatanId) {
      return NextResponse.json(
        { success: false, error: 'Parameter kegiatanId wajib diisi.' },
        { status: 400 }
      );
    }

    const totalPeserta = await prisma.peserta.count({ where: { kegiatanId } });
    if (totalPeserta === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    const saved = await prisma.pembahasan.findMany({ where: { kegiatanId } });
    const result: Record<string, any> = {};
    const keys = PEMBAHASAN_KEYS;

    const missingKeys = keys.filter((key) => !saved.some((s) => s.grafikKey === key));
    const rekapMap = missingKeys.length > 0 ? await getRekapGrafikMap(kegiatanId) : null;
    const initialKesimpulanCtx =
      missingKeys.includes('kesimpulan') && rekapMap
        ? await buildKesimpulanContext(kegiatanId, { totalPeserta, rekapMap })
        : undefined;

    await Promise.all(
      keys.map(async (key) => {
        const exist = saved.find((s) => s.grafikKey === key);
        if (exist) {
          result[key] = exist;
          return;
        }
        const rekap = rekapMap ? (rekapMap as any)[key] : undefined;
        const initial = generatePembahasanTemplate(
          key,
          rekap,
          key === 'kesimpulan' ? initialKesimpulanCtx : undefined
        );
        const created = await prisma.pembahasan.create({
          data: {
            kegiatanId,
            grafikKey: key,
            judul: initial.judul,
            poin1: initial.poin1,
            poin2: initial.poin2,
            poin3: initial.poin3,
            poin4: initial.poin4,
            teksLengkap: initial.teksLengkap,
            sumber: 'template',
          },
        });
        result[key] = created;
      })
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/ai/pembahasan', 'Gagal memuat pembahasan AI.');
  }
}

export async function POST(request: Request) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => ({}));
    const url = new URL(request.url);
    const kegiatanId = String(body?.kegiatanId || url.searchParams.get('kegiatanId') || '').trim();
    if (!kegiatanId) {
      return NextResponse.json(
        { success: false, error: 'Parameter kegiatanId wajib diisi.' },
        { status: 400 }
      );
    }

    const readiness = await getAiDataReadiness(kegiatanId);
    if (readiness.status === 'blocked') {
      return NextResponse.json(
        {
          success: false,
          error: readiness.message,
        },
        { status: 400 }
      );
    }
    const totalPeserta = readiness.totalPeserta;

    const targetKey = body.grafikKey || 'all';
    const [rekapMap, konfirmasiMap] = await Promise.all([
      getRekapGrafikMap(kegiatanId),
      getKonfirmasiWawancaraMap(kegiatanId),
    ]);
    const keysToProcess =
      targetKey === 'all' ? ([...PEMBAHASAN_KEYS] as string[]) : ([targetKey] as string[]);

    const updatedMap: Record<string, any> = {};

    for (let i = 0; i < keysToProcess.length; i++) {
      const key = keysToProcess[i];
      const rekap = key === 'kesimpulan' ? undefined : (rekapMap as any)[key];
      if (key !== 'kesimpulan' && !rekap) continue;

      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const kesimpulanCtx =
        key === 'kesimpulan'
          ? await buildKesimpulanContext(kegiatanId, {
              totalPeserta,
              rekapMap,
              konfirmasiMap,
            })
          : undefined;

      const slideKeys =
        EKSPOSE_SLIDE_KRITERIA_MAP[key as keyof typeof EKSPOSE_SLIDE_KRITERIA_MAP];
      const slideKonfirmasiSummary =
        key !== 'kesimpulan' && slideKeys
          ? ringkasKonfirmasiUntukAi(konfirmasiMap, slideKeys)
          : undefined;

      const hasil = await buatPembahasanGrafik(
        key,
        rekap,
        kesimpulanCtx,
        slideKonfirmasiSummary
      );
      const payload = {
        judul: hasil.judul,
        poin1: hasil.poin1,
        poin2: hasil.poin2,
        poin3: hasil.poin3,
        poin4: hasil.poin4,
        teksLengkap: hasil.teksLengkap,
        catatanKonfirmasi: hasil.catatanKonfirmasi ?? null,
        ringkasanKonteks: hasil.ringkasanKonteks ?? null,
        sumber: hasil.sumber,
      };
      const saved = await prisma.pembahasan.upsert({
        where: { kegiatanId_grafikKey: { kegiatanId, grafikKey: key } },
        update: payload,
        create: {
          kegiatanId,
          grafikKey: key,
          ...payload,
        },
      });
      updatedMap[key] = saved;
    }

    return NextResponse.json({
      success: true,
      message:
        targetKey === 'all'
          ? 'Berhasil memperbarui pembahasan seluruh grafik'
          : `Berhasil memperbarui pembahasan ${targetKey}`,
      data: updatedMap,
    });
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/ai/pembahasan', 'Gagal membuat pembahasan AI.');
  }
}

export async function PUT(request: Request) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const { kegiatanId, grafikKey, poin1, poin2, poin3, poin4 } = body;

    if (!kegiatanId || !grafikKey) {
      return NextResponse.json(
        { success: false, error: 'Parameter kegiatanId dan grafikKey wajib diisi.' },
        { status: 400 }
      );
    }

    const teksLengkap = [
      `1. ${poin1 || ''}`,
      `2. ${poin2 || ''}`,
      `3. ${poin3 || ''}`,
      `4. ${poin4 || ''}`,
    ].join('\n');

    const updated = await prisma.pembahasan.upsert({
      where: { kegiatanId_grafikKey: { kegiatanId, grafikKey } },
      update: {
        poin1: poin1 || '',
        poin2: poin2 || '',
        poin3: poin3 || '',
        poin4: poin4 || '',
        teksLengkap,
        sumber: 'manual',
      },
      create: {
        kegiatanId,
        grafikKey,
        judul: body.judul || `Grafik ${grafikKey}`,
        poin1: poin1 || '',
        poin2: poin2 || '',
        poin3: poin3 || '',
        poin4: poin4 || '',
        teksLengkap,
        sumber: 'manual',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Perubahan pembahasan berhasil disimpan secara manual.',
      data: updated,
    });
  } catch (error: unknown) {
    return handleApiError(error, 'PUT /api/ai/pembahasan', 'Gagal menyimpan perubahan pembahasan.');
  }
}
