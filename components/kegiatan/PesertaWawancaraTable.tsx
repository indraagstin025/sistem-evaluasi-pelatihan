'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircledIcon,
  ExternalLinkIcon,
  EyeOpenIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import { TablePagination } from '@/components/ui/table-pagination';

export interface PesertaPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PesertaCounts {
  total: number;
  selesai: number;
  belumSelesai: number;
  belumProper: number;
  adaKosong: number;
}

interface PesertaWawancaraTableProps {
  kegiatanId: string;
  initialPeserta: any[];
  initialPagination: PesertaPagination;
  initialCounts: PesertaCounts;
  teams?: any[];
  viewerRole: 'SUPER_ADMIN' | 'EVALUATOR';
}

function getInitials(nama: string): string {
  const cleaned = String(nama || '')
    .replace(/^(dr\.?|h\.?|hj\.?|ir\.?|prof\.?)\s+/i, '')
    .split(',')[0]
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatScoreId(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) return 'Belum dinilai';
  return Number(val).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTimestampId(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${datePart}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PesertaWawancaraTable({
  kegiatanId,
  initialPeserta,
  initialPagination,
  initialCounts,
  teams = [],
  viewerRole,
}: PesertaWawancaraTableProps) {
  const isAdmin = viewerRole === 'SUPER_ADMIN';
  const [rows, setRows] = useState<any[]>(initialPeserta);
  const [pagination, setPagination] = useState<PesertaPagination>(initialPagination);
  const [counts, setCounts] = useState<PesertaCounts>(initialCounts);
  const [fetching, setFetching] = useState(false);

  const [page, setPage] = useState(initialPagination.page || 1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTim, setSelectedTim] = useState('semua');
  const [statusFilter, setStatusFilter] = useState<
    'semua' | 'selesai' | 'belum_selesai' | 'belum_proper' | 'ada_kosong'
  >('semua');

  const isFirstRender = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const controller = new AbortController();
    async function loadPage() {
      try {
        setFetching(true);
        const qs = new URLSearchParams({
          kegiatanId,
          page: String(page),
          limit: '10',
        });
        if (debouncedSearch) qs.set('search', debouncedSearch);
        if (selectedTim !== 'semua') qs.set('timId', selectedTim);
        if (statusFilter !== 'semua') qs.set('status', statusFilter);

        const res = await fetch(`/api/peserta?${qs.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok || !json.success) return;
        setRows(json.data || []);
        if (json.pagination) setPagination(json.pagination);
        if (json.counts) setCounts(json.counts);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Error memuat paginasi peserta:', err);
        }
      } finally {
        setFetching(false);
      }
    }

    loadPage();
    return () => controller.abort();
  }, [kegiatanId, page, debouncedSearch, selectedTim, statusFilter]);

  const teamOptions = useMemo(() => {
    if (teams.length > 0) {
      return teams.map((t) => ({ id: t.id, nama: t.namaTim }));
    }
    const unique = new Map<string, string>();
    for (const p of rows) {
      if (p.tim?.id && p.tim?.namaTim) {
        unique.set(p.tim.id, p.tim.namaTim);
      }
    }
    return Array.from(unique.entries()).map(([id, nama]) => ({ id, nama }));
  }, [teams, rows]);

  const isPesertaSelesai = (p: any): boolean =>
    Boolean(p.inovasiProper && p.wawancaraSelesaiAt);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="space-y-4 border-b border-zinc-200 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              Peserta &amp; pengisian wawancara
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              {isAdmin
                ? 'Daftar peserta kegiatan dalam mode baca saja, 10 peserta per halaman. Klik "Lihat Form" untuk memeriksa kelengkapan Proper (laporan Proyek Perubahan peserta) dan bukti wawancara.'
                : 'Klik "Wawancara" untuk mengisi nilai (skala 0–100) dan catatan bukti. Status "Selesai" baru berlaku setelah Proper (laporan Proyek Perubahan peserta) diunggah dan wawancara ditandai selesai.'}
            </p>
          </div>
          {fetching && (
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
              <ReloadIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span>Memuat...</span>
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Cari nama, NIP, atau instansi"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, NIP, atau instansi..."
              className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white pl-9 pr-3 text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {isAdmin && teamOptions.length > 0 && (
              <select
                value={selectedTim}
                onChange={(e) => {
                  setSelectedTim(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter berdasarkan tim"
                className="min-h-[42px] rounded-lg border border-zinc-500 bg-white px-3 text-xs font-medium text-zinc-950 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
              >
                <option value="semua">Semua tim</option>
                {teamOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                  </option>
                ))}
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              aria-label="Filter status peserta"
              className="min-h-[42px] rounded-lg border border-zinc-500 bg-white px-3 text-xs font-medium text-zinc-950 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            >
              <option value="semua">Semua status ({counts.total})</option>
              <option value="selesai">Selesai ({counts.selesai})</option>
              <option value="belum_selesai">Wawancara Belum Selesai ({counts.belumSelesai})</option>
              <option value="belum_proper">Belum Unggah Proper ({counts.belumProper})</option>
              <option value="ada_kosong">Ada Nilai yang Belum Diisi ({counts.adaKosong})</option>
            </select>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-600">
          {counts.total === 0
            ? isAdmin
              ? 'Belum ada data peserta pada kegiatan ini.'
              : 'Belum ada peserta yang ditugaskan ke tim Anda pada kegiatan ini.'
            : 'Tidak ada peserta yang sesuai dengan pencarian atau filter.'}
        </div>
      ) : (
        <>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
              <caption className="sr-only">
                Daftar peserta beserta tim, nilai survei, nilai wawancara, nilai akhir berbobot, dan status
              </caption>
              <thead>
                <tr className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                  <th scope="col" className="px-2 py-3">Peserta / NIP (Nomor Induk Pegawai)</th>
                  <th scope="col" className="px-1.5 py-3">Tim</th>
                  <th scope="col" className="px-1.5 py-3 text-right">Survei</th>
                  <th scope="col" className="px-1.5 py-3 text-right">Wawancara</th>
                  <th scope="col" className="px-1.5 py-3 text-right whitespace-nowrap">Nilai Akhir Berbobot</th>
                  <th scope="col" className="px-1.5 py-3 text-center">Status</th>
                  <th scope="col" className="px-2 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {rows.map((p) => {
                  const selesai = isPesertaSelesai(p);
                  const hasProper = Boolean(p.inovasiProper);
                  const kosongCount = (p.wawancara || []).filter(
                    (w: any) => w.nilai === null
                  ).length;
                  const instansiText = p.instansi || p.instansiPelatihan || '-';
                  const timText = p.tim?.namaTim || p.namaTimExcel || 'Belum Dibagi ke Tim';
                  const surveyVal = p.hasil?.rataSurveiL;
                  const wawancaraVal = p.hasil?.rataWawancaraM;
                  const totalVal = p.hasil?.totalForm;

                  return (
                    <tr key={p.id} className="transition-colors hover:bg-zinc-50/80">
                      <td className="px-2 py-3">
                        <div className="flex items-start gap-2.5">
                          <span
                            aria-hidden="true"
                            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-[11px] font-semibold text-zinc-900"
                          >
                            {getInitials(p.nama)}
                          </span>
                          <div className="min-w-0 max-w-[170px]">
                            <div className="font-semibold text-zinc-950">{p.nama}</div>
                            <div className="mt-0.5 font-mono text-[11px] text-zinc-600">
                              {p.nip || '-'}
                            </div>
                            <div className="mt-0.5 truncate text-[11px] text-zinc-500" title={instansiText}>
                              {instansiText}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-1.5 py-3 align-middle">
                        <span className="inline-flex whitespace-nowrap rounded-md border border-zinc-400 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-900">
                          {timText}
                        </span>
                      </td>

                      <td className="px-1.5 py-3 text-right align-middle font-mono text-zinc-800 tabular-nums">
                        {formatScoreId(surveyVal)}
                      </td>

                      <td className="px-1.5 py-3 text-right align-middle font-mono tabular-nums">
                        {typeof wawancaraVal === 'number' ? (
                          <span className="font-medium text-zinc-950">
                            {formatScoreId(wawancaraVal)}
                          </span>
                        ) : (
                          <span className="inline-flex whitespace-nowrap rounded border border-zinc-400 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-800">
                            Belum dinilai
                          </span>
                        )}
                        {kosongCount > 0 && (
                          <div className="mt-0.5 text-[10px] font-normal text-zinc-500">
                            {kosongCount} dari 5 kriteria belum dinilai
                          </div>
                        )}
                      </td>

                      <td className="px-1.5 py-3 text-right align-middle font-mono font-semibold text-zinc-950 tabular-nums">
                        {formatScoreId(totalVal)}
                      </td>

                      <td className="px-1.5 py-3 text-center align-middle">
                        {selesai ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] font-medium text-white">
                              <CheckCircledIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span>Selesai</span>
                            </span>
                            <span className="mt-1 whitespace-nowrap font-mono text-[10px] text-zinc-500">
                              {formatTimestampId(p.wawancaraSelesaiAt)}
                            </span>
                          </div>
                        ) : !hasProper ? (
                          <span className="inline-flex whitespace-nowrap rounded border border-zinc-400 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-900">
                            Belum Unggah Proper
                          </span>
                        ) : (
                          <span className="inline-flex whitespace-nowrap rounded border border-zinc-400 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-800">
                            Wawancara Belum Selesai
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-3 text-right align-middle">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Link
                            href={`/kegiatan/${kegiatanId}/wawancara/${p.id}`}
                            className={
                              isAdmin
                                ? 'inline-flex min-h-[36px] items-center gap-1 whitespace-nowrap rounded-lg border border-zinc-500 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-950 transition hover:bg-zinc-950 hover:text-white'
                                : 'inline-flex min-h-[36px] items-center gap-1 whitespace-nowrap rounded-lg bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-zinc-800'
                            }
                          >
                            {isAdmin ? (
                              <EyeOpenIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            ) : (
                              <Pencil1Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            )}
                            <span>{isAdmin ? 'Lihat Form' : 'Wawancara'}</span>
                          </Link>
                          {p.tim?.linkMeeting && (
                            <a
                              href={p.tim.linkMeeting}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Buka ruang meeting tim"
                              className="inline-flex min-h-[38px] items-center rounded-lg border border-zinc-500 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-950 hover:bg-zinc-100"
                            >
                              <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={pagination.page}
            pageSize={10}
            totalItems={pagination.total}
            onPageChange={(nextPage) => setPage(nextPage)}
            loading={fetching}
            itemLabel="peserta"
          />
        </>
      )}
    </section>
  );
}
