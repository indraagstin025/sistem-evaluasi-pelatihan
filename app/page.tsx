'use client';

import React, { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import StatCards from '@/components/dashboard/StatCards';
import WarningBanner from '@/components/dashboard/WarningBanner';
import ChartEksposeOverview from '@/components/dashboard/ChartEksposeOverview';
import BottomCards from '@/components/dashboard/BottomCards';
import ImportExcelModal from '@/components/ImportExcelModal';
import {
  Upload,
  Database,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ekspose', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetData = async () => {
    if (!confirm('Hapus semua data?\n\nSeluruh data peserta, survei, dan wawancara akan ikut terhapus.')) {
      return;
    }
    try {
      setActionLoading(true);
      setActionMessage(null);
      const res = await fetch('/api/peserta', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setActionMessage('Semua data sudah dihapus.');
        fetchData();
      } else {
        alert(json.error || 'Gagal menghapus data');
      }
    } catch (err) {
      console.error(err);
      alert('Koneksi bermasalah, silakan coba lagi.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header & Dropdown Dataset */}
      <Topbar
        title="Dashboard"
        subtitle="Ringkasan hasil evaluasi pasca pelatihan PKP Angkatan VII 2023"
      />

      {/* Action Bar: Kartu Aksi Cepat Impor & Manajemen Data */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sumber data</h2>
            <p className="text-sm font-black text-slate-800">
              {loading && !data
                ? 'Memuat data...'
                : data?.ringkasan?.totalPeserta === 0
                ? 'Belum ada data (siap diimpor)'
                : `${data?.ringkasan?.totalPeserta || 0} peserta terdaftar`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetData}
            disabled={actionLoading}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Hapus semua data"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Semua Data
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Impor File Excel
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {actionMessage}
        </div>
      )}

      {loading && !data ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="h-32 rounded-2xl bg-white border border-slate-200/80 p-5">
                <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
                <div className="h-7 w-16 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
          <div className="h-14 rounded-2xl bg-white border border-slate-200/80" />
          <div className="h-64 rounded-2xl bg-white border border-slate-200/80" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="h-52 rounded-2xl bg-white border border-slate-200/80" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 2. Empat Kartu KPI Utama */}
          <StatCards ringkasan={data?.ringkasan} />

          {/* 3. Banner Peringatan Data Kosong */}
          <WarningBanner
            daftarKosong={data?.ringkasan?.daftarKosong}
            totalPeserta={data?.ringkasan?.totalPeserta ?? 0}
          />

          {/* 4. Kartu Ringkasan Grafik Ekspose (5 Kolom) */}
          <ChartEksposeOverview peserta={data?.peserta} />

          {/* 5. Tiga Kartu Bagian Bawah (Status Data, Rekap Nilai, Selisih) */}
          <BottomCards ringkasan={data?.ringkasan} />
        </>
      )}

      {/* Modal Dialog Impor Excel Fleksibel */}
      <ImportExcelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
