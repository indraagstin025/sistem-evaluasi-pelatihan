import { prisma } from '@/lib/prisma';
import { buatPembahasanGrafikWithMeta, sanitizeAiErrorMessage } from '@/lib/ai';
import {
  getKonfirmasiWawancaraMap,
  getRekapGrafikMap,
  PEMBAHASAN_KEYS,
  ringkasKonfirmasiUntukAi,
  type PembahasanKey,
} from '@/lib/pembahasan-server';
import { getHasilSurveyKegiatan, ringkasHasilSurveyUntukAi } from '@/lib/survey-summary';
import { EKSPOSE_SLIDE_KRITERIA_MAP } from '@/lib/wawancara-kriteria';

export const DEFAULT_COOLDOWN_MS = 1_200;
export const STALE_PROCESSING_MS = 90_000;
export const RATE_LIMIT_BACKOFF_BASE_MS = 4_000;
export const MAX_JOB_ATTEMPTS = 3;

export interface AiQueueJobDTO {
  id: string;
  kegiatanId: string;
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
    kegiatanId: job.kegiatanId,
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
 * Memulihkan job yang macet di status "processing" untuk suatu kegiatan.
 */
export async function recoverStaleJobs(kegiatanId: string): Promise<void> {
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);
  const staleJobs = await prisma.aiJob.findMany({
    where: {
      kegiatanId,
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
 * Mengambil ringkasan antrean aktif beserta riwayat singkat 10 menit terakhir per kegiatan.
 */
export async function getQueueSnapshot(kegiatanId: string): Promise<QueueSnapshot> {
  await recoverStaleJobs(kegiatanId);

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const [activeRaw, recentRaw] = await Promise.all([
    prisma.aiJob.findMany({
      where: { kegiatanId, status: { in: ['queued', 'processing'] } },
      orderBy: [{ nextRunAt: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.aiJob.findMany({
      where: {
        kegiatanId,
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
 * Menambahkan 1 slide atau seluruh 6 slide ke dalam antrean AiJob untuk suatu kegiatan.
 */
export async function enqueueAiJobs(
  kegiatanId: string,
  grafikKeyInput: string
): Promise<
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

  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id: kegiatanId },
    select: { id: true },
  });
  if (!kegiatan) {
    return {
      ok: false,
      status: 404,
      error: 'Kegiatan tidak ditemukan.',
    };
  }

  const totalPeserta = await prisma.peserta.count({ where: { kegiatanId } });
  if (totalPeserta === 0) {
    return {
      ok: false,
      status: 400,
      error: 'Belum ada data peserta untuk dianalisis. Impor data terlebih dahulu.',
    };
  }

  await recoverStaleJobs(kegiatanId);

  const targetKeys: PembahasanKey[] =
    grafikKeyInput === 'all'
      ? [...PEMBAHASAN_KEYS]
      : [grafikKeyInput as PembahasanKey];

  const existingActive = await prisma.aiJob.findMany({
    where: {
      kegiatanId,
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
                kegiatanId,
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

  const snapshot = await getQueueSnapshot(kegiatanId);
  return {
    ok: true,
    batchId,
    createdJobs: createdRaw.map(toJobDto),
    skippedKeys,
    snapshot,
  };
}

/**
 * Membatalkan semua job berstatus "queued" pada kegiatan tertentu.
 */
export async function cancelQueuedJobs(kegiatanId: string) {
  const res = await prisma.aiJob.updateMany({
    where: { kegiatanId, status: 'queued' },
    data: {
      status: 'failed',
      lastError: 'Dibatalkan oleh pengguna',
      finishedAt: new Date(),
    },
  });
  const snapshot = await getQueueSnapshot(kegiatanId);
  return {
    cancelledCount: res.count,
    snapshot,
  };
}

export interface ProcessAiJobResult {
  processed: boolean;
  retrying?: boolean;
  waitingBackoff?: boolean;
  usedTemplateFallback?: boolean;
  fallbackReason?: string | null;
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
 * Mengklaim dan memproses 1 job tertua yang siap untuk suatu kegiatan.
 */
export async function processNextAiJob(kegiatanId: string): Promise<ProcessAiJobResult> {
  await recoverStaleJobs(kegiatanId);

  let claimedJob: any = null;

  for (let probe = 0; probe < 3; probe++) {
    const now = new Date();
    const candidate = await prisma.aiJob.findFirst({
      where: {
        kegiatanId,
        status: 'queued',
        nextRunAt: { lte: now },
      },
      orderBy: [{ nextRunAt: 'asc' }, { createdAt: 'asc' }],
    });

    if (!candidate) break;

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
    const snapshot = await getQueueSnapshot(kegiatanId);
    return buildProcessResult(snapshot, {
      processed: false,
      waitingBackoff: snapshot.queuedCount > 0,
      nextWaitMs: snapshot.nextWaitMs,
    });
  }

  try {
    const totalPeserta = await prisma.peserta.count({ where: { kegiatanId } });
    if (totalPeserta === 0) {
      const failed = await prisma.aiJob.update({
        where: { id: claimedJob.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          lastError: 'Data peserta kosong (0 peserta)',
        },
      });
      const snapshot = await getQueueSnapshot(kegiatanId);
      return buildProcessResult(snapshot, {
        processed: false,
        job: toJobDto(failed),
        nextWaitMs: snapshot.nextWaitMs,
        error: 'Belum ada data peserta untuk dianalisis.',
      });
    }

    const [rekapMap, konfirmasiMap] = await Promise.all([
      getRekapGrafikMap(kegiatanId),
      getKonfirmasiWawancaraMap(kegiatanId),
    ]);
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
      const snapshot = await getQueueSnapshot(kegiatanId);
      return buildProcessResult(snapshot, {
        processed: true,
        job: toJobDto(failed),
        nextWaitMs: snapshot.nextWaitMs,
      });
    }

    let extraSurveySummary: string | undefined;
    let extraKonfirmasiSummary: string | undefined;
    if (claimedJob.grafikKey === 'kesimpulan') {
      const surveySummary = await getHasilSurveyKegiatan(kegiatanId);
      extraSurveySummary = ringkasHasilSurveyUntukAi(surveySummary);
      extraKonfirmasiSummary = ringkasKonfirmasiUntukAi(konfirmasiMap);
    }

    const slideKeys =
      EKSPOSE_SLIDE_KRITERIA_MAP[
        claimedJob.grafikKey as keyof typeof EKSPOSE_SLIDE_KRITERIA_MAP
      ];
    const slideKonfirmasiSummary =
      claimedJob.grafikKey !== 'kesimpulan' && slideKeys
        ? ringkasKonfirmasiUntukAi(konfirmasiMap, slideKeys)
        : undefined;

    const meta = await buatPembahasanGrafikWithMeta(
      claimedJob.grafikKey,
      rekap,
      claimedJob.grafikKey === 'kesimpulan'
        ? { totalPeserta, rekapMap, extraSurveySummary, extraKonfirmasiSummary }
        : undefined,
      slideKonfirmasiSummary
    );

    if (meta.rateLimited && claimedJob.attempts < claimedJob.maxAttempts) {
      const backoffMs = RATE_LIMIT_BACKOFF_BASE_MS * claimedJob.attempts;
      const retryAt = new Date(Date.now() + backoffMs);
      const requeued = await prisma.aiJob.update({
        where: { id: claimedJob.id },
        data: {
          status: 'queued',
          nextRunAt: retryAt,
          lastError: `${sanitizeAiErrorMessage(meta.errorMessage, 'Rate limit Gemini')} - retry ke-${claimedJob.attempts} dalam ${backoffMs / 1000}d`,
        },
      });
      const snapshot = await getQueueSnapshot(kegiatanId);
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
      where: {
        kegiatanId_grafikKey: {
          kegiatanId,
          grafikKey: claimedJob.grafikKey,
        },
      },
      update: payload,
      create: {
        kegiatanId,
        grafikKey: claimedJob.grafikKey,
        ...payload,
      },
    });

    const usedTemplateFallback = meta.item.sumber !== 'ai';
    const fallbackReason = usedTemplateFallback
      ? sanitizeAiErrorMessage(meta.errorMessage, 'Memakai templat resmi KP-05')
      : null;

    const finishedJob = await prisma.aiJob.update({
      where: { id: claimedJob.id },
      data: {
        status: 'done',
        finishedAt: new Date(),
        modelUsed: meta.modelUsed || 'template-kp05',
        lastError: fallbackReason,
      },
    });

    const snapshot = await getQueueSnapshot(kegiatanId);
    return buildProcessResult(snapshot, {
      processed: true,
      retrying: false,
      usedTemplateFallback,
      fallbackReason,
      job: toJobDto(finishedJob),
      savedPembahasan,
    });
  } catch (err: unknown) {
    const msg = sanitizeAiErrorMessage(
      err instanceof Error ? err.message : undefined,
      'Kesalahan saat memproses antrean AI'
    );
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
            lastError: `${msg} - dijadwalkan ulang`,
          },
    });
    const snapshot = await getQueueSnapshot(kegiatanId);
    return buildProcessResult(snapshot, {
      processed: false,
      retrying: !isFinal,
      job: toJobDto(updatedJob),
      error: msg,
    });
  }
}
