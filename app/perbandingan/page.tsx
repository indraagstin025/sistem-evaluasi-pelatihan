'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon,
  DownloadIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import Topbar from '@/components/Topbar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StatusBanner } from '@/components/ui/status-banner';

export default function PerbandinganPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeDeltaIdx, setActiveDeltaIdx] = useState<number | null>(null);

  const [filterSelisih, setFilterSelisih] = useState<
    'semua' | 'positif' | 'negatif' | 'kosong'
  >('semua');
  const [sortField, setSortField] = useState<'nama' | 'selisih' | 'L' | 'M'>('selisih');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch('/api/ekspose', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFetchError(json.error || 'Gagal memuat data perbandingan nilai.');
        return;
      }
      setData(json);
    } catch (err) {
      console.error('Error fetching perbandingan data:', err);
      setFetchError('Koneksi bermasalah saat memuat data perbandingan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pesertaList: any[] = data?.peserta || [];
  const ringkasan = data?.ringkasan;

  const validDeltas = pesertaList.filter((p) => p.selisih !== null);

  const maxPos = Math.max(...validDeltas.map((p) => p.selisih || 0), 10);
  const minNeg = Math.min(...validDeltas.map((p) => p.selisih || 0), -10);
  const absExtreme = Math.max(Math.abs(maxPos), Math.abs(minNeg));

  const filteredPeserta = pesertaList.filter((p) => {
    if (filterSelisih === 'positif') return p.selisih !== null && p.selisih > 0;
    if (filterSelisih === 'negatif') return p.selisih !== null && p.selisih < 0;
    if (filterSelisih === 'kosong') return p.isWawancaraKosong;
    return true;
  });

  const sortedPeserta = [...filteredPeserta].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

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

  const renderSortIcon = (field: 'nama' | 'selisih' | 'L' | 'M') => {
    if (sortField !== field) {
      return <CaretSortIcon className="h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />;
    }
    return sortAsc ? (
      <CaretUpIcon className="h-3.5 w-3.5 text-zinc-950" aria-hidden="true" />
    ) : (
      <CaretDownIcon className="h-3.5 w-3.5 text-zinc-950" aria-hidden="true" />
    );
  };

  const getAriaSort = (
    field: 'nama' | 'selisih' | 'L' | 'M'
  ): 'ascending' | 'descending' | 'none' => {
    if (sortField !== field) return 'none';
    return sortAsc ? 'ascending' : 'descending';
  };

  const topPositif = [...validDeltas]
    .sort((a, b) => (b.selisih || 0) - (a.selisih || 0))
    .slice(0, 2);
  const topNegatif = [...validDeltas]
    .sort((a, b) => (a.selisih || 0) - (b.selisih || 0))
    .slice(0, 2);
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
      <div className="py-24 text-center" aria-busy="true">
        <ReloadIcon className="mx-auto mb-3 h-6 w-6 animate-spin text-zinc-950" aria-hidden="true" />
        <p className="text-xs font-medium text-zinc-600">Memuat perbandingan nilai...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-6xl py-10">
        <StatusBanner
          tone="error"
          title="Gagal memuat data perbandingan"
          message={fetchError}
          onRetry={fetchData}
        />
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
    <div className="space-y-6 pb-12">
      <Topbar
        title="Perbandingan Nilai L & M"
        subtitle="Komparasi hasil survei alumni (L) dan wawancara evaluator (M) untuk setiap peserta"
      >
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={pesertaList.length === 0}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3.5 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DownloadIcon className="h-3.5 w-3.5 text-zinc-700" aria-hidden="true" />
          Unduh CSV
        </button>
      </Topbar>

      {/* 4 Kartu Metrik Ringkasan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Rata-rata L (Survei)</p>
          <p className="mt-1.5 font-mono text-[26px] font-semibold leading-tight tracking-tight text-zinc-950 tabular-nums">
            {avgL.toFixed(2)}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-600">
            Survei Aksi Perubahan (N={ringkasan?.totalValidSurvei ?? 0})
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Rata-rata M (Wawancara)</p>
          <p className="mt-1.5 font-mono text-[26px] font-semibold leading-tight tracking-tight text-zinc-950 tabular-nums">
            {avgM.toFixed(2)}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-600">
            Wawancara evaluator (N={ringkasan?.totalValidWawancara ?? 0})
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-950 p-5 text-white">
          <p className="text-xs font-medium text-zinc-300">Rata-rata Selisih (M - L)</p>
          <p className="mt-1.5 font-mono text-[26px] font-semibold leading-tight tracking-tight text-white tabular-nums">
            {avgDiff > 0 ? `+${avgDiff.toFixed(2)}` : avgDiff.toFixed(2)}
          </p>
          <p className="mt-1 text-xs font-normal text-zinc-300">
            {(ringkasan?.totalPeserta ?? 0) === 0
              ? 'Belum ada data'
              : avgDiff > 0
              ? 'Evaluator rata-rata lebih tinggi'
              : avgDiff < 0
              ? 'Survei alumni rata-rata lebih tinggi'
              : 'Nilai rata-rata seimbang'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Distribusi Selisih</p>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 font-mono text-base font-semibold leading-snug text-zinc-950 tabular-nums">
            <span className="whitespace-nowrap">
              <span className="text-zinc-950">{countPos}</span> Positif
            </span>
            <span aria-hidden="true" className="text-zinc-500">
              ·
            </span>
            <span className="whitespace-nowrap">
              <span className="text-zinc-700">{countNeg}</span> Negatif
            </span>
            <span aria-hidden="true" className="text-zinc-500">
              ·
            </span>
            <span className="whitespace-nowrap">
              <span className="text-zinc-950">{countKosong}</span> Kosong
            </span>
          </p>
          <p className="mt-1.5 text-xs font-normal text-zinc-600">
            Total {ringkasan?.totalPeserta ?? 0} peserta
          </p>
        </div>
      </div>

      {/* Grafik Deviasi Selisih dengan Radix Tooltip (hover, fokus keyboard, dan sentuhan) */}
      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-2 border-b border-zinc-200 pb-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 sm:text-base">
              Grafik Selisih Nilai (M - L) per Peserta
            </h2>
            <p className="mt-0.5 text-xs font-normal text-zinc-600">
              <span className="font-semibold text-zinc-950">Hitam solid (+):</span> evaluator menilai lebih tinggi ·{' '}
              <span className="font-semibold text-zinc-800">Arsir bergaris (-):</span> alumni menilai lebih tinggi
            </p>
          </div>
          <span className="self-start rounded-md border border-zinc-300 bg-zinc-50 px-2.5 py-1 font-mono text-xs font-medium text-zinc-700 sm:self-auto">
            0.00 (seimbang: M = L)
          </span>
        </div>

        {validDeltas.length === 0 ? (
          <div className="py-12 text-center text-xs font-normal text-zinc-600">
            Belum ada peserta dengan data survei dan wawancara lengkap untuk ditampilkan pada grafik selisih.
          </div>
        ) : (
          <div className="relative overflow-x-auto pb-2 pt-2 select-none">
            <div className="mb-2 flex min-h-[28px] items-center justify-center">
              {activeDeltaIdx !== null && validDeltas[activeDeltaIdx] ? (
                <div
                  className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-1 text-xs font-medium ${
                    (validDeltas[activeDeltaIdx].selisih || 0) >= 0
                      ? 'border-zinc-950 bg-zinc-950 text-white'
                      : 'border-zinc-900 bg-zinc-100 text-zinc-950'
                  }`}
                >
                  <span>
                    #{activeDeltaIdx + 1} {validDeltas[activeDeltaIdx].nama}:
                  </span>
                  <span className="font-mono tabular-nums">
                    L={validDeltas[activeDeltaIdx].L?.toFixed(2)} | M=
                    {validDeltas[activeDeltaIdx].M?.toFixed(2)} | Selisih=
                    {(validDeltas[activeDeltaIdx].selisih || 0) > 0
                      ? `+${validDeltas[activeDeltaIdx].selisih?.toFixed(2)}`
                      : validDeltas[activeDeltaIdx].selisih?.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-normal text-zinc-600">
                  Arahkan kursor, sentuh, atau tekan Tab pada batang grafik untuk melihat rincian peserta.
                </span>
              )}
            </div>

            <div className="min-w-[700px] px-2">
              <div className="relative flex h-[212px] items-stretch justify-between gap-1 sm:gap-1.5">
                {/* Middle Zero Line */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-[1.5px] -translate-y-1/2 bg-zinc-400"
                >
                  <span className="absolute -left-4 -top-2 font-mono text-[10px] font-medium text-zinc-700">
                    0
                  </span>
                </div>

                {validDeltas.map((p, idx) => {
                  const diff = p.selisih || 0;
                  const isPos = diff >= 0;
                  const hPx = Math.max((Math.abs(diff) / absExtreme) * 90, 6);
                  const formattedDiff = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);

                  return (
                    <Tooltip key={p.id || idx}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Peserta ${idx + 1} ${p.nama}: Nilai L ${p.L?.toFixed(
                            2
                          )}, Nilai M ${p.M?.toFixed(2)}, Selisih ${formattedDiff}`}
                          onMouseEnter={() => setActiveDeltaIdx(idx)}
                          onFocus={() => setActiveDeltaIdx(idx)}
                          onClick={() => setActiveDeltaIdx(idx)}
                          className="relative z-10 flex flex-1 flex-col items-center justify-center rounded-sm focus:bg-zinc-100 focus:outline-none"
                        >
                          {/* Top Positive Half */}
                          <div className="flex h-[100px] w-full items-end justify-center pb-[1px]">
                            {isPos && (
                              <span
                                style={{ height: `${hPx}px` }}
                                className={`block w-full max-w-[18px] rounded-t-sm transition-colors ${
                                  activeDeltaIdx === idx
                                    ? 'bg-zinc-700'
                                    : 'bg-zinc-950 hover:bg-zinc-700'
                                }`}
                              />
                            )}
                          </div>

                          {/* Bottom Negative Half */}
                          <div className="flex h-[100px] w-full items-start justify-center pt-[1px]">
                            {!isPos && (
                              <span
                                style={{ height: `${hPx}px` }}
                                className={`bg-hatch-mono block w-full max-w-[18px] rounded-b-sm border border-zinc-900 transition-opacity ${
                                  activeDeltaIdx === idx ? 'opacity-100 ring-1 ring-zinc-950' : 'opacity-90 hover:opacity-100'
                                }`}
                              />
                            )}
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{p.nama}</p>
                        <p className="font-mono text-[10px]">
                          L: {p.L?.toFixed(2)} | M: {p.M?.toFixed(2)} | Selisih: {formattedDiff}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              <div className="flex justify-between gap-1 border-t border-zinc-200 pt-2 font-mono text-[10px] font-normal text-zinc-600 sm:gap-1.5">
                {validDeltas.map((_, idx) => (
                  <div key={idx} className="flex-1 text-center tabular-nums">
                    {idx + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4 Peserta dengan Selisih Ekstrem */}
      {extremaList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-zinc-700">
            Peserta dengan selisih nilai terbesar
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {extremaList.map((p, idx) => {
              const isPos = (p.selisih || 0) >= 0;
              return (
                <div
                  key={p.id || idx}
                  className={`flex flex-col justify-between rounded-2xl border p-4 ${
                    isPos
                      ? 'border-zinc-950 bg-zinc-950 text-white'
                      : 'border-zinc-400 bg-white text-zinc-950'
                  }`}
                >
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="max-w-[160px] truncate font-medium">
                        {p.nama}
                      </span>
                      <span className="font-mono font-semibold tabular-nums">
                        {isPos ? `+${p.selisih?.toFixed(2)}` : p.selisih?.toFixed(2)}
                      </span>
                    </div>
                    <p
                      className={`truncate text-[11px] font-normal ${
                        isPos ? 'text-zinc-300' : 'text-zinc-600'
                      }`}
                    >
                      {p.instansi || '-'}
                    </p>
                  </div>
                  <div
                    className={`mt-2.5 flex justify-between border-t pt-2 font-mono text-[11px] font-normal tabular-nums ${
                      isPos ? 'border-zinc-800 text-zinc-300' : 'border-zinc-200 text-zinc-700'
                    }`}
                  >
                    <span>L: {p.L?.toFixed(2)}</span>
                    <span>M: {p.M?.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabel Komparasi Lengkap dengan Radix Tabs & Tombol Sort Aksesibel */}
      <div className="space-y-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 sm:text-base">
              Tabel Perbandingan Semua Peserta
            </h2>
            <p className="mt-0.5 text-xs font-normal text-zinc-600">
              Pilih judul kolom untuk mengurutkan berdasarkan nama, nilai, atau selisih.
            </p>
          </div>

          <Tabs
            value={filterSelisih}
            onValueChange={(v) =>
              setFilterSelisih(v as 'semua' | 'positif' | 'negatif' | 'kosong')
            }
          >
            <TabsList aria-label="Filter arah selisih nilai">
              <TabsTrigger value="semua">Semua</TabsTrigger>
              <TabsTrigger value="positif">Positif (+)</TabsTrigger>
              <TabsTrigger value="negatif">Negatif (-)</TabsTrigger>
              <TabsTrigger value="kosong">Kosong</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-x-auto pt-1">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100 text-xs font-medium text-zinc-700">
                <th className="w-12 px-3 py-3 text-center">No</th>
                <th className="px-3 py-3" aria-sort={getAriaSort('nama')}>
                  <button
                    type="button"
                    onClick={() => handleSort('nama')}
                    className="inline-flex items-center gap-1 font-medium text-zinc-800 hover:text-zinc-950"
                  >
                    <span>Nama Peserta</span>
                    {renderSortIcon('nama')}
                  </button>
                </th>
                <th className="px-3 py-3">Instansi</th>
                <th className="px-3 py-3 text-center" aria-sort={getAriaSort('L')}>
                  <button
                    type="button"
                    onClick={() => handleSort('L')}
                    className="inline-flex items-center justify-center gap-1 font-medium text-zinc-800 hover:text-zinc-950"
                  >
                    <span>Nilai L</span>
                    {renderSortIcon('L')}
                  </button>
                </th>
                <th className="px-3 py-3 text-center" aria-sort={getAriaSort('M')}>
                  <button
                    type="button"
                    onClick={() => handleSort('M')}
                    className="inline-flex items-center justify-center gap-1 font-medium text-zinc-800 hover:text-zinc-950"
                  >
                    <span>Nilai M</span>
                    {renderSortIcon('M')}
                  </button>
                </th>
                <th className="px-3 py-3 text-center">Total Form</th>
                <th className="px-3 py-3 text-center" aria-sort={getAriaSort('selisih')}>
                  <button
                    type="button"
                    onClick={() => handleSort('selisih')}
                    className="inline-flex items-center justify-center gap-1 font-medium text-zinc-800 hover:text-zinc-950"
                  >
                    <span>Selisih (M - L)</span>
                    {renderSortIcon('selisih')}
                  </button>
                </th>
                <th className="px-3 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70">
              {sortedPeserta.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-xs font-normal text-zinc-600">
                    Tidak ada peserta pada kategori filter ini.
                  </td>
                </tr>
              ) : (
                sortedPeserta.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-zinc-50 ${
                      p.isWawancaraKosong ? 'bg-zinc-50/70' : ''
                    }`}
                  >
                    <td className="px-3 py-3 text-center font-mono font-normal text-zinc-600 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/peserta/${p.id}`}
                        prefetch={false}
                        className="font-medium text-zinc-950 underline-offset-4 transition hover:text-zinc-600 hover:underline"
                      >
                        {p.nama}
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-normal text-zinc-700">{p.instansi || '-'}</td>
                    <td className="px-3 py-3 text-center font-mono font-normal text-zinc-800 tabular-nums">
                      {p.L !== null ? p.L.toFixed(2) : '-'}
                    </td>
                    <td className="px-3 py-3 text-center font-mono">
                      {p.isWawancaraKosong ? (
                        <span className="inline-block rounded border border-zinc-900 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-950">
                          KOSONG
                        </span>
                      ) : (
                        <span className="font-normal text-zinc-800 tabular-nums">
                          {p.M?.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-medium text-zinc-950 tabular-nums">
                      {p.totalForm !== null ? p.totalForm.toFixed(2) : '-'}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-medium tabular-nums">
                      {p.isWawancaraKosong ? (
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
                    <td className="px-3 py-3 text-center">
                      {p.isWawancaraKosong ? (
                        <span className="inline-block rounded-md bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-white">
                          KOSONG
                        </span>
                      ) : (
                        <span className="inline-block rounded-md border border-zinc-300 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-900">
                          Lengkap
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
