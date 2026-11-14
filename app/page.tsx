'use client';

import React, { useEffect, useState } from 'react';
import {
  FileTextIcon,
  TrashIcon,
  UploadIcon,
} from '@radix-ui/react-icons';
import Topbar from '@/components/Topbar';
import StatCards from '@/components/dashboard/StatCards';
import WarningBanner from '@/components/dashboard/WarningBanner';
import ChartEksposeOverview from '@/components/dashboard/ChartEksposeOverview';
import BottomCards from '@/components/dashboard/BottomCards';
import ImportExcelModal from '@/components/ImportExcelModal';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { StatusBanner } from '@/components/ui/status-banner';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    tone: 'success' | 'error';
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch('/api/ekspose', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFetchError(json.error || 'Gagal memuat ringkasan data dashboard.');
        return;
      }
      setData(json);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setFetchError('Koneksi bermasalah saat memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmResetData = async () => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await fetch('/api/peserta', { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        setResetConfirmOpen(false);
        setFeedback({ text: 'Semua data peserta berhasil dihapus.', tone: 'success' });
        await fetchData();
      } else {
        setResetConfirmOpen(false);
        setFeedback({ text: json.error || 'Gagal menghapus data.', tone: 'error' });
      }
    } catch (err) {
      console.error(err);
      setResetConfirmOpen(false);
      setFeedback({ text: 'Koneksi bermasalah, silakan coba lagi.', tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Topbar
        title="Dashboard"
        subtitle="Ringkasan hasil evaluasi pasca pelatihan PKP Angkatan VII 2023"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            disabled={actionLoading || (data?.ringkasan?.totalPeserta ?? 0) === 0}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3.5 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Hapus Semua Data
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
          >
            <UploadIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Impor File Excel
          </button>
        </div>
      </Topbar>

      {/* Active Dataset Bar */}
      <div className="flex flex-col justify-between gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <FileTextIcon className="h-4 w-4 shrink-0 text-zinc-800" aria-hidden="true" />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-xs font-normal text-zinc-600">Sumber data aktif:</span>
            <span className="text-xs font-semibold text-zinc-950">
              {loading && !data
                ? 'Memuat data...'
                : data?.ringkasan?.totalPeserta === 0
                ? 'Belum ada data (siap diimpor)'
                : `${data?.ringkasan?.totalPeserta || 0} peserta terdaftar`}
            </span>
          </div>
        </div>
        <p className="text-xs font-normal text-zinc-600">
          Instrumen Survei Alumni &amp; Wawancara Evaluator
        </p>
      </div>

      {feedback && (
        <StatusBanner
          tone={feedback.tone}
          message={feedback.text}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {fetchError && (
        <StatusBanner
          tone="error"
          title="Gagal memuat dashboard"
          message={fetchError}
          onRetry={fetchData}
        />
      )}

      {loading && !data ? (
        <div className="space-y-6" aria-busy="true">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="h-48 rounded-2xl bg-zinc-900/90 p-6 lg:col-span-5" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="h-48 rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="mb-3 h-3 w-24 rounded bg-zinc-200" />
                  <div className="h-8 w-16 rounded bg-zinc-200" />
                </div>
              ))}
            </div>
          </div>
          <div className="h-14 rounded-2xl border border-zinc-200 bg-white" />
          <div className="h-64 rounded-2xl border border-zinc-200 bg-white" />
        </div>
      ) : !fetchError ? (
        <>
          <StatCards ringkasan={data?.ringkasan} />

          <WarningBanner
            daftarKosong={data?.ringkasan?.daftarKosong}
            totalPeserta={data?.ringkasan?.totalPeserta ?? 0}
          />

          <ChartEksposeOverview peserta={data?.peserta} />

          <BottomCards ringkasan={data?.ringkasan} />
        </>
      ) : null}

      <ImportExcelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />

      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Hapus semua data peserta?"
        description="Seluruh data peserta, skor survei alumni, nilai wawancara, dan pembahasan ekspose terkait akan ikut terhapus permanen."
        confirmLabel="Ya, Hapus Semua"
        tone="danger"
        loading={actionLoading}
        onConfirm={handleConfirmResetData}
      />
    </div>
  );
}
