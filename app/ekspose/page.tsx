'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CheckIcon,
  CircleBackslashIcon,
  ClockIcon,
  DownloadIcon,
  ExclamationTriangleIcon,
  Pencil1Icon,
  ReaderIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartJsTooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { PrinterIcon } from '@/components/ui/icons';
import { Progress } from '@/components/ui/progress';
import { StatusBanner } from '@/components/ui/status-banner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartJsTooltip, Legend);

// Plugin Chart.js untuk menampilkan angka peserta tepat di samping kanan ujung batang horizontal
const horizontalBarLabelPlugin = {
  id: 'horizontalBarLabelPlugin',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    ctx.save();
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar: any, index: number) => {
        const value = dataset.data[index];
        if (typeof value === 'number') {
          ctx.fillStyle = '#1e293b';
          ctx.fillText(value.toString(), bar.x + 8, bar.y);
        }
      });
    });
    ctx.restore();
  },
};

function renderFormattedText(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

interface AiQueueJob {
  id: string;
  batchId: string | null;
  grafikKey: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  modelUsed: string | null;
  lastError: string | null;
  nextRunAt: string;
}

const SLIDE_QUEUE_LABELS: Record<string, string> = {
  grafik1: 'Slide 1 (Grafik 1)',
  grafik2: 'Slide 2 (Grafik 2)',
  grafik3: 'Slide 3 (Grafik 3)',
  grafik4: 'Slide 4 (Grafik 4)',
  grafik5: 'Slide 5 (Grafik 5)',
  kesimpulan: 'Slide 6 (Kesimpulan & Rekomendasi)',
};

export default function EksposePage() {
  const [data, setData] = useState<any>(null);
  const [pembahasanMap, setPembahasanMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeJobs, setActiveJobs] = useState<AiQueueJob[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [cancellingQueue, setCancellingQueue] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const workerRunningRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    poin1: '',
    poin2: '',
    poin3: '',
    poin4: '',
  });

  const scheduleNextWorkerTick = (delayMs: number) => {
    if (!mountedRef.current) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = setTimeout(() => {
      void runWorkerLoop();
    }, Math.max(0, delayMs));
  };

  const runWorkerLoop = async () => {
    if (workerRunningRef.current || !mountedRef.current) return;
    workerRunningRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    try {
      const res = await fetch('/api/ai/queue/process', {
        method: 'POST',
      });
      const json = await res.json();
      if (!mountedRef.current) return;

      if (!res.ok || !json.success) {
        setQueueError(json.error || 'Gagal memproses antrean AI.');
        if (Array.isArray(json.activeJobs)) {
          setActiveJobs(json.activeJobs);
        }
        return;
      }

      setQueueError(null);
      if (json.savedPembahasan?.grafikKey) {
        setPembahasanMap((prev) => ({
          ...prev,
          [json.savedPembahasan.grafikKey]: json.savedPembahasan,
        }));
      }

      if (Array.isArray(json.activeJobs)) {
        setActiveJobs(json.activeJobs);
      }

      const hasMore = (json.remainingCount ?? 0) > 0 || (json.processingCount ?? 0) > 0;
      workerRunningRef.current = false;
      if (hasMore) {
        scheduleNextWorkerTick(json.nextWaitMs ?? 1200);
      }
      return;
    } catch (err) {
      console.error('Queue worker error:', err);
      if (mountedRef.current) {
        setQueueError('Koneksi bermasalah saat memproses antrean AI.');
      }
    } finally {
      workerRunningRef.current = false;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [resEkspose, resPembahasan, resQueue] = await Promise.all([
        fetch('/api/ekspose', { cache: 'no-store' }),
        fetch('/api/ai/pembahasan', { cache: 'no-store' }),
        fetch('/api/ai/queue', { cache: 'no-store' }),
      ]);

      const jsonEkspose = await resEkspose.json();
      const jsonPembahasan = await resPembahasan.json();
      const jsonQueue = await resQueue.json();

      if (!resEkspose.ok || !jsonEkspose.success) {
        setFetchError(jsonEkspose.error || 'Gagal memuat data slide ekspose.');
        return;
      }

      setData(jsonEkspose);
      if (jsonPembahasan.success) setPembahasanMap(jsonPembahasan.data);
      if (jsonQueue.success) {
        const jobs: AiQueueJob[] = Array.isArray(jsonQueue.activeJobs)
          ? jsonQueue.activeJobs
          : [];
        setActiveJobs(jobs);
        if ((jsonQueue.queuedCount ?? 0) > 0 || (jsonQueue.processingCount ?? 0) > 0) {
          scheduleNextWorkerTick(jsonQueue.nextWaitMs ?? 300);
        }
      }
    } catch (err) {
      console.error('Error fetching ekspose data:', err);
      setFetchError('Koneksi bermasalah saat memuat halaman ekspose.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleRegenerate = async (grafikKey: string) => {
    try {
      if (editingKey === grafikKey || grafikKey === 'all') {
        setEditingKey(null);
      }
      setQueueError(null);
      setActionError(null);

      const res = await fetch('/api/ai/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grafikKey }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error || 'Gagal memasukkan ke antrean AI.');
        return;
      }

      if (Array.isArray(json.activeJobs)) {
        setActiveJobs(json.activeJobs);
      }

      if ((json.queuedCount ?? 0) > 0 || (json.processingCount ?? 0) > 0) {
        if (!workerRunningRef.current) {
          scheduleNextWorkerTick(0);
        }
      }
    } catch (err) {
      console.error(err);
      setActionError('Koneksi bermasalah saat menambahkan ke antrean AI.');
    }
  };

  const handleCancelQueue = async () => {
    try {
      setCancellingQueue(true);
      setActionError(null);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const res = await fetch('/api/ai/queue', { method: 'DELETE' });
      const json = await res.json();
      if (json.success && Array.isArray(json.activeJobs)) {
        setActiveJobs(json.activeJobs);
      }
    } catch (err) {
      console.error(err);
      setActionError('Gagal membatalkan antrean AI.');
    } finally {
      setCancellingQueue(false);
    }
  };

  const getSlideQueueInfo = (key: string) => {
    const idx = activeJobs.findIndex((j) => j.grafikKey === key);
    if (idx === -1) {
      return {
        isActive: false,
        isProcessing: false,
        isQueued: false,
        queuePos: 0,
        isRetrying: false,
        job: null as AiQueueJob | null,
      };
    }
    const job = activeJobs[idx];
    return {
      isActive: true,
      isProcessing: job.status === 'processing',
      isQueued: job.status === 'queued',
      queuePos: idx + 1,
      isRetrying: job.status === 'queued' && job.attempts > 0,
      job,
    };
  };

  const handleStartEdit = (key: string, item: any) => {
    setActionError(null);
    setEditingKey(key);
    setEditForm({
      poin1: item?.poin1 || '',
      poin2: item?.poin2 || '',
      poin3: item?.poin3 || '',
      poin4: item?.poin4 || '',
    });
  };

  const handleSaveEdit = async (key: string) => {
    try {
      setSavingKey(key);
      setActionError(null);
      const res = await fetch('/api/ai/pembahasan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grafikKey: key,
          ...editForm,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPembahasanMap((prev) => ({
          ...prev,
          [key]: json.data,
        }));
        setEditingKey(null);
      } else {
        setActionError(json.error || 'Gagal menyimpan perubahan pembahasan.');
      }
    } catch (err) {
      console.error(err);
      setActionError('Koneksi bermasalah saat menyimpan pembahasan. Coba lagi.');
    } finally {
      setSavingKey(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data?.rekap) return;
    const rekap = data.rekap;
    const kategori = ['76-100', '51-75', '26-50', '1-25', '0'];

    let csvContent =
      'Slide,Judul Slide,Instrumen / Kategori,' +
      kategori.map((k) => `Rentang ${k}`).join(',') +
      ',Total Valid (N)\n';

    Object.keys(rekap).forEach((k) => {
      const g = rekap[k];
      const reversedA = [...g.dataA].reverse();
      const reversedB = [...g.dataB].reverse();
      csvContent += `"${g.slide}","${g.judul}","${g.labelB}",` + reversedB.join(',') + `,${g.totalB}\n`;
      csvContent += `"${g.slide}","${g.judul}","${g.labelA}",` + reversedA.join(',') + `,${g.totalA}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Slide_Ekspose_Resmi_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="py-28 text-center" aria-busy="true">
        <ReloadIcon className="mx-auto mb-3 h-7 w-7 animate-spin text-zinc-950" aria-hidden="true" />
        <p className="text-sm font-medium text-zinc-900">Menyiapkan slide ekspose...</p>
        <p className="mt-1 text-xs font-normal text-zinc-600">
          Menyiapkan 6 slide sesuai format paparan BPSDM
        </p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-6xl py-10">
        <StatusBanner
          tone="error"
          title="Gagal memuat slide ekspose"
          message={fetchError}
          onRetry={fetchData}
        />
      </div>
    );
  }

  const rekap = data?.rekap;
  const presentationCategories = ['76-100', '51-75', '26-50', '1-25', '0'];

  const getHorizontalChartOptions = (maxVal: number): any => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 36,
        top: 8,
        bottom: 8,
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        align: 'center' as const,
        labels: {
          font: { size: 12, weight: 'bold' },
          boxWidth: 15,
          boxHeight: 15,
          padding: 18,
          color: '#334155',
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.x} orang`,
        },
      },
    },
    scales: {
      x: {
        display: false,
        beginAtZero: true,
        max: Math.max(maxVal + 3, 22),
      },
      y: {
        grid: { display: false },
        border: { display: true, color: '#94a3b8', width: 1.5 },
        ticks: {
          font: { weight: 'bold', size: 13 },
          color: '#1e293b',
          padding: 8,
        },
      },
    },
  });

  const slideList = [
    {
      key: 'grafik1',
      slideNumber: 'Slide 5',
      slideTitle:
        'Perbandingan Capaian Jangka Menengah dengan Jangka Panjang (Hasil wawancara)',
      subtitle:
        'Perbandingan capaian jangka menengah dengan jangka panjang (Hasil wawancara)',
      g: rekap?.grafik1,
      labelOrange: 'Jangka panjang',
      labelBlue: 'Jangka menengah',
    },
    {
      key: 'grafik2',
      slideNumber: 'Slide 6',
      slideTitle: 'Target Aksi Perubahan Dalam Jangka Panjang Tercapai',
      subtitle: 'Target Aksi Perubahan dalam jangka panjang tercapai',
      g: rekap?.grafik2,
      labelOrange: 'Nilai Wawancara',
      labelBlue: 'Nilai Survey',
    },
    {
      key: 'grafik3',
      slideNumber: 'Slide 7',
      slideTitle: 'Seluruh Tujuan Aksi Perubahan Dapat Tercapai',
      subtitle: 'Seluruh tujuan Aksi Perubahan dapat tercapai',
      g: rekap?.grafik3,
      labelOrange: 'Nilai Wawancara',
      labelBlue: 'Nilai Survey',
    },
    {
      key: 'grafik4',
      slideNumber: 'Slide 8',
      slideTitle: 'Manfaat Aksi Perubahan',
      subtitle: 'Manfaat Aksi Perubahan',
      g: rekap?.grafik4,
      labelOrange: 'Nilai Wawancara',
      labelBlue: 'Nilai Survey',
    },
    {
      key: 'grafik5',
      slideNumber: 'Slide 9',
      slideTitle: 'Nilai Keseluruhan',
      subtitle: 'Nilai Keseluruhan',
      g: rekap?.grafik5,
      labelOrange: 'Nilai Wawancara',
      labelBlue: 'Nilai Survey',
    },
  ];

  const totalPeserta = data?.ringkasan?.totalPeserta ?? 0;

  const kesimpulanItem = pembahasanMap['kesimpulan'] || {
    poin1: '',
    poin2: '',
    poin3: '',
    poin4: '',
  };

  const kesimpulanPembahasanList = [kesimpulanItem.poin1, kesimpulanItem.poin2]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);

  const rekomendasiList = [
    ...(typeof kesimpulanItem.poin3 === 'string' ? [kesimpulanItem.poin3] : []),
    ...(typeof kesimpulanItem.poin4 === 'string' ? kesimpulanItem.poin4.split(/\r?\n/) : []),
  ]
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);

  const kesimpulanQueue = getSlideQueueInfo('kesimpulan');
  const isKesimpulanLoading = kesimpulanQueue.isActive;
  const activeProcessingJob = activeJobs.find((j) => j.status === 'processing');
  const queuedCount = activeJobs.filter((j) => j.status === 'queued').length;
  const currentStatusJob = activeProcessingJob || activeJobs[0];
  const isAllQueued = activeJobs.length >= 6;
  const progressPct = Math.max(
    10,
    Math.round(((6 - Math.min(6, activeJobs.length)) / 6) * 100)
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16 print:m-0 print:max-w-none print:p-0">
      {/* Top Application Bar (Hidden on Print) */}
      <header className="no-print flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-normal text-zinc-600">
            Format slide PPTX (1:1) · BPSDM Provinsi Jawa Barat
          </p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-zinc-950">
            Ekspose Evaluasi Pasca Pelatihan PKP Angkatan VII
          </h1>
          <p className="mt-1 text-xs font-normal text-zinc-600">
            6 slide lengkap: 5 grafik batang horizontal dengan kotak pembahasan, ditutup slide kesimpulan dan rekomendasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleRegenerate('all')}
            disabled={isAllQueued || savingKey !== null || totalPeserta === 0}
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              activeJobs.length > 0
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-500 bg-white text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            {activeJobs.length > 0 ? (
              <ReloadIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <ReaderIcon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {activeJobs.length > 0
                ? `AI sedang bekerja (${activeJobs.length} slide)`
                : 'Buat Semua dengan AI'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={totalPeserta === 0}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3.5 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon className="h-3.5 w-3.5 text-zinc-700" aria-hidden="true" />
            Unduh Rekap CSV
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={totalPeserta === 0}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PrinterIcon className="h-3.5 w-3.5" />
            Cetak Slide (PDF)
          </button>
        </div>
      </header>

      {actionError && (
        <StatusBanner
          tone="error"
          message={actionError}
          onDismiss={() => setActionError(null)}
          className="no-print"
        />
      )}

      {(activeJobs.length > 0 || queueError) && (
        <div
          role="status"
          aria-live="polite"
          className={`no-print flex flex-col justify-between gap-3.5 rounded-2xl border p-4 sm:flex-row sm:items-center ${
            queueError
              ? 'border-zinc-950 bg-zinc-950 text-white'
              : 'border-zinc-300 bg-zinc-50 text-zinc-950'
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {queueError ? (
              <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
            ) : (
              <ReloadIcon className="h-4 w-4 shrink-0 animate-spin text-zinc-950" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium sm:text-sm">
                {queueError
                  ? queueError
                  : activeProcessingJob
                  ? `AI sedang membuat ${
                      SLIDE_QUEUE_LABELS[activeProcessingJob.grafikKey] ||
                      activeProcessingJob.grafikKey
                    }${queuedCount > 0 ? ` · ${queuedCount} slide menunggu` : ''}`
                  : currentStatusJob?.attempts && currentStatusJob.attempts > 0
                  ? `AI sedang sibuk, mencoba lagi ${
                      SLIDE_QUEUE_LABELS[currentStatusJob.grafikKey] ||
                      currentStatusJob.grafikKey
                    } (percobaan ${currentStatusJob.attempts}/${currentStatusJob.maxAttempts})...`
                  : `Menunggu giliran: ${
                      SLIDE_QUEUE_LABELS[currentStatusJob?.grafikKey || ''] ||
                      'slide berikutnya'
                    } (${activeJobs.length} slide)...`}
              </p>
              {activeJobs.length > 0 && (
                <div className="mt-2">
                  <Progress
                    value={progressPct}
                    className="h-1.5 bg-zinc-200"
                    indicatorClassName="bg-zinc-950"
                    aria-label="Progres pembuatan pembahasan AI"
                  />
                </div>
              )}
            </div>
          </div>

          {queuedCount > 0 && (
            <button
              type="button"
              onClick={handleCancelQueue}
              disabled={cancellingQueue}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-50"
            >
              <CircleBackslashIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {cancellingQueue ? 'Membatalkan...' : `Batalkan Antrean (${queuedCount})`}
            </button>
          )}
        </div>
      )}

      {totalPeserta === 0 ? (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-900 bg-zinc-100 p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 sm:items-center">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-950 sm:mt-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-zinc-950">Belum Ada Data (0 Peserta)</p>
              <p className="mt-0.5 text-xs font-normal text-zinc-700">
                Slide ekspose dan pembahasan akan tampil setelah file Excel survei dan wawancara diimpor.
              </p>
            </div>
          </div>
          <Link
            href="/peserta"
            className="inline-flex shrink-0 items-center justify-center self-start rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 sm:self-auto"
          >
            Impor File Excel
          </Link>
        </div>
      ) : (
        <>
          {/* Quicklinks Navigasi Slide (Hidden on Print) */}
          <nav
            aria-label="Navigasi cepat antar slide"
            className="no-print flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2.5 text-xs"
          >
            <span className="px-2 py-1 font-medium text-zinc-700">Ke slide:</span>
            {slideList.map((s, idx) => (
              <a
                key={s.key}
                href={`#${s.key}`}
                className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 font-medium text-zinc-900 transition hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
              >
                Slide {idx + 1} ({s.slideNumber})
              </a>
            ))}
            <a
              href="#kesimpulan"
              className="rounded-lg border border-zinc-950 bg-zinc-950 px-3 py-1.5 font-medium text-white transition hover:bg-zinc-800"
            >
              Slide 6 (Kesimpulan & Rekomendasi)
            </a>
          </nav>

          {/* Rangkaian 6 Slide Presentasi Resmi */}
          <div className="space-y-12 print:space-y-0">
            {slideList.map((slide) => {
              const g = slide.g;
              if (!g) return null;

              const pItem = pembahasanMap[slide.key];
              const isEditing = editingKey === slide.key;
              const slideQueue = getSlideQueueInfo(slide.key);
              const isItemLoading = slideQueue.isActive;
              const isItemSaving = savingKey === slide.key;

              const maxVal = Math.max(...(g.dataA || []), ...(g.dataB || []), 10);
              const reversedA = [...g.dataA].reverse();
              const reversedB = [...g.dataB].reverse();

              const chartData = {
                labels: presentationCategories,
                datasets: [
                  {
                    label: slide.labelOrange,
                    data: reversedB,
                    backgroundColor: '#ED7D31',
                    barPercentage: 0.75,
                    categoryPercentage: 0.8,
                    borderRadius: 0,
                  },
                  {
                    label: slide.labelBlue,
                    data: reversedA,
                    backgroundColor: '#4472C4',
                    barPercentage: 0.75,
                    categoryPercentage: 0.8,
                    borderRadius: 0,
                  },
                ],
              };

              return (
                <section
                  key={slide.key}
                  id={slide.key}
                  className="slide-card relative space-y-6 overflow-hidden rounded-xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8 md:p-10"
                  style={{ minHeight: '520px' }}
                >
                  {/* Header Slide Resmi */}
                  <div className="relative flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center justify-between sm:contents">
                      <div className="sm:order-1 sm:w-20">
                        <span className="no-print rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">
                          {slide.slideNumber}
                        </span>
                      </div>

                      <div className="flex items-center justify-end sm:order-3">
                        <img
                          src="/logo-jabar.png"
                          alt="Provincial Government of West Java"
                          width={160}
                          height={40}
                          className="h-9 w-auto object-contain sm:h-10"
                        />
                      </div>
                    </div>

                    <div className="flex-1 text-left sm:order-2 sm:px-4 sm:text-center">
                      <h2 className="text-lg font-semibold leading-snug tracking-tight text-slate-900 sm:text-2xl">
                        {slide.slideTitle}
                      </h2>
                    </div>
                  </div>

                  {/* Isi Slide: 2 Kolom */}
                  <div className="grid grid-cols-1 items-stretch gap-8 pt-2 lg:grid-cols-12">
                    <div className="flex flex-col justify-between lg:col-span-7">
                      <div className="mb-2">
                        <p className="text-sm font-medium text-slate-700">{slide.subtitle}</p>
                      </div>

                      <div className="relative h-[290px] w-full sm:h-[310px]">
                        <Bar
                          data={chartData}
                          options={getHorizontalChartOptions(maxVal)}
                          plugins={[horizontalBarLabelPlugin]}
                        />
                      </div>

                      {/* Tabel Rekapitulasi Angka Per Rentang (UR-F-05) */}
                      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/50">
                        <table className="w-full border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-100 font-medium text-slate-800">
                              <th className="px-2.5 py-1.5 text-left">Sumber</th>
                              {presentationCategories.map((kat) => (
                                <th key={kat} className="px-2 py-1.5 text-center font-mono">
                                  {kat}
                                </th>
                              ))}
                              <th className="bg-slate-200/70 px-2.5 py-1.5 text-center font-mono text-slate-900">
                                Total (N)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            <tr>
                              <td className="px-2.5 py-1.5 font-medium text-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2.5 w-2.5 shrink-0 bg-[#ED7D31]" />
                                  <span>{g.labelB}</span>
                                </div>
                              </td>
                              {reversedB.map((val, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="px-2 py-1.5 text-center font-mono text-slate-800 tabular-nums"
                                >
                                  {val}
                                </td>
                              ))}
                              <td className="bg-slate-50 px-2.5 py-1.5 text-center font-mono font-semibold text-slate-900 tabular-nums">
                                {g.totalB}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-2.5 py-1.5 font-medium text-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2.5 w-2.5 shrink-0 bg-[#4472C4]" />
                                  <span>{g.labelA}</span>
                                </div>
                              </td>
                              {reversedA.map((val, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="px-2 py-1.5 text-center font-mono text-slate-800 tabular-nums"
                                >
                                  {val}
                                </td>
                              ))}
                              <td className="bg-slate-50 px-2.5 py-1.5 text-center font-mono font-semibold text-slate-900 tabular-nums">
                                {g.totalA}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Kotak Pembahasan Biru Muda Resmi (#D9E1F2) */}
                    <div className="flex flex-col lg:col-span-5">
                      <div className="flex flex-1 flex-col justify-between rounded-lg border border-[#C5D1E8] bg-[#D9E1F2] p-5 sm:p-6">
                        <div>
                          <div className="relative mb-3 flex items-center justify-between border-b border-slate-500/30 pb-2">
                            <div className="w-full text-center">
                              <h3 className="text-sm font-semibold tracking-wide text-slate-900 underline decoration-1 underline-offset-4 sm:text-base">
                                Pembahasan
                              </h3>
                            </div>

                            <div className="no-print absolute right-0 top-0 flex items-center gap-1">
                              {!isEditing ? (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() => handleRegenerate(slide.key)}
                                        disabled={isItemLoading || isItemSaving}
                                        aria-label={`Buat ulang pembahasan ${slide.slideNumber} dengan AI`}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-400 bg-white/90 text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {slideQueue.isProcessing ? (
                                          <ReloadIcon
                                            className="h-3.5 w-3.5 animate-spin text-zinc-950"
                                            aria-hidden="true"
                                          />
                                        ) : slideQueue.isQueued ? (
                                          <ClockIcon
                                            className="h-3.5 w-3.5 text-zinc-800"
                                            aria-hidden="true"
                                          />
                                        ) : (
                                          <ReloadIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                        )}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {slideQueue.isProcessing
                                        ? 'AI sedang membuat pembahasan'
                                        : slideQueue.isQueued
                                        ? `Menunggu antrean (urutan ke-${slideQueue.queuePos})`
                                        : 'Buat ulang pembahasan dengan AI'}
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() => handleStartEdit(slide.key, pItem)}
                                        disabled={isItemLoading || isItemSaving}
                                        aria-label={`Sunting teks pembahasan ${slide.slideNumber}`}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-400 bg-white/90 text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <Pencil1Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Ubah teks pembahasan secara manual</TooltipContent>
                                  </Tooltip>
                                </>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingKey(null)}
                                    disabled={isItemSaving}
                                    className="rounded border border-zinc-400 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-900 disabled:opacity-50"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(slide.key)}
                                    disabled={isItemSaving}
                                    className="inline-flex items-center gap-1 rounded bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
                                  >
                                    {isItemSaving ? (
                                      <ReloadIcon className="h-3 w-3 animate-spin" aria-hidden="true" />
                                    ) : (
                                      <CheckIcon className="h-3 w-3" aria-hidden="true" />
                                    )}
                                    {isItemSaving ? 'Menyimpan...' : 'Simpan'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {!isEditing ? (
                            isItemLoading ? (
                              <div className="space-y-3 py-2" aria-busy="true">
                                <div className="flex items-center gap-2 text-xs font-medium text-zinc-900">
                                  {slideQueue.isProcessing ? (
                                    <ReloadIcon
                                      className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-950"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <ClockIcon
                                      className="h-3.5 w-3.5 shrink-0 text-zinc-800"
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span>
                                    {slideQueue.isProcessing
                                      ? 'AI sedang membaca data slide ini...'
                                      : slideQueue.isRetrying
                                      ? `AI sedang sibuk, mencoba lagi (${slideQueue.job?.attempts}/${slideQueue.job?.maxAttempts})...`
                                      : `Menunggu giliran (ke-${slideQueue.queuePos})...`}
                                  </span>
                                </div>
                                <div className="space-y-2.5">
                                  <div className="h-3 w-11/12 rounded bg-zinc-900/15" />
                                  <div className="h-3 w-full rounded bg-zinc-900/15" />
                                  <div className="h-3 w-5/6 rounded bg-zinc-900/15" />
                                  <div className="mt-3 h-3 w-10/12 rounded bg-zinc-900/15" />
                                  <div className="h-3 w-3/4 rounded bg-zinc-900/15" />
                                </div>
                              </div>
                            ) : pItem?.poin1 || pItem?.poin2 || pItem?.poin3 || pItem?.poin4 ? (
                              <div className="space-y-3 text-xs leading-relaxed text-slate-900 sm:text-[13px]">
                                <ul className="list-disc space-y-2.5 pl-4">
                                  {pItem?.poin1 && <li>{renderFormattedText(pItem.poin1)}</li>}
                                  {pItem?.poin2 && <li>{renderFormattedText(pItem.poin2)}</li>}
                                  {pItem?.poin3 && <li>{renderFormattedText(pItem.poin3)}</li>}
                                  {pItem?.poin4 && <li>{renderFormattedText(pItem.poin4)}</li>}
                                </ul>
                              </div>
                            ) : (
                              <div className="no-print space-y-2.5 py-6 text-center">
                                <p className="text-xs font-normal text-slate-800">
                                  Pembahasan untuk slide ini belum dibuat.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleRegenerate(slide.key)}
                                  disabled={isItemLoading}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-950 bg-zinc-950 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                                >
                                  <ReaderIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                  Buat Pembahasan dengan AI
                                </button>
                              </div>
                            )
                          ) : (
                            <div className="space-y-2.5 text-xs">
                              {(['poin1', 'poin2', 'poin3', 'poin4'] as const).map((fieldKey, fIdx) => {
                                const fieldId = `${slide.key}-${fieldKey}`;
                                return (
                                  <div key={fieldKey}>
                                    <label
                                      htmlFor={fieldId}
                                      className="mb-0.5 block text-[11px] font-medium text-slate-800"
                                    >
                                      Poin {fIdx + 1}:
                                    </label>
                                    <textarea
                                      id={fieldId}
                                      rows={2}
                                      value={editForm[fieldKey]}
                                      onChange={(e) =>
                                        setEditForm({ ...editForm, [fieldKey]: e.target.value })
                                      }
                                      className="w-full rounded border border-zinc-500 bg-white p-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-500/25 pt-2 text-[10px] font-normal text-slate-700">
                          <span>
                            Sumber:{' '}
                            {pItem?.sumber === 'ai'
                              ? 'AI (Gemini)'
                              : pItem?.sumber === 'manual'
                              ? 'Diubah manual'
                              : 'Template (slide PPT)'}
                          </span>
                          <span className="font-medium text-zinc-900">BPSDM Jabar</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}

            {/* SLIDE 6 (SLIDE 10: KESIMPULAN DAN REKOMENDASI) */}
            <section
              id="kesimpulan"
              className="slide-card relative space-y-6 overflow-hidden rounded-xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8 md:p-10"
              style={{ minHeight: '520px' }}
            >
              <div className="relative flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between sm:contents">
                  <div className="sm:order-1 sm:w-20">
                    <span className="no-print rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">
                      Slide 10
                    </span>
                  </div>

                  <div className="flex items-center justify-end sm:order-3">
                    <img
                      src="/logo-jabar.png"
                      alt="Provincial Government of West Java"
                      width={160}
                      height={40}
                      className="h-9 w-auto object-contain sm:h-10"
                    />
                  </div>
                </div>

                <div className="flex-1 text-left sm:order-2 sm:px-4 sm:text-center">
                  <h2 className="text-lg font-semibold leading-snug tracking-tight text-slate-900 sm:text-2xl">
                    Kesimpulan dan Rekomendasi
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 items-stretch gap-6 pt-2 md:grid-cols-2">
                {/* Kotak Peach (#FCE4D6) - Pembahasan */}
                <div className="flex flex-col justify-between rounded-lg border border-[#F4CCA4] bg-[#FCE4D6] p-6">
                  <div>
                    <div className="mb-4 text-center">
                      <h3 className="text-base font-semibold tracking-wide text-slate-900 underline decoration-1 underline-offset-4">
                        Pembahasan
                      </h3>
                    </div>

                    {editingKey !== 'kesimpulan' ? (
                      isKesimpulanLoading ? (
                        <div className="space-y-3 py-2" aria-busy="true">
                          <div className="flex items-center gap-2 text-xs font-medium text-zinc-900">
                            {kesimpulanQueue.isProcessing ? (
                              <ReloadIcon
                                className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-950"
                                aria-hidden="true"
                              />
                            ) : (
                              <ClockIcon
                                className="h-3.5 w-3.5 shrink-0 text-zinc-800"
                                aria-hidden="true"
                              />
                            )}
                            <span>
                              {kesimpulanQueue.isProcessing
                                ? 'AI sedang menyusun kesimpulan...'
                                : kesimpulanQueue.isRetrying
                                ? `AI sedang sibuk, mencoba lagi (${kesimpulanQueue.job?.attempts}/${kesimpulanQueue.job?.maxAttempts})...`
                                : `Menunggu giliran (ke-${kesimpulanQueue.queuePos}) untuk menyusun kesimpulan...`}
                            </span>
                          </div>
                          <div className="space-y-2.5">
                            <div className="h-3 w-11/12 rounded bg-zinc-900/15" />
                            <div className="h-3 w-full rounded bg-zinc-900/15" />
                            <div className="h-3 w-4/5 rounded bg-zinc-900/15" />
                            <div className="mt-3 h-3 w-10/12 rounded bg-zinc-900/15" />
                            <div className="h-3 w-3/4 rounded bg-zinc-900/15" />
                          </div>
                        </div>
                      ) : kesimpulanPembahasanList.length > 0 ? (
                        <ul className="list-disc space-y-4 pl-5 text-xs leading-relaxed text-slate-900 sm:text-[13px]">
                          {kesimpulanPembahasanList.map((poin, idx) => (
                            <li key={idx}>{renderFormattedText(poin)}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="no-print py-6 text-center text-xs font-normal text-slate-800">
                          Pembahasan kesimpulan belum dibuat. Pilih{' '}
                          <span className="font-semibold">Buat dengan AI</span> untuk menyusunnya dari data.
                        </div>
                      )
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="kesimpulan-poin1"
                            className="mb-1 block text-[11px] font-medium text-slate-800"
                          >
                            Paragraf 1 (Pembahasan Capaian):
                          </label>
                          <textarea
                            id="kesimpulan-poin1"
                            rows={6}
                            value={editForm.poin1}
                            onChange={(e) => setEditForm({ ...editForm, poin1: e.target.value })}
                            className="w-full rounded border border-zinc-500 bg-white p-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="kesimpulan-poin2"
                            className="mb-1 block text-[11px] font-medium text-slate-800"
                          >
                            Paragraf 2 (Pengaruh Mutasi/Rotasi):
                          </label>
                          <textarea
                            id="kesimpulan-poin2"
                            rows={3}
                            value={editForm.poin2}
                            onChange={(e) => setEditForm({ ...editForm, poin2: e.target.value })}
                            className="w-full rounded border border-zinc-500 bg-white p-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-slate-500/25 pt-2 text-right text-[10px] font-normal text-slate-700">
                    Evaluasi Pasca Pelatihan · PKP Angkatan VII
                  </div>
                </div>

                {/* Kotak Hijau Muda (#E2EFDA) - Rekomendasi */}
                <div className="flex flex-col justify-between rounded-lg border border-[#C5E0B4] bg-[#E2EFDA] p-6">
                  <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-left sm:flex-1 sm:text-center">
                        <h3 className="text-base font-semibold tracking-wide text-slate-900 underline decoration-1 underline-offset-4">
                          Rekomendasi
                        </h3>
                      </div>

                      <div className="no-print shrink-0">
                        {editingKey !== 'kesimpulan' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRegenerate('kesimpulan')}
                              disabled={isKesimpulanLoading || savingKey === 'kesimpulan'}
                              className="inline-flex items-center gap-1 rounded border border-zinc-500 bg-white/90 px-2.5 py-1.5 text-[11px] font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {kesimpulanQueue.isProcessing ? (
                                <ReloadIcon
                                  className="h-3 w-3 animate-spin text-zinc-950"
                                  aria-hidden="true"
                                />
                              ) : kesimpulanQueue.isQueued ? (
                                <ClockIcon className="h-3 w-3 text-zinc-800" aria-hidden="true" />
                              ) : (
                                <ReaderIcon
                                  className="h-3 w-3 text-zinc-950"
                                  aria-hidden="true"
                                />
                              )}
                              <span>
                                {kesimpulanQueue.isProcessing
                                  ? 'Membuat...'
                                  : kesimpulanQueue.isQueued
                                  ? `Antrean ke-${kesimpulanQueue.queuePos}`
                                  : 'Buat dengan AI'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit('kesimpulan', kesimpulanItem)}
                              disabled={isKesimpulanLoading || savingKey === 'kesimpulan'}
                              className="inline-flex items-center gap-1 rounded border border-zinc-400 bg-white/90 px-2.5 py-1.5 text-[11px] font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Pencil1Icon className="h-3 w-3" aria-hidden="true" />
                              Ubah
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingKey(null)}
                              disabled={savingKey === 'kesimpulan'}
                              className="rounded border border-zinc-400 bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 disabled:opacity-50"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit('kesimpulan')}
                              disabled={savingKey === 'kesimpulan'}
                              className="inline-flex items-center gap-1 rounded bg-zinc-950 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              {savingKey === 'kesimpulan' ? (
                                <ReloadIcon className="h-3 w-3 animate-spin" aria-hidden="true" />
                              ) : (
                                <CheckIcon className="h-3 w-3" aria-hidden="true" />
                              )}
                              {savingKey === 'kesimpulan' ? 'Menyimpan...' : 'Simpan'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingKey !== 'kesimpulan' ? (
                      isKesimpulanLoading ? (
                        <div className="space-y-3 py-2" aria-busy="true">
                          <div className="flex items-center gap-2 text-xs font-medium text-zinc-900">
                            {kesimpulanQueue.isProcessing ? (
                              <ReloadIcon
                                className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-950"
                                aria-hidden="true"
                              />
                            ) : (
                              <ClockIcon
                                className="h-3.5 w-3.5 shrink-0 text-zinc-800"
                                aria-hidden="true"
                              />
                            )}
                            <span>
                              {kesimpulanQueue.isProcessing
                                ? 'AI sedang menyusun rekomendasi...'
                                : kesimpulanQueue.isRetrying
                                ? `AI sedang sibuk, mencoba lagi (${kesimpulanQueue.job?.attempts}/${kesimpulanQueue.job?.maxAttempts})...`
                                : `Menunggu giliran (ke-${kesimpulanQueue.queuePos}) untuk menyusun rekomendasi...`}
                            </span>
                          </div>
                          <div className="space-y-2.5">
                            <div className="h-3 w-11/12 rounded bg-zinc-900/15" />
                            <div className="h-3 w-full rounded bg-zinc-900/15" />
                            <div className="h-3 w-5/6 rounded bg-zinc-900/15" />
                            <div className="mt-3 h-3 w-10/12 rounded bg-zinc-900/15" />
                            <div className="h-3 w-4/5 rounded bg-zinc-900/15" />
                          </div>
                        </div>
                      ) : rekomendasiList.length > 0 ? (
                        <ol className="list-decimal space-y-4 pl-5 text-xs leading-relaxed text-slate-900 sm:text-[13px]">
                          {rekomendasiList.map((rek, idx) => (
                            <li key={idx}>{renderFormattedText(rek)}</li>
                          ))}
                        </ol>
                      ) : (
                        <div className="no-print space-y-3 py-6 text-center">
                          <p className="text-xs font-normal leading-relaxed text-slate-800">
                            Rekomendasi belum dibuat. Buat dengan AI supaya disusun dari data peserta.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleRegenerate('kesimpulan')}
                            disabled={isKesimpulanLoading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                          >
                            <ReaderIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            Buat Rekomendasi dengan AI
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="kesimpulan-poin3"
                            className="mb-1 block text-[11px] font-medium text-slate-800"
                          >
                            Rekomendasi 1:
                          </label>
                          <textarea
                            id="kesimpulan-poin3"
                            rows={3}
                            value={editForm.poin3}
                            onChange={(e) => setEditForm({ ...editForm, poin3: e.target.value })}
                            className="w-full rounded border border-zinc-500 bg-white p-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="kesimpulan-poin4"
                            className="mb-1 block text-[11px] font-medium text-slate-800"
                          >
                            Rekomendasi 2 dan 3 (satu poin satu baris):
                          </label>
                          <textarea
                            id="kesimpulan-poin4"
                            rows={5}
                            value={editForm.poin4}
                            onChange={(e) => setEditForm({ ...editForm, poin4: e.target.value })}
                            placeholder="Tulis satu rekomendasi per baris..."
                            className="w-full rounded border border-zinc-500 bg-white p-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-slate-500/25 pt-2 text-right text-[10px] font-normal text-slate-700">
                    BPSDM Provinsi Jawa Barat · 2025
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
