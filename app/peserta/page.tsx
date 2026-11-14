'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircledIcon,
  DownloadIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
  PersonIcon,
  PlusIcon,
  ReloadIcon,
  TrashIcon,
  UploadIcon,
} from '@radix-ui/react-icons';
import * as XLSX from 'xlsx';
import Topbar from '@/components/Topbar';
import ImportExcelModal from '@/components/ImportExcelModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBanner } from '@/components/ui/status-banner';

interface PesertaData {
  id: string;
  nama: string;
  nip?: string | null;
  jabatanSaatIni?: string | null;
  instansi?: string | null;
  L: number | null;
  M: number | null;
  totalForm: number | null;
  selisih: number | null;
  isWawancaraKosong: boolean;
}

export default function DataPesertaPage() {
  const [pesertaList, setPesertaList] = useState<PesertaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'valid' | 'empty'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [pesertaToDelete, setPesertaToDelete] = useState<PesertaData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [addForm, setAddForm] = useState({
    nama: '',
    nip: '',
    jabatanPelatihan: '',
    jabatanSaatIni: '',
    instansi: '',
  });

  const fetchPeserta = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch('/api/ekspose', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success || !json.peserta) {
        setFetchError(json.error || 'Gagal memuat daftar peserta.');
        return;
      }
      setPesertaList(json.peserta);
    } catch (err) {
      console.error('Error fetching peserta:', err);
      setFetchError('Koneksi bermasalah saat memuat daftar peserta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeserta();
  }, []);

  const handleAddPeserta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.nama.trim()) return;

    try {
      setIsSubmittingAdd(true);
      setFeedback(null);
      const res = await fetch('/api/peserta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({
          text: `Peserta "${addForm.nama.trim()}" sudah ditambahkan. Nilainya masih KOSONG.`,
          tone: 'success',
        });
        setAddForm({
          nama: '',
          nip: '',
          jabatanPelatihan: '',
          jabatanSaatIni: '',
          instansi: '',
        });
        setIsAddModalOpen(false);
        fetchPeserta();
      } else {
        setFeedback({
          text: json.error || 'Gagal menambahkan peserta. Coba lagi.',
          tone: 'error',
        });
      }
    } catch (err) {
      console.error('Error adding peserta:', err);
      setFeedback({
        text: 'Koneksi bermasalah saat menambah peserta. Coba lagi.',
        tone: 'error',
      });
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pesertaToDelete) return;
    const target = pesertaToDelete;
    try {
      setDeletingId(target.id);
      setFeedback(null);
      const res = await fetch(`/api/peserta/${target.id}`, { method: 'DELETE' });
      const json = await res.json();
      setPesertaToDelete(null);
      if (res.ok && json.success) {
        setFeedback({ text: `Peserta "${target.nama}" sudah dihapus.`, tone: 'success' });
        fetchPeserta();
      } else {
        setFeedback({
          text: json.error || 'Gagal menghapus peserta. Coba lagi.',
          tone: 'error',
        });
      }
    } catch (err) {
      console.error('Error deleting peserta:', err);
      setPesertaToDelete(null);
      setFeedback({
        text: 'Koneksi bermasalah saat menghapus peserta. Coba lagi.',
        tone: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPeserta = pesertaList.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      p.nama.toLowerCase().includes(q) ||
      (p.nip && p.nip.toLowerCase().includes(q)) ||
      (p.instansi && p.instansi.toLowerCase().includes(q)) ||
      (p.jabatanSaatIni && p.jabatanSaatIni.toLowerCase().includes(q));

    if (!matchSearch) return false;
    if (activeFilter === 'valid') return !p.isWawancaraKosong;
    if (activeFilter === 'empty') return p.isWawancaraKosong;
    return true;
  });

  const totalAll = pesertaList.length;
  const totalValid = pesertaList.filter((p) => !p.isWawancaraKosong).length;
  const totalEmpty = pesertaList.filter((p) => p.isWawancaraKosong).length;

  const handleDownloadTemplate = () => {
    const headers = [
      'nama',
      'nip',
      'jabatanSaatIni',
      'instansi',
      'survei_jangka_panjang',
      'survei_seluruh_tujuan',
      'survei_manfaat',
      'wawancara_jangka_menengah',
      'wawancara_jangka_panjang',
      'wawancara_seluruh_tujuan',
      'wawancara_manfaat',
      'wawancara_teknik_komunikasi',
    ];

    const sampleRow = [
      'Nama Peserta Contoh',
      '198001012010011001',
      'Kepala Sub Bagian Umum',
      'Dinas Perhubungan',
      3,
      3,
      3,
      90,
      85,
      90,
      95,
      88,
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Evaluasi_Pasca_Pelatihan.xlsx');
  };

  const handleExportCSV = () => {
    if (pesertaList.length === 0) return;
    const headers = [
      'No',
      'Nama Peserta',
      'NIP',
      'Jabatan Saat Ini',
      'Instansi',
      'Nilai L (Survei)',
      'Nilai M (Wawancara)',
      'Total Form',
      'Selisih (M-L)',
      'Status Wawancara',
    ];

    const rows = filteredPeserta.map((p, idx) => [
      idx + 1,
      `"${p.nama}"`,
      p.nip || '-',
      `"${p.jabatanSaatIni || '-'}"`,
      `"${p.instansi || '-'}"`,
      p.L !== null ? p.L.toFixed(2) : 'KOSONG',
      p.M !== null ? p.M.toFixed(2) : 'KOSONG',
      p.totalForm !== null ? p.totalForm.toFixed(2) : 'KOSONG',
      p.selisih !== null ? p.selisih.toFixed(2) : 'KOSONG',
      p.isWawancaraKosong ? 'KOSONG' : 'Lengkap',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_Peserta_Evaluasi_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-12">
      <Topbar
        title="Daftar Peserta"
        subtitle={`${totalAll} peserta pelatihan PKP Angkatan VII 2023, Kabupaten Bogor`}
      />

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3.5 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
          >
            <DownloadIcon className="h-3.5 w-3.5 text-zinc-700" aria-hidden="true" />
            Template Excel
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={pesertaList.length === 0}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3.5 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon className="h-3.5 w-3.5 text-zinc-700" aria-hidden="true" />
            Unduh CSV
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3.5 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
          >
            <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Tambah Peserta
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
          >
            <UploadIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Impor File Excel
          </button>
        </div>
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
          title="Gagal memuat data peserta"
          message={fetchError}
          onRetry={fetchPeserta}
        />
      )}

      {/* Search & Radix Tabs Filter */}
      <div className="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
        <div className="relative max-w-md flex-1">
          <label htmlFor="search-peserta" className="sr-only">
            Cari nama, NIP, atau instansi peserta
          </label>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
            aria-hidden="true"
          />
          <input
            id="search-peserta"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIP, atau instansi..."
            className="min-h-[40px] w-full rounded-xl border border-zinc-500 bg-white py-2 pl-9 pr-4 text-xs font-normal text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus:outline-none"
          />
        </div>

        <Tabs
          value={activeFilter}
          onValueChange={(v) => setActiveFilter(v as 'all' | 'valid' | 'empty')}
        >
          <TabsList aria-label="Filter kelengkapan nilai peserta">
            <TabsTrigger value="all">Semua ({totalAll})</TabsTrigger>
            <TabsTrigger value="valid">Lengkap ({totalValid})</TabsTrigger>
            <TabsTrigger value="empty">Perlu Input Nilai ({totalEmpty})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {loading ? (
          <div className="py-24 text-center" aria-busy="true">
            <ReloadIcon className="mx-auto mb-3 h-6 w-6 animate-spin text-zinc-950" aria-hidden="true" />
            <p className="text-xs font-medium text-zinc-600">Memuat daftar peserta...</p>
          </div>
        ) : filteredPeserta.length === 0 ? (
          <div className="px-4 py-20 text-center">
            <PersonIcon className="mx-auto mb-2.5 h-8 w-8 text-zinc-600" aria-hidden="true" />
            <p className="text-sm font-medium text-zinc-950">Tidak ada peserta yang cocok.</p>
            <p className="mt-1 text-xs font-normal text-zinc-600">
              Ubah kata kunci pencarian atau pilih filter status lainnya.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100 text-xs font-medium text-zinc-700">
                  <th className="w-10 px-2.5 py-3 text-center">No</th>
                  <th className="px-3 py-3">Nama Peserta & NIP</th>
                  <th className="px-3 py-3">Instansi / Unit Kerja</th>
                  <th className="whitespace-nowrap px-2.5 py-3 text-center">Nilai L</th>
                  <th className="whitespace-nowrap px-2.5 py-3 text-center">Nilai M</th>
                  <th className="whitespace-nowrap px-2.5 py-3 text-center">Total Form</th>
                  <th className="whitespace-nowrap px-2.5 py-3 text-center">Selisih (M - L)</th>
                  <th className="whitespace-nowrap px-2.5 py-3 text-center">Status</th>
                  <th className="whitespace-nowrap px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 text-xs">
                {filteredPeserta.map((p, idx) => {
                  const isKosong = p.isWawancaraKosong;
                  const rowNo = String(idx + 1).padStart(2, '0');

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isKosong
                          ? 'bg-zinc-50 hover:bg-zinc-100'
                          : 'hover:bg-zinc-50'
                      }`}
                    >
                      <td className="px-2.5 py-3 text-center font-mono text-xs font-normal text-zinc-600 tabular-nums">
                        {rowNo}
                      </td>

                      <td className="max-w-[195px] px-3 py-3">
                        <div className="font-medium text-zinc-950">{p.nama}</div>
                        <div className="mt-0.5 font-mono text-[11px] font-normal text-zinc-600">
                          {p.nip ? `NIP. ${p.nip}` : 'NIP belum tercatat'}
                        </div>
                      </td>

                      <td className="max-w-[185px] px-3 py-3">
                        <div className="font-normal text-zinc-800">{p.instansi || '-'}</div>
                        {p.jabatanSaatIni && (
                          <div className="truncate text-[11px] font-normal text-zinc-600">
                            {p.jabatanSaatIni}
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-3 text-center font-mono font-normal text-zinc-800 tabular-nums">
                        {p.L !== null ? p.L.toFixed(2) : '-'}
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-3 text-center">
                        {isKosong ? (
                          <span className="inline-block rounded border border-zinc-900 bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-950">
                            KOSONG
                          </span>
                        ) : (
                          <span className="font-mono font-normal text-zinc-800 tabular-nums">
                            {p.M !== null ? p.M.toFixed(2) : '-'}
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-3 text-center">
                        {isKosong ? (
                          <span className="inline-block rounded border border-zinc-900 bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-950">
                            KOSONG
                          </span>
                        ) : (
                          <span className="font-mono font-medium text-zinc-950 tabular-nums">
                            {p.totalForm !== null ? p.totalForm.toFixed(2) : '-'}
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-3 text-center font-mono font-medium tabular-nums">
                        {isKosong ? (
                          <span className="text-zinc-600">-</span>
                        ) : p.selisih !== null ? (
                          <span
                            className={
                              p.selisih > 0
                                ? 'font-semibold text-zinc-950'
                                : p.selisih < 0
                                ? 'font-medium text-zinc-600'
                                : 'text-zinc-700'
                            }
                          >
                            {p.selisih > 0 ? `+${p.selisih.toFixed(2)}` : p.selisih.toFixed(2)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="whitespace-nowrap px-2.5 py-3 text-center">
                        {isKosong ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-950 px-2.5 py-0.5 text-[11px] font-medium text-white">
                            <ExclamationTriangleIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                            Perlu Input Nilai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2.5 py-0.5 text-[11px] font-medium text-zinc-900">
                            <CheckCircledIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                            Lengkap
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/peserta/${p.id}`}
                            prefetch={false}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                              isKosong
                                ? 'bg-zinc-950 text-white hover:bg-zinc-800'
                                : 'border border-zinc-500 bg-white text-zinc-950 hover:bg-zinc-100'
                            }`}
                          >
                            <Pencil1Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {isKosong ? 'Isi Nilai' : 'Edit'}
                          </Link>
                          <button
                            type="button"
                            onClick={() => setPesertaToDelete(p)}
                            disabled={deletingId === p.id}
                            aria-label={`Hapus peserta ${p.nama}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-400 bg-white text-zinc-700 transition hover:border-zinc-950 hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50"
                          >
                            {deletingId === p.id ? (
                              <ReloadIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                              <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="flex flex-col items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-normal text-zinc-600 sm:flex-row">
          <span>
            Menampilkan {filteredPeserta.length} dari {totalAll} peserta
          </span>
          <span className="font-medium text-zinc-800">
            {totalValid} lengkap · {totalEmpty} masih kosong
          </span>
        </div>
      </div>

      <ImportExcelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPeserta}
      />

      {/* Radix Dialog Modal Tambah Peserta */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmittingAdd) setIsAddModalOpen(false);
        }}
      >
        <DialogContent closeDisabled={isSubmittingAdd} className="max-w-md p-0 overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4 text-zinc-950" aria-hidden="true" />
              <DialogTitle>Tambah Peserta</DialogTitle>
            </div>
            <DialogDescription>
              Peserta baru memiliki status nilai KOSONG sampai diisi pada halaman penilaian.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddPeserta}>
            <div className="space-y-3.5 px-6 py-5 text-xs">
              <div>
                <label htmlFor="add-nama" className="mb-1 block font-medium text-zinc-900">
                  Nama Peserta <span className="font-semibold text-zinc-950">*</span>
                </label>
                <input
                  id="add-nama"
                  type="text"
                  required
                  value={addForm.nama}
                  onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
                  placeholder="Nama lengkap peserta"
                  className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="add-nip" className="mb-1 block font-medium text-zinc-900">
                  NIP
                </label>
                <input
                  id="add-nip"
                  type="text"
                  value={addForm.nip}
                  onChange={(e) => setAddForm({ ...addForm, nip: e.target.value })}
                  placeholder="NIP 18 digit (boleh dikosongkan)"
                  className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="add-instansi" className="mb-1 block font-medium text-zinc-900">
                  Instansi
                </label>
                <input
                  id="add-instansi"
                  type="text"
                  value={addForm.instansi}
                  onChange={(e) => setAddForm({ ...addForm, instansi: e.target.value })}
                  placeholder="Nama instansi"
                  className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="add-jabatan-pelatihan" className="mb-1 block font-medium text-zinc-900">
                    Jabatan Saat Pelatihan
                  </label>
                  <input
                    id="add-jabatan-pelatihan"
                    type="text"
                    value={addForm.jabatanPelatihan}
                    onChange={(e) =>
                      setAddForm({ ...addForm, jabatanPelatihan: e.target.value })
                    }
                    placeholder="Boleh dikosongkan"
                    className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="add-jabatan-sekarang" className="mb-1 block font-medium text-zinc-900">
                    Jabatan Saat Ini
                  </label>
                  <input
                    id="add-jabatan-sekarang"
                    type="text"
                    value={addForm.jabatanSaatIni}
                    onChange={(e) =>
                      setAddForm({ ...addForm, jabatanSaatIni: e.target.value })
                    }
                    placeholder="Boleh dikosongkan"
                    className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmittingAdd}
                className="rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-900 transition hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingAdd || !addForm.nama.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {isSubmittingAdd ? (
                  <ReloadIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {isSubmittingAdd ? 'Menyimpan...' : 'Simpan Peserta'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Radix AlertDialog Konfirmasi Hapus Peserta */}
      <ConfirmDialog
        open={pesertaToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingId) setPesertaToDelete(null);
        }}
        title="Hapus peserta ini?"
        description={
          pesertaToDelete
            ? `Peserta "${pesertaToDelete.nama}" beserta seluruh data survei dan wawancaranya akan dihapus permanen.`
            : ''
        }
        confirmLabel="Ya, Hapus Peserta"
        tone="danger"
        loading={deletingId !== null}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
