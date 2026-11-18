import { prisma } from './prisma';

/**
 * Algoritma deterministik membagi daftar peserta terurut menjadi tim @ 10 orang.
 * Jika jumlah tidak habis dibagi 10, kelebihan peserta didistribusikan merata ke tim awal:
 * contoh: 30 -> [10, 10, 10], 31 -> [11, 10, 10], 32 -> [11, 11, 10], <10 -> [N].
 */
export function hitungAlokasiTimAuto10<T>(items: T[], targetPerTim = 10): T[][] {
  if (items.length === 0) return [];
  const teamCount = Math.max(1, Math.floor(items.length / targetPerTim));
  const baseSize = Math.floor(items.length / teamCount);
  const remainder = items.length % teamCount;

  const buckets: T[][] = [];
  let cursor = 0;
  for (let t = 0; t < teamCount; t++) {
    const size = baseSize + (t < remainder ? 1 : 0);
    buckets.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return buckets;
}

/**
 * Mengelompokkan peserta ke tim secara deterministik (10 peserta per evaluator).
 */
export async function bagiTimOtomatis10(kegiatanId: string) {
  const pesertaList = await prisma.peserta.findMany({
    where: { kegiatanId },
    orderBy: [{ nama: 'asc' }, { id: 'asc' }],
    select: { id: true, nama: true },
  });

  if (pesertaList.length === 0) {
    return { teamCount: 0, totalPeserta: 0, mode: 'auto_10' as const };
  }

  const buckets = hitungAlokasiTimAuto10(pesertaList, 10);

  await prisma.$transaction(async (tx) => {
    await tx.peserta.updateMany({
      where: { kegiatanId },
      data: { timId: null },
    });

    await tx.timEvaluator.deleteMany({
      where: {
        kegiatanId,
        urutan: { gt: buckets.length },
      },
    });

    for (let idx = 0; idx < buckets.length; idx++) {
      const urutan = idx + 1;
      const team = await tx.timEvaluator.upsert({
        where: { kegiatanId_urutan: { kegiatanId, urutan } },
        update: {},
        create: {
          kegiatanId,
          urutan,
          namaTim: `Tim ${urutan}`,
        },
      });

      const ids = buckets[idx].map((p) => p.id);
      if (ids.length > 0) {
        await tx.peserta.updateMany({
          where: { id: { in: ids } },
          data: { timId: team.id },
        });
      }
    }
  });

  return {
    teamCount: buckets.length,
    totalPeserta: pesertaList.length,
    sizes: buckets.map((b) => b.length),
    mode: 'auto_10' as const,
  };
}

/**
 * Membentuk tim berdasarkan kolom "Nama Tim Evaluator" dari Excel (mis. Pak Angga, Pak Asep Riyanto, Pak Tugiman).
 * Jika Excel tidak memiliki kolom nama tim, otomatis jatuh ke mode bagi 10 per tim.
 */
export async function bagiTimDariExcelAtauAuto(kegiatanId: string) {
  const pesertaList = await prisma.peserta.findMany({
    where: { kegiatanId },
    orderBy: [{ createdAt: 'asc' }, { nama: 'asc' }, { id: 'asc' }],
    select: { id: true, namaTimExcel: true },
  });

  if (pesertaList.length === 0) {
    return { teamCount: 0, totalPeserta: 0, mode: 'from_excel' as const };
  }

  const hasExcelTeams = pesertaList.some(
    (p) => typeof p.namaTimExcel === 'string' && p.namaTimExcel.trim() !== ''
  );

  if (!hasExcelTeams) {
    return bagiTimOtomatis10(kegiatanId);
  }

  const grouped = new Map<string, string[]>();
  for (const p of pesertaList) {
    const label = p.namaTimExcel?.trim() || 'Tim Cadangan';
    if (!grouped.has(label)) {
      grouped.set(label, []);
    }
    grouped.get(label)!.push(p.id);
  }

  const entries = Array.from(grouped.entries());

  await prisma.$transaction(async (tx) => {
    await tx.peserta.updateMany({
      where: { kegiatanId },
      data: { timId: null },
    });

    await tx.timEvaluator.deleteMany({
      where: {
        kegiatanId,
        urutan: { gt: entries.length },
      },
    });

    for (let idx = 0; idx < entries.length; idx++) {
      const [namaTim, ids] = entries[idx];
      const urutan = idx + 1;
      const team = await tx.timEvaluator.upsert({
        where: { kegiatanId_urutan: { kegiatanId, urutan } },
        update: { namaTim },
        create: {
          kegiatanId,
          urutan,
          namaTim,
        },
      });

      await tx.peserta.updateMany({
        where: { id: { in: ids } },
        data: { timId: team.id },
      });
    }
  });

  return {
    teamCount: entries.length,
    totalPeserta: pesertaList.length,
    sizes: entries.map(([, ids]) => ids.length),
    mode: 'from_excel' as const,
  };
}
