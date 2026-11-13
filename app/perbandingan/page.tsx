'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  Search,
  Download,
  RefreshCw,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { formatAngka } from '@/lib/hitung';

export default function PerbandinganPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Table Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSelisih, setFilterSelisih] = useState<'semua' | 'positif' | 'negatif' | 'kosong'>('semua');
  const [sortField, setSortField] = useState<'nama' | 'selisih' | 'L' | 'M'>('selisih');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ekspose', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching perbandingan data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pesertaList: any[] = data?.peserta || [];
  const ringkasan = data?.ringkasan;

  // Filter list untuk grafik deviasi (hanya yang memiliki selisih valid)
  const validDeltas = pesertaList.filter((p) => p.selisih !== null);

  // Cari nilai ekstrem untuk skala grafik
  const maxPos = Math.max(...validDeltas.map((p) => p.selisih || 0), 10);
  const minNeg = Math.min(...validDeltas.map((p) => p.selisih || 0), -10);
  const absExtreme = Math.max(Math.abs(maxPos), Math.abs(minNeg));

  // Filter untuk tabel
  const filteredPeserta = pesertaList.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.nama.toLowerCase().includes(q) ||
      (p.nip && p.nip.toLowerCase().includes(q)) ||
      (p.instansi && p.instansi.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (filterSelisih === 'positif') return p.selisih !== null && p.selisih > 0;
    if (filterSelisih === 'negatif') return p.selisih !== null && p.selisih < 0;
    if (filterSelisih === 'kosong') return p.isWawancaraKosong;
    return true;
  });

  // Sort tabel
  const sortedPeserta = [...filteredPeserta].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (aVal === null || aVal === undefined) return sortAsc ? 1 : -1;
    if (bVal === null || bVal === undefined) return sortAsc ? -1 : 1;

    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field: 'nama' | 'selisih' | 'L' | 'M') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // 4 Peserta Selisih Ekstrem (Top 2 Positif & Top 2 Negatif)
  const topPositif = [...validDeltas].sort((a, b) => (b.selisih || 0) - (a.selisih || 0)).slice(0, 2);
  const topNegatif = [...validDeltas].sort((a, b) => (a.selisih || 0) - (b.selisih || 0)).slice(0, 2);
  const extremaList = [...topPositif, ...topNegatif];

  const handleExportCSV = () => {
    if (pesertaList.length === 0) return;
    const headers = [
      'No',
      'Nama Peserta',
      'NIP',
      'Instansi',
      'Nilai L (Survei)',
      'Nilai M (Wawancara)',
      'Total Form',
      'Selisih (M-L)',
      'Status',
    ];

    const rows = sortedPeserta.map((p, idx) => [
      idx + 1,
      `"${p.nama}"`,
      p.nip || '-',
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
    link.download = `Perbandingan_Nilai_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Memuat analisis perbandingan nilai...</p>
      </div>
    );
  }

  const avgL = ringkasan?.rataRataSurveiL ?? 0;
  const avgM = ringkasan?.rataRataWawancaraM ?? 0;
  const avgDiff = avgM - avgL;

  const countPos = validDeltas.filter((p) => (p.selisih || 0) > 0).length;
  const countNeg = validDeltas.filter((p) => (p.selisih || 0) < 0).length;
  const countKosong = pesertaList.filter((p) => p.isWawancaraKosong).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Perbandingan Nilai L & M
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Langkah 2: Komparasi hasil survei mandiri alumni (L) vs wawancara evaluator (M) per peserta
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Ekspor CSV Perbandingan
        </button>
      </header>

      {/* 4 Kartu Metrik Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Rata-rata L (Survei)</p>
          <p className="text-3xl font-black text-emerald-600 mt-1 leading-tight tracking-tight">
            {avgL.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Survei hasil Aksi Perubahan (N={ringkasan?.totalValidSurvei})</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Rata-rata M (Wawancara)</p>
          <p className="text-3xl font-black text-emerald-800 mt-1 leading-tight tracking-tight">
            {avgM.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Wawancara evaluator (N={ringkasan?.totalValidWawancara})</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Rata-rata Selisih (M - L)</p>
          <p
            className={`text-3xl font-black mt-1 leading-tight tracking-tight ${
              avgDiff > 0 ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {avgDiff > 0 ? `+${avgDiff.toFixed(2)}` : avgDiff.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {avgDiff > 0 ? 'Evaluator lebih tinggi' : 'Survei alumni lebih tinggi'}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Distribusi Selisih</p>
          <p className="text-2xl font-black text-slate-800 mt-1 leading-tight tracking-tight">
            {countPos} <span className="text-emerald-600 text-lg">Pos</span> • {countNeg}{' '}
            <span className="text-rose-600 text-lg">Neg</span> • {countKosong}{' '}
            <span className="text-amber-600 text-lg">Kos</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Dari {ringkasan?.totalPeserta} total peserta terdaftar</p>
        </div>
      </div>

      {/* Grafik Deviasi Selisih (Tengah Garis Nol) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Grafik Deviasi Selisih (Nilai M - Nilai L) Per Peserta (PKP 2023)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="text-emerald-600 font-bold">Hijau (+):</span> Evaluator menilai lebih tinggi &nbsp;|&nbsp;{' '}
              <span className="text-rose-600 font-bold">Merah (-):</span> Alumni menilai mandiri lebih tinggi
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            0.00 (Titik Seimbang M = L)
          </span>
        </div>

        {/* Canvas Area Deviasi */}
        <div className="relative pt-2 pb-2 select-none overflow-x-auto">
          {/* Tooltip Display saat hover */}
          <div className="h-7 mb-2 flex items-center justify-center">
            {hoveredIdx !== null && validDeltas[hoveredIdx] ? (
              <div
                className={`text-xs font-bold px-3 py-1 rounded-lg shadow-sm flex items-center gap-2 ${
                  (validDeltas[hoveredIdx].selisih || 0) >= 0
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-300'
                }`}
              >
                <span>#{hoveredIdx + 1} {validDeltas[hoveredIdx].nama}:</span>
                <span className="font-mono">
                  L={validDeltas[hoveredIdx].L?.toFixed(2)} | M={validDeltas[hoveredIdx].M?.toFixed(2)} | Selisih=
                  {(validDeltas[hoveredIdx].selisih || 0) > 0
                    ? `+${validDeltas[hoveredIdx].selisih?.toFixed(2)}`
                    : validDeltas[hoveredIdx].selisih?.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                Arahkan kursor pada batang grafik untuk melihat rincian peserta
              </span>
            )}
          </div>

          <div className="min-w-[700px] px-2">
            {/* Top Half: Batang Positif (+) tumbuh dari bawah ke atas */}
            <div className="h-[100px] flex items-end justify-between gap-1 sm:gap-1.5">
              {validDeltas.map((p, idx) => {
                const diff = p.selisih || 0;
                const isPos = diff >= 0;
                const hPx = isPos ? Math.max((diff / absExtreme) * 90, 4) : 0;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex justify-center items-end h-full cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {isPos && (
                      <div
                        style={{ height: `${hPx}px` }}
                        className={`w-full max-w-[18px] rounded-t-sm transition-all duration-150 ${
                          hoveredIdx === idx ? 'bg-emerald-500 scale-x-110 shadow-sm' : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Middle Axis: Garis Nol Terpusat */}
            <div className="w-full h-[2px] bg-slate-300 my-0 relative">
              <span className="absolute -left-5 -top-2 text-[10px] font-mono text-slate-400 font-bold">0</span>
            </div>

            {/* Bottom Half: Batang Negatif (-) tumbuh dari atas ke bawah */}
            <div className="h-[100px] flex items-start justify-between gap-1 sm:gap-1.5">
              {validDeltas.map((p, idx) => {
                const diff = p.selisih || 0;
                const isNeg = diff < 0;
                const hPx = isNeg ? Math.max((Math.abs(diff) / absExtreme) * 90, 4) : 0;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex justify-center items-start h-full cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {isNeg && (
                      <div
                        style={{ height: `${hPx}px` }}
                        className={`w-full max-w-[18px] rounded-b-sm transition-all duration-150 ${
                          hoveredIdx === idx ? 'bg-rose-500 scale-x-110 shadow-sm' : 'bg-rose-600 hover:bg-rose-500'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* X-Axis Numbering (1..N) */}
            <div className="flex justify-between gap-1 sm:gap-1.5 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400 font-bold">
              {validDeltas.map((_, idx) => (
                <div key={idx} className="flex-1 text-center">
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Peserta dengan Selisih Ekstrem */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Peserta dengan Selisih Ekstrem (Bahan Evaluasi Khusus URD Lampiran A.3):
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {extremaList.map((p, idx) => {
            const isPos = (p.selisih || 0) >= 0;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${
                  isPos ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-900 truncate max-w-[160px]">{p.nama}</span>
                    <span className={`font-mono ${isPos ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isPos ? `+${p.selisih?.toFixed(2)}` : p.selisih?.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{p.instansi || '-'}</p>
                </div>
                <div className="text-[11px] font-mono text-slate-600 mt-2 pt-2 border-t border-slate-200/60 flex justify-between">
                  <span>L: {p.L?.toFixed(2)}</span>
                  <span>M: {p.M?.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel Komparasi Lengkap (UR-F-04) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Tabel Perbandingan Seluruh Peserta (UR-F-04)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Urutkan kolom selisih, nilai survei, atau wawancara untuk menganalisis deviasi
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-xs">
            <button
              onClick={() => setFilterSelisih('semua')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterSelisih === 'semua' ? 'bg-emerald-600 text-white' : 'text-slate-600'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterSelisih('positif')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterSelisih === 'positif' ? 'bg-emerald-600 text-white' : 'text-slate-600'
              }`}
            >
              Positif (+)
            </button>
            <button
              onClick={() => setFilterSelisih('negatif')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterSelisih === 'negatif' ? 'bg-rose-600 text-white' : 'text-slate-600'
              }`}
            >
              Negatif (-)
            </button>
            <button
              onClick={() => setFilterSelisih('kosong')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterSelisih === 'kosong' ? 'bg-amber-500 text-white' : 'text-slate-600'
              }`}
            >
              Kosong
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th
                  onClick={() => handleSort('nama')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-700"
                >
                  <div className="flex items-center gap-1">
                    Nama Peserta
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Instansi</th>
                <th
                  onClick={() => handleSort('L')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-700"
                >
                  <div className="flex items-center justify-center gap-1">
                    Nilai L
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('M')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-700"
                >
                  <div className="flex items-center justify-center gap-1">
                    Nilai M
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Total Form</th>
                <th
                  onClick={() => handleSort('selisih')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-700"
                >
                  <div className="flex items-center justify-center gap-1">
                    Selisih (M - L)
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPeserta.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50/60 transition ${
                    p.isWawancaraKosong ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-mono text-center text-slate-400 font-bold">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3">
                    <Link
                      href={`/peserta/${p.id}`}
                      className="font-bold text-slate-900 hover:text-emerald-700 transition"
                    >
                      {p.nama}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{p.instansi || '-'}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                    {p.L !== null ? p.L.toFixed(2) : '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {p.isWawancaraKosong ? (
                      <span className="text-amber-700 font-black text-[11px] bg-amber-100 px-2 py-0.5 rounded">
                        KOSONG
                      </span>
                    ) : (
                      <span className="font-bold text-slate-800">{p.M?.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                    {p.totalForm !== null ? p.totalForm.toFixed(2) : '-'}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    {p.isWawancaraKosong ? (
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
                  <td className="py-3 px-3 text-center">
                    {p.isWawancaraKosong ? (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        KOSONG
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        Lengkap
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
