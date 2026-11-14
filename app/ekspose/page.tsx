'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Printer,
  Download,
  RefreshCw,
  Sparkles,
  Edit3,
  Save,
  X,
  CheckCircle2,
  SlidersHorizontal,
  Loader2,
  Clock,
  Ban,
  AlertCircle,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
          // Tampilkan angka tepat di ujung kanan batang horizontal
          ctx.fillText(value.toString(), bar.x + 8, bar.y);
        }
      });
    });
    ctx.restore();
  },
};

// Helper untuk merender teks dengan tag markdown **bold** menjadi elemen <strong>
function renderFormattedText(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
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
  const [activeJobs, setActiveJobs] = useState<AiQueueJob[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [cancellingQueue, setCancellingQueue] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const workerRunningRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // State untuk mode sunting manual per slide (grafik 1-5 atau kesimpulan)
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
        setQueueError(json.error || 'Gagal memproses antrian AI.');
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
        setQueueError('Koneksi terganggu saat memproses antrian AI.');
      }
    } finally {
      workerRunningRef.current = false;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resEkspose, resPembahasan, resQueue] = await Promise.all([
        fetch('/api/ekspose', { cache: 'no-store' }),
        fetch('/api/ai/pembahasan', { cache: 'no-store' }),
        fetch('/api/ai/queue', { cache: 'no-store' }),
      ]);

      const jsonEkspose = await resEkspose.json();
      const jsonPembahasan = await resPembahasan.json();
      const jsonQueue = await resQueue.json();

      if (jsonEkspose.success) setData(jsonEkspose);
      if (jsonPembahasan.success) setPembahasanMap(jsonPembahasan.data);
      if (jsonQueue.success) {
        const jobs: AiQueueJob[] = Array.isArray(jsonQueue.activeJobs) ? jsonQueue.activeJobs : [];
        setActiveJobs(jobs);
        if ((jsonQueue.queuedCount ?? 0) > 0 || (jsonQueue.processingCount ?? 0) > 0) {
          scheduleNextWorkerTick(jsonQueue.nextWaitMs ?? 300);
        }
      }
    } catch (err) {
      console.error('Error fetching ekspose data:', err);
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

      const res = await fetch('/api/ai/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grafikKey }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || 'Gagal memasukkan request AI ke antrian');
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
      alert('Gagal menambahkan antrian generasi AI');
    }
  };

  const handleCancelQueue = async () => {
    try {
      setCancellingQueue(true);
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
      const res = await fetch('/api/ai/pembahasan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grafikKey: key,
          ...editForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPembahasanMap((prev) => ({
          ...prev,
          [key]: json.data,
        }));
        setEditingKey(null);
      } else {
        alert(json.error || 'Gagal menyimpan suntingan');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi saat menyimpan');
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
      <div className="py-28 text-center">
        <RefreshCw className="w-9 h-9 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">Menyiapkan Tampilan Slide Presentasi Resmi Ekspose...</p>
        <p className="text-xs text-slate-400 mt-1">Mengonfigurasi 6 slide 1:1 sesuai berkas paparan resmi BPSDM</p>
      </div>
    );
  }

  const rekap = data?.rekap;
  // Urutan kategori vertikal dari atas ke bawah persis seperti PowerPoint
  const presentationCategories = ['76-100', '51-75', '26-50', '1-25', '0'];

  const getHorizontalChartOptions = (maxVal: number): any => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 36, // Ruang untuk teks angka di ujung batang
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
        display: false, // Bersih tanpa angka sumbu x di bawah, sesuai slide PowerPoint
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

  // 5 Slide Grafik Resmi (Slide 5-9 pada PPT)
  const slideList = [
    {
      key: 'grafik1',
      slideNumber: 'Slide 5',
      slideTitle: 'Perbandingan Capaian Jangka Menengah dengan Jangka Panjang (Hasil wawancara)',
      subtitle: 'Perbandingan capaian jangka menengah dengan jangka panjang (Hasil wawancara)',
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

  // Gabungkan Rekomendasi 1 (poin3) dan poin rekomendasi lanjutan (poin4 dipisah per baris)
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 print:p-0 print:m-0 print:max-w-none">
      {/* Top Application Bar (Hidden on Print) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Format Presentasi Resmi (1:1 Slide PPTX)
            </span>
            <span className="text-xs text-slate-400">• BPSDM Provinsi Jawa Barat</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mt-1 flex items-center gap-2">
            Ekspose Evaluasi Pasca Pelatihan PKP Angkatan VII
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Susunan visual 6 slide presentasi lengkap: 5 grafik batang horizontal dengan kotak pembahasan, diakhiri slide kesimpulan & rekomendasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleRegenerate('all')}
            disabled={isAllQueued || savingKey !== null || totalPeserta === 0}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              activeJobs.length > 0
                ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
                : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
            }`}
            title="Masukkan seluruh slide ke antrian generasi AI secara berurutan"
          >
            {activeJobs.length > 0 ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            )}
            {activeJobs.length > 0
              ? `Antrian AI (${activeJobs.length} aktif)`
              : 'Generate AI Semua Slide'}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={totalPeserta === 0}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Ekspor Rekap CSV
          </button>

          <button
            onClick={handlePrint}
            disabled={totalPeserta === 0}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition shadow-sm shadow-emerald-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Slide (PDF)
          </button>
        </div>
      </header>

      {(activeJobs.length > 0 || queueError) && (
        <div
          role="status"
          aria-live="polite"
          className={`no-print rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border shadow-2xs ${
            queueError
              ? 'bg-rose-50 border-rose-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs ${
                queueError ? 'bg-rose-600' : 'bg-emerald-600'
              }`}
            >
              {queueError ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs sm:text-sm font-bold ${
                  queueError ? 'text-rose-950' : 'text-emerald-950'
                }`}
              >
                {queueError
                  ? queueError
                  : activeProcessingJob
                    ? `AI sedang memproses ${SLIDE_QUEUE_LABELS[activeProcessingJob.grafikKey] || activeProcessingJob.grafikKey}${queuedCount > 0 ? ` • ${queuedCount} slide menunggu di antrian` : ''}`
                    : currentStatusJob?.attempts && currentStatusJob.attempts > 0
                      ? `Rate limit sementara — menjadwalkan retry ${SLIDE_QUEUE_LABELS[currentStatusJob.grafikKey] || currentStatusJob.grafikKey} (percobaan ${currentStatusJob.attempts}/${currentStatusJob.maxAttempts})...`
                      : `Menunggu giliran antrian AI: ${SLIDE_QUEUE_LABELS[currentStatusJob?.grafikKey || ''] || 'slide berikutnya'} (${activeJobs.length} aktif)...`}
              </p>
              {activeJobs.length > 0 && (
                <div className="mt-2 h-1.5 w-full bg-emerald-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(12, Math.round(((6 - Math.min(6, activeJobs.length)) / 6) * 100))}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {queuedCount > 0 && (
            <button
              onClick={handleCancelQueue}
              disabled={cancellingQueue}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              {cancellingQueue ? 'Membatalkan...' : `Batalkan Antrian (${queuedCount})`}
            </button>
          )}
        </div>
      )}

      {totalPeserta === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-base">
              !
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Basis Data Saat Ini Kosong (0 Peserta)
              </p>
              <p className="text-xs text-amber-800/80 mt-1">
                Semua data telah dihapus. Slide ekspose dan pembahasan belum ditampilkan sampai berkas Excel hasil survei/wawancara diimpor.
              </p>
            </div>
          </div>
          <a
            href="/peserta"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-700 hover:bg-amber-800 text-white transition shadow-2xs shrink-0 self-start sm:self-auto text-center"
          >
            Buka Menu Impor Excel
          </a>
        </div>
      ) : (
        <>
          {/* Slide Navigation Pill Quicklinks */}
          <div className="flex flex-wrap items-center gap-2 no-print bg-slate-100/80 p-2 rounded-xl text-xs font-semibold text-slate-600">
            <span className="px-2 py-1 text-slate-400 font-bold text-[11px]">Lompat ke Slide:</span>
            {slideList.map((s, idx) => (
              <a
                key={s.key}
                href={`#${s.key}`}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80 transition shadow-2xs cursor-pointer"
              >
                Slide {idx + 1} ({s.slideNumber})
              </a>
            ))}
            <a
              href="#kesimpulan"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-2xs cursor-pointer font-bold"
            >
              Slide 6 (Kesimpulan & Rekomendasi)
            </a>
          </div>

          {/* Rangkaian 6 Slide Presentasi Resmi */}
          <div className="space-y-12 print:space-y-0">
        {/* SLIDE 1 S.D. 5 (5 GRAFIK PRESENTASI) */}
        {slideList.map((slide, sIdx) => {
          const g = slide.g;
          if (!g) return null;

          const pItem = pembahasanMap[slide.key];
          const isEditing = editingKey === slide.key;
          const slideQueue = getSlideQueueInfo(slide.key);
          const isItemLoading = slideQueue.isActive;
          const isItemSaving = savingKey === slide.key;

          const maxVal = Math.max(...(g.dataA || []), ...(g.dataB || []), 10);

          // Data dibalik agar sesuai dengan urutan kategori presentation: 76-100, 51-75, 26-50, 1-25, 0
          const reversedA = [...g.dataA].reverse(); // Survei / Jangka Menengah
          const reversedB = [...g.dataB].reverse(); // Wawancara / Jangka Panjang

          const chartData = {
            labels: presentationCategories,
            datasets: [
              {
                label: slide.labelOrange,
                data: reversedB,
                backgroundColor: '#ED7D31', // Oranye resmi PPTX
                barPercentage: 0.75,
                categoryPercentage: 0.8,
                borderRadius: 0,
              },
              {
                label: slide.labelBlue,
                data: reversedA,
                backgroundColor: '#4472C4', // Biru resmi PPTX
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
              className="slide-card bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-8 md:p-10 transition space-y-6 relative overflow-hidden"
              style={{ minHeight: '520px' }}
            >
              {/* Header Slide: Judul di Tengah + Logo Pemprov Jabar di Kanan Atas */}
              <div className="relative flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="w-16 hidden sm:block">
                  <span className="no-print text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500">
                    {slide.slideNumber}
                  </span>
                </div>

                <div className="flex-1 text-center px-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    {slide.slideTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-2.5 justify-end">
                  <div className="text-right hidden sm:block leading-none">
                    <p className="text-[10px] font-semibold text-slate-700">Provincial Government</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">of West Java</p>
                  </div>
                  <img
                    src="/logo-jabar.png"
                    alt="Logo Pemprov Jabar"
                    className="h-10 w-auto object-contain"
                  />
                </div>
              </div>

              {/* Isi Slide: 2 Kolom (Kiri: Grafik Batang Horizontal, Kanan: Kotak Pembahasan Biru Muda) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
                {/* Kolom Kiri (~54%): Horizontal Bar Chart */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-slate-600">
                      {slide.subtitle}
                    </p>
                  </div>

                  <div className="relative w-full h-[290px] sm:h-[310px]">
                    <Bar
                      data={chartData}
                      options={getHorizontalChartOptions(maxVal)}
                      plugins={[horizontalBarLabelPlugin]}
                    />
                  </div>

                  {/* Tabel Rekapitulasi Angka Per Rentang (UR-F-05) */}
                  <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200/90 bg-slate-50/40">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-1.5 px-2.5 text-left">Instrumen / Sumber</th>
                          {presentationCategories.map((kat) => (
                            <th key={kat} className="py-1.5 px-2 text-center font-mono">
                              {kat}
                            </th>
                          ))}
                          <th className="py-1.5 px-2.5 text-center font-mono bg-slate-200/60 text-slate-900">
                            Total (N)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 bg-white">
                        <tr>
                          <td className="py-1.5 px-2.5 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-xs bg-[#ED7D31] shrink-0" />
                              <span>{g.labelB}</span>
                            </div>
                          </td>
                          {reversedB.map((val, cIdx) => (
                            <td key={cIdx} className="py-1.5 px-2 text-center font-mono text-slate-700">
                              {val}
                            </td>
                          ))}
                          <td className="py-1.5 px-2.5 text-center font-mono font-bold text-slate-900 bg-slate-50">
                            {g.totalB}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-2.5 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-xs bg-[#4472C4] shrink-0" />
                              <span>{g.labelA}</span>
                            </div>
                          </td>
                          {reversedA.map((val, cIdx) => (
                            <td key={cIdx} className="py-1.5 px-2 text-center font-mono text-slate-700">
                              {val}
                            </td>
                          ))}
                          <td className="py-1.5 px-2.5 text-center font-mono font-bold text-slate-900 bg-slate-50">
                            {g.totalA}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Kolom Kanan (~46%): Kotak Pembahasan Biru Muda (#D9E1F2) */}
                <div className="lg:col-span-5 flex flex-col">
                  <div className="bg-[#D9E1F2] rounded-lg p-5 sm:p-6 flex-1 flex flex-col justify-between shadow-2xs border border-[#C5D1E8]">
                    <div>
                      {/* Judul Kotak Pembahasan Bergaris Bawah */}
                      <div className="flex items-center justify-between mb-3 border-b border-slate-400/30 pb-2">
                        <div className="w-full text-center">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 underline decoration-1 underline-offset-4 tracking-wide">
                            Pembahasan
                          </h3>
                        </div>

                        {/* Tombol Aksi Mini (Sunting / AI) */}
                        <div className="flex items-center gap-1 no-print absolute right-8 top-auto">
                          {!isEditing ? (
                            <>
                              <button
                                onClick={() => handleRegenerate(slide.key)}
                                disabled={isItemLoading || isItemSaving}
                                title={
                                  slideQueue.isProcessing
                                    ? 'Sedang diproses AI...'
                                    : slideQueue.isQueued
                                      ? `Menunggu antrian (#${slideQueue.queuePos})`
                                      : 'Refresh narasi AI'
                                }
                                className="p-1 rounded bg-white/70 hover:bg-white text-slate-700 border border-slate-300 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {slideQueue.isProcessing ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                                ) : slideQueue.isQueued ? (
                                  <Clock className="w-3 h-3 text-amber-600" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                onClick={() => handleStartEdit(slide.key, pItem)}
                                disabled={isItemLoading || isItemSaving}
                                title="Sunting teks pembahasan"
                                className="p-1 rounded bg-white/70 hover:bg-white text-slate-700 border border-slate-300 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingKey(null)}
                                disabled={isItemSaving}
                                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white text-slate-600 border border-slate-300 disabled:opacity-50 cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => handleSaveEdit(slide.key)}
                                disabled={isItemSaving}
                                className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-600 text-white flex items-center gap-0.5 disabled:opacity-60 cursor-pointer"
                              >
                                {isItemSaving ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Save className="w-2.5 h-2.5" />
                                )}
                                {isItemSaving ? 'Menyimpan...' : 'Simpan'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Teks Butir-Butir Pembahasan */}
                      {!isEditing ? (
                        isItemLoading ? (
                          <div className="space-y-3 py-2" aria-busy="true">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                              {slideQueue.isProcessing ? (
                                <Sparkles className="w-3.5 h-3.5 text-emerald-700 animate-spin shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              )}
                              <span>
                                {slideQueue.isProcessing
                                  ? 'AI sedang menganalisis data slide ini...'
                                  : slideQueue.isRetrying
                                    ? `Rate limit sementara — menjadwalkan retry (${slideQueue.job?.attempts}/${slideQueue.job?.maxAttempts})...`
                                    : `Menunggu antrian (#${slideQueue.queuePos}) untuk diproses AI...`}
                              </span>
                            </div>
                            <div className="space-y-2.5 animate-pulse">
                              <div className="h-3 bg-slate-500/20 rounded w-11/12" />
                              <div className="h-3 bg-slate-500/20 rounded w-full" />
                              <div className="h-3 bg-slate-500/20 rounded w-5/6" />
                              <div className="h-3 bg-slate-500/20 rounded w-10/12 mt-3" />
                              <div className="h-3 bg-slate-500/20 rounded w-3/4" />
                            </div>
                          </div>
                        ) : pItem?.poin1 || pItem?.poin2 || pItem?.poin3 || pItem?.poin4 ? (
                          <div className="space-y-3 text-xs sm:text-[13px] text-slate-900 leading-relaxed font-sans">
                            <ul className="list-disc pl-4 space-y-2.5">
                              {pItem?.poin1 && <li>{renderFormattedText(pItem.poin1)}</li>}
                              {pItem?.poin2 && <li>{renderFormattedText(pItem.poin2)}</li>}
                              {pItem?.poin3 && <li>{renderFormattedText(pItem.poin3)}</li>}
                              {pItem?.poin4 && <li>{renderFormattedText(pItem.poin4)}</li>}
                            </ul>
                          </div>
                        ) : (
                          <div className="py-6 text-center space-y-2.5 no-print">
                            <p className="text-xs text-slate-600">
                              Pembahasan AI belum dibuat untuk slide ini.
                            </p>
                            <button
                              onClick={() => handleRegenerate(slide.key)}
                              disabled={isItemLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              Generate Pembahasan AI
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="space-y-2.5 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Poin 1:</label>
                            <textarea
                              rows={2}
                              value={editForm.poin1}
                              onChange={(e) => setEditForm({ ...editForm, poin1: e.target.value })}
                              className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Poin 2:</label>
                            <textarea
                              rows={2}
                              value={editForm.poin2}
                              onChange={(e) => setEditForm({ ...editForm, poin2: e.target.value })}
                              className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Poin 3:</label>
                            <textarea
                              rows={2}
                              value={editForm.poin3}
                              onChange={(e) => setEditForm({ ...editForm, poin3: e.target.value })}
                              className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Poin 4:</label>
                            <textarea
                              rows={2}
                              value={editForm.poin4}
                              onChange={(e) => setEditForm({ ...editForm, poin4: e.target.value })}
                              className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-400/20 flex items-center justify-between text-[10px] text-slate-500">
                      <span>
                        Sumber:{' '}
                        {pItem?.sumber === 'ai'
                          ? 'Model AI (Gemini)'
                          : pItem?.sumber === 'manual'
                          ? 'Disunting Manual'
                          : 'Templat Baku (Slide PPT)'}
                      </span>
                      <span className="font-semibold text-emerald-800">BPSDM Jabar</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* SLIDE 6 (SLIDE 10 PADA UPLOAD: KESIMPULAN DAN REKOMENDASI) */}
        <section
          id="kesimpulan"
          className="slide-card bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-8 md:p-10 transition space-y-6 relative overflow-hidden"
          style={{ minHeight: '520px' }}
        >
          {/* Header Slide: Judul di Tengah + Logo Pemprov Jabar */}
          <div className="relative flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="w-16 hidden sm:block">
              <span className="no-print text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500">
                Slide 10
              </span>
            </div>

            <div className="flex-1 text-center px-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                Kesimpulan dan Rekomendasi
              </h2>
            </div>

            <div className="flex items-center gap-2.5 justify-end">
              <div className="text-right hidden sm:block leading-none">
                <p className="text-[10px] font-semibold text-slate-700">Provincial Government</p>
                <p className="text-[9px] text-slate-500 mt-0.5">of West Java</p>
              </div>
              <img
                src="/logo-jabar.png"
                alt="Logo Pemprov Jabar"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>

          {/* Isi Slide 6: Dua Kolom Berdampingan (Kiri: Peach Pembahasan, Kanan: Hijau Muda Rekomendasi) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch pt-2">
            {/* Kolom Kiri: Kotak Peach (#FCE4D6) - Pembahasan */}
            <div className="bg-[#FCE4D6] rounded-lg p-6 flex flex-col justify-between border border-[#F4CCA4] shadow-2xs">
              <div>
                <div className="text-center mb-4">
                  <h3 className="text-base font-bold text-slate-900 underline decoration-1 underline-offset-4 tracking-wide">
                    Pembahasan
                  </h3>
                </div>

                {editingKey !== 'kesimpulan' ? (
                  isKesimpulanLoading ? (
                    <div className="space-y-3 py-2" aria-busy="true">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        {kesimpulanQueue.isProcessing ? (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-700 animate-spin shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>
                          {kesimpulanQueue.isProcessing
                            ? 'AI sedang menyusun pembahasan kesimpulan...'
                            : kesimpulanQueue.isRetrying
                              ? `Rate limit sementara — menjadwalkan retry (${kesimpulanQueue.job?.attempts}/${kesimpulanQueue.job?.maxAttempts})...`
                              : `Menunggu antrian (#${kesimpulanQueue.queuePos}) untuk menyusun kesimpulan...`}
                        </span>
                      </div>
                      <div className="space-y-2.5 animate-pulse">
                        <div className="h-3 bg-amber-900/15 rounded w-11/12" />
                        <div className="h-3 bg-amber-900/15 rounded w-full" />
                        <div className="h-3 bg-amber-900/15 rounded w-4/5" />
                        <div className="h-3 bg-amber-900/15 rounded w-10/12 mt-3" />
                        <div className="h-3 bg-amber-900/15 rounded w-3/4" />
                      </div>
                    </div>
                  ) : kesimpulanPembahasanList.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-4 text-xs sm:text-[13px] text-slate-900 leading-relaxed font-sans">
                      {kesimpulanPembahasanList.map((poin, idx) => (
                        <li key={idx}>{renderFormattedText(poin)}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-600 no-print">
                      Pembahasan kesimpulan belum dibuat. Klik <strong>Generate AI</strong> untuk menyusun otomatis dari data.
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Paragraf 1 (Pembahasan Capaian):</label>
                      <textarea
                        rows={6}
                        value={editForm.poin1}
                        onChange={(e) => setEditForm({ ...editForm, poin1: e.target.value })}
                        className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Paragraf 2 (Pengaruh Mutasi/Rotasi):</label>
                      <textarea
                        rows={3}
                        value={editForm.poin2}
                        onChange={(e) => setEditForm({ ...editForm, poin2: e.target.value })}
                        className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2 border-t border-slate-400/20 text-[10px] text-slate-500 text-right">
                Evaluasi Pasca Pelatihan • PKP Angkatan VII
              </div>
            </div>

            {/* Kolom Kanan: Kotak Hijau Muda (#E2EFDA) - Rekomendasi */}
            <div className="bg-[#E2EFDA] rounded-lg p-6 flex flex-col justify-between border border-[#C5E0B4] shadow-2xs">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="sm:flex-1 text-left sm:text-center">
                    <h3 className="text-base font-bold text-slate-900 underline decoration-1 underline-offset-4 tracking-wide">
                      Rekomendasi
                    </h3>
                  </div>

                  {/* Tombol AI & Sunting Slide 6 */}
                  <div className="no-print shrink-0">
                    {editingKey !== 'kesimpulan' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRegenerate('kesimpulan')}
                          disabled={isKesimpulanLoading || savingKey === 'kesimpulan'}
                          title="Generate kesimpulan & rekomendasi menggunakan AI"
                          className="px-2 py-1.5 rounded bg-white/80 hover:bg-white text-emerald-800 border border-emerald-300 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {kesimpulanQueue.isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                          ) : kesimpulanQueue.isQueued ? (
                            <Clock className="w-3 h-3 text-amber-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                          )}
                          {kesimpulanQueue.isProcessing
                            ? 'Generating...'
                            : kesimpulanQueue.isQueued
                              ? `Antri #${kesimpulanQueue.queuePos}`
                              : 'Generate AI'}
                        </button>
                        <button
                          onClick={() => handleStartEdit('kesimpulan', kesimpulanItem)}
                          disabled={isKesimpulanLoading || savingKey === 'kesimpulan'}
                          className="p-1.5 rounded bg-white/70 hover:bg-white text-slate-700 border border-slate-300 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit3 className="w-3 h-3" />
                          Sunting
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingKey(null)}
                          disabled={savingKey === 'kesimpulan'}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-white text-slate-600 border border-slate-300 disabled:opacity-50 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveEdit('kesimpulan')}
                          disabled={savingKey === 'kesimpulan'}
                          className="px-3 py-1 text-xs font-bold rounded bg-emerald-600 text-white flex items-center gap-1 disabled:opacity-60 cursor-pointer"
                        >
                          {savingKey === 'kesimpulan' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3" />
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
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        {kesimpulanQueue.isProcessing ? (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-700 animate-spin shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>
                          {kesimpulanQueue.isProcessing
                            ? 'AI sedang menyusun rekomendasi strategis...'
                            : kesimpulanQueue.isRetrying
                              ? `Rate limit sementara — menjadwalkan retry (${kesimpulanQueue.job?.attempts}/${kesimpulanQueue.job?.maxAttempts})...`
                              : `Menunggu antrian (#${kesimpulanQueue.queuePos}) untuk menyusun rekomendasi...`}
                        </span>
                      </div>
                      <div className="space-y-2.5 animate-pulse">
                        <div className="h-3 bg-emerald-900/15 rounded w-11/12" />
                        <div className="h-3 bg-emerald-900/15 rounded w-full" />
                        <div className="h-3 bg-emerald-900/15 rounded w-5/6" />
                        <div className="h-3 bg-emerald-900/15 rounded w-10/12 mt-3" />
                        <div className="h-3 bg-emerald-900/15 rounded w-4/5" />
                      </div>
                    </div>
                  ) : rekomendasiList.length > 0 ? (
                    <ol className="list-decimal pl-5 space-y-4 text-xs sm:text-[13px] text-slate-900 leading-relaxed font-sans">
                      {rekomendasiList.map((rek, idx) => (
                        <li key={idx}>{renderFormattedText(rek)}</li>
                      ))}
                    </ol>
                  ) : (
                    <div className="py-6 text-center space-y-3 no-print">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Rekomendasi belum dihasilkan oleh AI. Silakan generate agar AI menyusun rekomendasi berdasarkan data peserta aktual.
                      </p>
                      <button
                        onClick={() => handleRegenerate('kesimpulan')}
                        disabled={isKesimpulanLoading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Rekomendasi AI
                      </button>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Rekomendasi 1:</label>
                      <textarea
                        rows={3}
                        value={editForm.poin3}
                        onChange={(e) => setEditForm({ ...editForm, poin3: e.target.value })}
                        className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">
                        Rekomendasi 2 &amp; 3 (pisahkan tiap poin dengan baris baru):
                      </label>
                      <textarea
                        rows={5}
                        value={editForm.poin4}
                        onChange={(e) => setEditForm({ ...editForm, poin4: e.target.value })}
                        placeholder="Tuliskan poin rekomendasi berikutnya pada tiap baris..."
                        className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2 border-t border-slate-400/20 text-[10px] text-slate-500 text-right">
                BPSDM Provinsi Jawa Barat • 2025
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
