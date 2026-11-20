import { randomInt } from 'node:crypto';
import { prisma } from './prisma';
import { encryptVaultPassword, hashPassword } from './password';

export interface GeneratedEvaluatorSummary {
  userId: string;
  timId: string;
  namaTim: string;
  nama: string;
  username: string;
  sandiAwal: string | null;
  status: 'created' | 'linked';
}

/**
 * Mengacak urutan elemen array secara adil (Fisher-Yates dengan crypto.randomInt).
 */
export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Menghasilkan kata sandi awal mudah dibaca dari nama tim/evaluator (mis. "Pak Angga" -> "PakAngga123").
 */
export function buatSandiAwalEvaluator(nama: string): string {
  const words = nama
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));

  let base = words.join('') || 'Evaluator';
  if (base.length < 3) {
    base = `${base}Eval`;
  }
  return `${base}123`;
}

/**
 * Menghasilkan username login huruf kecil tanpa spasi dari nama tim/evaluator (mis. "Pak Angga" -> "pakangga").
 */
export function buatUsernameBase(nama: string): string {
  const clean = nama.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean || 'evaluator';
}

async function resolveOrCreateEvaluatorAccount(nama: string): Promise<{
  userId: string;
  nama: string;
  username: string;
  sandiAwal: string | null;
  status: 'created' | 'linked';
}> {
  const trimmedName = nama.trim() || 'Evaluator';
  const usernameBase = buatUsernameBase(trimmedName);

  const existingActive = await prisma.user.findFirst({
    where: {
      role: 'EVALUATOR',
      aktif: true,
      OR: [
        { nama: { equals: trimmedName, mode: 'insensitive' } },
        { nip: { equals: usernameBase, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      nama: true,
      nip: true,
      passwordEncrypted: true,
    },
  });

  if (existingActive) {
    return {
      userId: existingActive.id,
      nama: existingActive.nama,
      username: existingActive.nip || usernameBase,
      sandiAwal: null,
      status: 'linked',
    };
  }

  let candidateNip = usernameBase;
  let suffix = 2;
  while (
    await prisma.user.findFirst({
      where: { nip: { equals: candidateNip, mode: 'insensitive' } },
      select: { id: true },
    })
  ) {
    candidateNip = `${usernameBase}${suffix}`;
    suffix++;
  }

  const sandiAwal = buatSandiAwalEvaluator(trimmedName);
  const created = await prisma.user.create({
    data: {
      nama: trimmedName,
      nip: candidateNip,
      email: null,
      role: 'EVALUATOR',
      passwordHash: hashPassword(sandiAwal),
      passwordEncrypted: encryptVaultPassword(sandiAwal),
      mustChangePassword: true,
      aktif: true,
    },
    select: { id: true, nama: true, nip: true },
  });

  return {
    userId: created.id,
    nama: created.nama,
    username: created.nip || candidateNip,
    sandiAwal,
    status: 'created',
  };
}

/**
 * Memastikan setiap tim di kegiatan yang belum punya Evaluator langsung dibuatkan/ditautkan akunnya.
 */
export async function ensureEvaluatorAccountsForKegiatan(
  kegiatanId: string
): Promise<GeneratedEvaluatorSummary[]> {
  const teams = await prisma.timEvaluator.findMany({
    where: { kegiatanId },
    orderBy: { urutan: 'asc' },
    include: {
      evaluator: {
        select: { id: true, nama: true, nip: true, passwordEncrypted: true },
      },
    },
  });

  const summaries: GeneratedEvaluatorSummary[] = [];

  for (const tim of teams) {
    if (tim.evaluator) {
      summaries.push({
        userId: tim.evaluator.id,
        timId: tim.id,
        namaTim: tim.namaTim,
        nama: tim.evaluator.nama,
        username: tim.evaluator.nip || buatUsernameBase(tim.evaluator.nama),
        sandiAwal: null,
        status: 'linked',
      });
      continue;
    }

    const account = await resolveOrCreateEvaluatorAccount(tim.namaTim);
    await prisma.timEvaluator.update({
      where: { id: tim.id },
      data: { evaluatorId: account.userId },
    });

    summaries.push({
      ...account,
      timId: tim.id,
      namaTim: tim.namaTim,
    });
  }

  return summaries;
}

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
    return {
      teamCount: 0,
      totalPeserta: 0,
      mode: 'auto_10' as const,
      evaluatorAccounts: [] as GeneratedEvaluatorSummary[],
    };
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

  const evaluatorAccounts = await ensureEvaluatorAccountsForKegiatan(kegiatanId);

  return {
    teamCount: buckets.length,
    totalPeserta: pesertaList.length,
    sizes: buckets.map((b) => b.length),
    mode: 'auto_10' as const,
    evaluatorAccounts,
  };
}

/**
 * Mengacak peserta dan memasangkan/mengacak Evaluator dalam 1 klik.
 * Jika akun Evaluator aktif lebih sedikit daripada jumlah tim, sistem otomatis membuat kekurangannya.
 */
export async function bagiTimAcakOtomatis(kegiatanId: string) {
  const [pesertaList, activeEvaluators] = await Promise.all([
    prisma.peserta.findMany({
      where: { kegiatanId },
      select: { id: true, nama: true },
    }),
    prisma.user.findMany({
      where: { role: 'EVALUATOR', aktif: true },
      select: { id: true, nama: true, nip: true, passwordEncrypted: true },
    }),
  ]);

  if (pesertaList.length === 0) {
    return {
      teamCount: 0,
      totalPeserta: 0,
      mode: 'random' as const,
      evaluatorAccounts: [] as GeneratedEvaluatorSummary[],
    };
  }

  const shuffledPeserta = shuffleArray(pesertaList);
  const buckets = hitungAlokasiTimAuto10(shuffledPeserta, 10);
  const shuffledEvaluators = shuffleArray(activeEvaluators);

  const chosenAccounts: Array<{
    userId: string;
    nama: string;
    username: string;
    sandiAwal: string | null;
    status: 'created' | 'linked';
    namaTim: string;
  }> = [];

  for (let idx = 0; idx < buckets.length; idx++) {
    const urutan = idx + 1;
    const existingEv = shuffledEvaluators[idx];
    if (existingEv) {
      chosenAccounts.push({
        userId: existingEv.id,
        nama: existingEv.nama,
        username: existingEv.nip || buatUsernameBase(existingEv.nama),
        sandiAwal: null,
        status: 'linked',
        namaTim: `Tim ${urutan}`,
      });
    } else {
      const created = await resolveOrCreateEvaluatorAccount(`Evaluator Tim ${urutan}`);
      chosenAccounts.push({
        ...created,
        namaTim: `Tim ${urutan}`,
      });
    }
  }

  const summaries: GeneratedEvaluatorSummary[] = [];

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
      const acc = chosenAccounts[idx];
      const team = await tx.timEvaluator.upsert({
        where: { kegiatanId_urutan: { kegiatanId, urutan } },
        update: {
          namaTim: acc.namaTim,
          evaluatorId: acc.userId,
        },
        create: {
          kegiatanId,
          urutan,
          namaTim: acc.namaTim,
          evaluatorId: acc.userId,
        },
      });

      const ids = buckets[idx].map((p) => p.id);
      if (ids.length > 0) {
        await tx.peserta.updateMany({
          where: { id: { in: ids } },
          data: { timId: team.id },
        });
      }

      summaries.push({
        userId: acc.userId,
        timId: team.id,
        namaTim: team.namaTim,
        nama: acc.nama,
        username: acc.username,
        sandiAwal: acc.sandiAwal,
        status: acc.status,
      });
    }
  });

  return {
    teamCount: buckets.length,
    totalPeserta: pesertaList.length,
    sizes: buckets.map((b) => b.length),
    mode: 'random' as const,
    evaluatorAccounts: summaries,
  };
}

/**
 * Membentuk tim berdasarkan kolom "Nama Tim Evaluator" dari Excel (mis. Pak Angga, Pak Asep Riyanto, Pak Tugiman).
 * Jika Excel tidak memiliki kolom nama tim, otomatis jatuh ke mode bagi 10 per tim.
 * Sekaligus membuatkan atau menautkan akun Evaluator untuk setiap tim yang terbentuk.
 */
export async function bagiTimDariExcelAtauAuto(kegiatanId: string) {
  const pesertaList = await prisma.peserta.findMany({
    where: { kegiatanId },
    orderBy: [{ createdAt: 'asc' }, { nama: 'asc' }, { id: 'asc' }],
    select: { id: true, namaTimExcel: true },
  });

  if (pesertaList.length === 0) {
    return {
      teamCount: 0,
      totalPeserta: 0,
      mode: 'from_excel' as const,
      evaluatorAccounts: [] as GeneratedEvaluatorSummary[],
    };
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

  const evaluatorAccounts = await ensureEvaluatorAccountsForKegiatan(kegiatanId);

  return {
    teamCount: entries.length,
    totalPeserta: pesertaList.length,
    sizes: entries.map(([, ids]) => ids.length),
    mode: 'from_excel' as const,
    evaluatorAccounts,
  };
}
