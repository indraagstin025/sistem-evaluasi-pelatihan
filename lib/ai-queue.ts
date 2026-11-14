import { prisma } from '@/lib/prisma';
import { buatPembahasanGrafikWithMeta } from '@/lib/ai';
import { getRekapGrafikMap, PEMBAHASAN_KEYS, type PembahasanKey } from '@/lib/pembahasan-server';

export const DEFAULT_COOLDOWN_MS = 1_200;
export const STALE_PROCESSING_MS = 90_000;
export const RATE_LIMIT_BACKOFF_BASE_MS = 4_000;
export const MAX_JOB_ATTEMPTS = 3; // 1 percobaan awal + maksimal 2x retry

export interface AiQueueJobDTO {
  id: string;
  batchId: string | null;
  grafikKey: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  modelUsed: string | null;
  lastError: string | null;
  nextRunAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueueSnapshot {
  queuedCount: number;
  processingCount: number;
  activeJobs: AiQueueJobDTO[];
  recentJobs: AiQueueJobDTO[];
  nextWaitMs: number;
}

function toJobDto(job: any): AiQueueJobDTO {
  return {
    id: job.id,
    batchId: job.batchId,
    grafikKey: job.grafikKey,
    status: job.status,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    modelUsed: job.modelUsed,
    lastError: job.lastError,
    nextRunAt: job.nextRunAt.toISOString(),
    startedAt: job.startedAt ? job.startedAt.toISOString() : null,
    finishedAt: job.finishedAt ? job.finishedAt.toISOString() : null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

/**
 * Memulihkan job yang macet di status "processing" (mis. koneksi/tab terputus).
 */
export async function recoverStaleJobs(): Promise<void> {
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);
  const staleJobs = await prisma.aiJob.findMany({
    where: {
      status: 'processing',
      startedAt: { lt: staleBefore },
    },
  });

  if (staleJobs.length === 0) return;

  const now = new Date();
  await Promise.all(
    staleJobs.map((job) =>
      job.attempts < job.maxAttempts
        ? prisma.aiJob.update({
            where: { id: job.id },
            data: {
              status: 'queued',
              nextRunAt: now,
              lastError: 'Worker terputus sebelumnya, dijadwalkan ulang otomatis',
            },
          })
        : prisma.aiJob.update({
            where: { id: job.id },
            data: {
              status: 'failed',
              finishedAt: now,
              lastError: 'Batas percobaan tercapai setelah worker terputus',
            },
          })
    )
  );
}

/**
 * Mengambil ringkasan antrian aktif beserta riwayat singkat 10 menit terakhir.
 */
export async function getQueueSnapshot(): Promise<QueueSnapshot> {
  await recoverStaleJobs();

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const [activeRaw, recentRaw] = await Promise.all([
    prisma.aiJob.findMany({
      where: { status: { in: ['queued', 'processing'] } },
      orderBy: [{ nextRunAt: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.aiJob.findMany({
      where: {
        status: { in: ['done', 'failed'] },
        updatedAt: { gte: tenMinutesAgo },
      },
      orderBy: { updatedAt: 'desc' },
      take: 12,
    }),
  ]);

  const activeJobs = activeRaw.map(toJobDto);
  const recentJobs = recentRaw.map(toJobDto);
  const queuedJobs = activeRaw.filter((j) => j.status === 'queued');
  const processingJobs = activeRaw.filter((j) => j.status === 'processing');

  let nextWaitMs = 0;
  if (processingJobs.length > 0) {
    nextWaitMs = 1_500;
  } else if (queuedJobs.length > 0) {
    nextWaitMs = Math.max(0, queuedJobs[0].nextRunAt.getTime() - Date.now());
  }

  return {
    queuedCount: queuedJobs.length,
    processingCount: processingJobs.length,
    activeJobs,
    recentJobs,
    nextWaitMs,
  };
}

/**
 * Menambahkan 1 slide atau seluruh 6 slide ke dalam tabel antrian AiJob
 * dengan deduplikasi agar grafikKey yang sedang antre/diproses tidak ganda.
 */
export async function enqueueAiJobs(grafikKeyInput: string): Promise<
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      batchId: string;
      createdJobs: AiQueueJobDTO[];
      skippedKeys: string[];
      snapshot: QueueSnapshot;
    }
> {
  const validKeys = new Set<string>(['all', ...PEMBAHASAN_KEYS]);
  if (!validKeys.has(grafikKeyInput)) {
    return {
      ok: false,
      status: 400,
      error: `Parameter grafikKey "${grafikKeyInput}" tidak valid.`,
    };
  }

  const totalPeserta = await prisma.peserta.count();
  if (totalPeserta === 0) {
    return {
      ok: false,
      status: 400,
      error: 'Belum ada data peserta untuk dianalisis. Impor data terlebih dahulu.',
    };
  }

  await recoverStaleJobs();

  const targetKeys: PembahasanKey[] =
    grafikKeyInput === 'all'
      ? [...PEMBAHASAN_KEYS]
      : [grafikKeyInput as PembahasanKey];

  const existingActive = await prisma.aiJob.findMany({
    where: {
      grafikKey: { in: targetKeys },
      status: { in: ['queued', 'processing'] },
    },
    select: { grafikKey: true },
  });

  const existingSet = new Set(existingActive.map((j) => j.grafikKey));
  const keysToCreate = targetKeys.filter((k) => !existingSet.has(k));
  const skippedKeys = targetKeys.filter((k) => existingSet.has(k));

  const batchId = `batch_${Date.now()}`;
  const baseMs = Date.now();

  const createdRaw =
    keysToCreate.length > 0
      ? await prisma.$transaction(
          keysToCreate.map((key, idx) =>
            prisma.aiJob.create({
              data: {
                batchId,
                grafikKey: key,
                status: 'queued',
                attempts: 0,
                maxAttempts: MAX_JOB_ATTEMPTS,
                nextRunAt: new Date(baseMs + idx),
              },
            })
          )
        )
      : [];

  const snapshot = await getQueueSnapshot();
  return {
    ok: true,
    batchId,
    createdJobs: createdRaw.map(toJobDto),
    skippedKeys,
    snapshot,
  };
}

/**
 * Membatalkan semua job yang masih berstatus "queued".
 */
export async function cancelQueuedJobs() {
  const res = await prisma.aiJob.updateMany({
    where: { status: 'queued' },
    data: {
      status: 'failed',
      lastError: 'Dibatalkan oleh pengguna',
      finishedAt: new Date(),
    },
  });
  const snapshot = await getQueueSnapshot();
  return {
    cancelledCount: res.count,
    snapshot,
  };
}

export interface ProcessAiJobResult {
  processed: boolean;
  retrying?: boolean;
  waitingBackoff?: boolean;
  job?: AiQueueJobDTO;
  savedPembahasan?: any;
  activeJobs: AiQueueJobDTO[];
  remainingCount: number;
  processingCount: number;
  nextWaitMs: number;
  error?: string;
}

function buildProcessResult(
  snapshot: QueueSnapshot,
  extra: Omit<ProcessAiJobResult, 'activeJobs' | 'remainingCount' | 'processingCount' | 'nextWaitMs'> & {
    nextWaitMs?: number;
  }
): ProcessAiJobResult {
  const computedWait =
    extra.nextWaitMs !== undefined
      ? extra.nextWaitMs
      : snapshot.queuedCount > 0
        ? Math.max(DEFAULT_COOLDOWN_MS, snapshot.nextWaitMs)
        : 0;
  return {
    ...extra,
    activeJobs: snapshot.activeJobs,
    remainingCount: snapshot.queuedCount,
    processingCount: snapshot.processingCount,
    nextWaitMs: computedWait,
  };
}

/**
 * Mengklaim dan memproses tepat 1 job tertua yang sudah siap (nextRunAt <= now).
 */
export async function processNextAiJob(): Promise<ProcessAiJobResult> {
  await recoverStaleJobs();

  let claimedJob: any = null;

  // Maksimal 3 percobaan klaim atomik bila worker lain mendahului
  for (let probe = 0; probe < 3; probe++) {
    const now = new Date();
    const candidate = await prisma.aiJob.findFirst({
      where: {
        status: 'queued',
        nextRunAt: { lte: now },
      },
      orderBy: [{ nextRunAt: 'asc' }, { createdAt: 'asc' }],
    });

    if (!candidate) {
      break;
    }

    const claim = await prisma.aiJob.updateMany({
      where: {
        id: candidate.id,
        status: 'queued',
      },
      data: {
        status: 'processing',
        startedAt: now,
        attempts: { increment: 1 },
      },
    });

    if (claim.count === 1) {
      claimedJob = {
        ...candidate,
        status: 'processing',
        startedAt: now,
        attempts: candidate.attempts + 1,
      };
      break;
    }
  }

  if (!claimedJob) {
    const snapshot = await getQueueSnapshot();
    const waitingBackoff = snapshot.queuedCount > 0;
    return buildProcessResult(snapshot, {
      processed: false,
      waitingBackoff,
      nextWaitMs: snapshot.nextWaitMs,
    });
  }

  try {
    const totalPeserta = await prisma.peserta.count();
    if (totalPeserta === 0) {
      const failed = await prisma.aiJob.update({
        where: { id: claimedJob.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          lastError: 'Data peserta kosong (0 peserta)',
        },
      });
      const snapshot = await getQueueSnapshot();
      return buildProcessResult(snapshot, {
        processed: false,
        job: toJobDto(failed),
        nextWaitMs: snapshot.nextWaitMs,
        error: 'Belum ada data peserta untuk dianalisis.',
      });
    }

    const rekapMap = await getRekapGrafikMap();
    const rekap =
      claimedJob.grafikKey === 'kesimpulan'
        ? undefined
        : (rekapMap as Record<string, any>)[claimedJob.grafikKey];

    if (claimedJob.grafikKey !== 'kesimpulan' && !rekap) {
      const failed = await prisma.aiJob.update({
        where: { id: claimedJob.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          lastError: `Rekap grafik "${claimedJob.grafikKey}" tidak ditemukan`,
        },
      });
      const snapshot = await getQueueSnapshot();
      return buildProcessResult(snapshot, {
        processed: true,
        job: toJobDto(failed),
        nextWaitMs: snapshot.nextWaitMs,
      });
    }

    const meta = await buatPembahasanGrafikWithMeta(
      claimedJob.grafikKey,
      rekap,
      claimedJob.grafikKey === 'kesimpulan' ? { totalPeserta, rekapMap } : undefined
    );

    // Jika semua model Gemini kena rate limit / timeout dan masih ada jatah retry
    if (meta.rateLimited && claimedJob.attempts < claimedJob.maxAttempts) {
      const backoffMs = RATE_LIMIT_BACKOFF_BASE_MS * claimedJob.attempts;
      const retryAt = new Date(Date.now() + backoffMs);
      const requeued = await prisma.aiJob.update({
        where: { id: claimedJob.id },
        data: {
          status: 'queued',
          nextRunAt: retryAt,
          lastError: `${meta.errorMessage || 'Rate limit Gemini'} — retry ke-${claimedJob.attempts} dalam ${backoffMs / 1000}d`,
        },
      });
      const snapshot = await getQueueSnapshot();
      return buildProcessResult(snapshot, {
        processed: true,
        retrying: true,
        job: toJobDto(requeued),
        savedPembahasan: null,
        nextWaitMs: Math.max(backoffMs, snapshot.nextWaitMs),
      });
    }

    const payload = {
      judul: meta.item.judul,
      poin1: meta.item.poin1,
      poin2: meta.item.poin2,
      poin3: meta.item.poin3,
      poin4: meta.item.poin4,
      teksLengkap: meta.item.teksLengkap,
      sumber: meta.item.sumber,
    };

    const savedPembahasan = await prisma.pembahasan.upsert({
      where: { grafikKey: claimedJob.grafikKey },
      update: payload,
      create: {
        grafikKey: claimedJob.grafikKey,
        ...payload,
      },
    });

    const finishedJob = await prisma.aiJob.update({
      where: { id: claimedJob.id },
      data: {
        status: 'done',
        finishedAt: new Date(),
        modelUsed: meta.modelUsed || 'template-kp05',
        lastError: meta.item.sumber === 'ai' ? null : meta.errorMessage || 'Memakai templat resmi KP-05',
      },
    });

    const snapshot = await getQueueSnapshot();
    return buildProcessResult(snapshot, {
      processed: true,
      retrying: false,
      job: toJobDto(finishedJob),
      savedPembahasan,
    });
  } catch (err: any) {
    const msg = err?.message || 'Kesalahan saat memproses job AI';
    const isFinal = claimedJob.attempts >= claimedJob.maxAttempts;
    const updatedJob = await prisma.aiJob.update({
      where: { id: claimedJob.id },
      data: isFinal
        ? {
            status: 'failed',
            finishedAt: new Date(),
            lastError: msg,
          }
        : {
            status: 'queued',
            nextRunAt: new Date(Date.now() + RATE_LIMIT_BACKOFF_BASE_MS),
            lastError: `${msg} — dijadwalkan ulang`,
          },
    });
    const snapshot = await getQueueSnapshot();
    return buildProcessResult(snapshot, {
      processed: false,
      retrying: !isFinal,
      job: toJobDto(updatedJob),
      error: msg,
    });
  }
}
