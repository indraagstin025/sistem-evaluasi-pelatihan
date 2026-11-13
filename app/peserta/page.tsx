'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ImportExcelModal from '@/components/ImportExcelModal';
import { formatAngka } from '@/lib/hitung';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'valid' | 'empty'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPeserta = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ekspose', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.peserta) {
        setPesertaList(json.peserta);
      }
    } catch (err) {
      console.error('Error fetching peserta:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeserta();
  }, []);

  // Filter
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Data Peserta
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar {totalAll} peserta evaluasi pasca pelatihan PKP Angkatan VII Tahun 2023 Kabupaten Bogor
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Unduh format template Excel untuk data evaluasi"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Template Excel
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Unduh CSV
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm shadow-emerald-200 flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Impor File Excel
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama peserta, NIP, instansi..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 self-start md:self-auto text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Semua ({totalAll})
          </button>
          <button
            onClick={() => setActiveFilter('valid')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeFilter === 'valid'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Lengkap ({totalValid})
          </button>
          <button
            onClick={() => setActiveFilter('empty')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeFilter === 'empty'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50/60'
            }`}
          >
            Perlu Input Nilai ({totalEmpty})
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Memuat data peserta dari database...</p>
          </div>
        ) : filteredPeserta.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada peserta yang cocok dengan pencarian.</p>
            <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci lain atau bersihkan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Peserta & NIP</th>
                  <th className="py-3 px-4">Instansi / Unit Kerja</th>
                  <th className="py-3 px-4 text-center">Nilai L</th>
                  <th className="py-3 px-4 text-center">Nilai M</th>
                  <th className="py-3 px-4 text-center">Total Form</th>
                  <th className="py-3 px-4 text-center">Selisih (M-L)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPeserta.map((p, idx) => {
                  const isKosong = p.isWawancaraKosong;
                  const rowNo = String(idx + 1).padStart(2, '0');

                  return (
                    <tr
                      key={p.id}
                      className={`transition ${
                        isKosong
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 text-center font-bold">
                        {rowNo}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.nama}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {p.nip ? `NIP. ${p.nip}` : 'NIP Tidak Tercatat'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium">{p.instansi || '-'}</div>
                        {p.jabatanSaatIni && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                            {p.jabatanSaatIni}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {p.L !== null ? p.L.toFixed(2) : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isKosong ? (
                          <span className="font-mono font-black text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                            KOSONG
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-slate-800">
                            {p.M !== null ? p.M.toFixed(2) : '-'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isKosong ? (
                          <span className="font-mono font-black text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                            KOSONG
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-slate-800">
                            {p.totalForm !== null ? p.totalForm.toFixed(2) : '-'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {isKosong ? (
                          <span className="text-slate-300">-</span>
                        ) : p.selisih !== null ? (
                          <span
                            className={
                              p.selisih > 0
                                ? 'text-emerald-600'
                                : p.selisih < 0
                                ? 'text-rose-600'
                                : 'text-slate-600'
                            }
                          >
                            {p.selisih > 0 ? `+${p.selisih.toFixed(2)}` : p.selisih.toFixed(2)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isKosong ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            Perlu Input Nilai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            Lengkap
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/peserta/${p.id}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                            isKosong
                              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-200'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                          {isKosong ? 'Isi Nilai' : 'Edit'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>
            Menampilkan {filteredPeserta.length} dari {totalAll} total peserta terdaftar
          </span>
          <span className="font-medium text-slate-500">
            {totalValid} Lengkap • {totalEmpty} Data Kosong (UR-N-02)
          </span>
        </div>
      </div>

      {/* Modal Dialog Impor Excel Fleksibel */}
      <ImportExcelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPeserta}
      />
    </div>
  );
}
