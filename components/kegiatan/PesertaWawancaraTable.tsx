'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircledIcon,
  ExternalLinkIcon,
  EyeOpenIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
} from '@radix-ui/react-icons';

interface PesertaWawancaraTableProps {
  kegiatanId: string;
  peserta: any[];
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
  if (val === null || val === undefined || Number.isNaN(val)) return '-';
  return Number(val).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTimestampSql(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function PesertaWawancaraTable({
  kegiatanId,
  peserta,
  teams = [],
  viewerRole,
}: PesertaWawancaraTableProps) {
  const isAdmin = viewerRole === 'SUPER_ADMIN';
  const [search, setSearch] = useState('');
  const [selectedTim, setSelectedTim] = useState('semua');
  const [statusFilter, setStatusFilter] = useState<
    'semua' | 'selesai' | 'belum_selesai' | 'belum_proper' | 'ada_kosong'
  >('semua');

  const isPesertaSelesai = (p: any): boolean =>
    Boolean(p.inovasiProper && p.wawancaraSelesaiAt);

  const counts = useMemo(() => {
    let selesai = 0;
    let belumProper = 0;
    let adaKosong = 0;
    for (const p of peserta) {
      if (isPesertaSelesai(p)) selesai++;
      if (!p.inovasiProper) belumProper++;
      if ((p.wawancara || []).some((w: any) => w.nilai === null)) adaKosong++;
    }
    return {
      selesai,
      belumSelesai: peserta.length - selesai,
      belumProper,
      adaKosong,
    };
  }, [peserta]);

  const teamOptions = useMemo(() => {
    if (teams.length > 0) {
      return teams.map((t) => ({ id: t.id, nama: t.namaTim }));
    }
    const unique = new Map<string, string>();
    for (const p of peserta) {
      if (p.tim?.id && p.tim?.namaTim) {
        unique.set(p.tim.id, p.tim.namaTim);
      }
    }
    return Array.from(unique.entries()).map(([id, nama]) => ({ id, nama }));
  }, [teams, peserta]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return peserta.filter((p) => {
      if (selectedTim !== 'semua' && p.timId !== selectedTim && p.tim?.id !== selectedTim) {
        return false;
      }
      const selesai = isPesertaSelesai(p);
      const hasKosong = (p.wawancara || []).some((w: any) => w.nilai === null);
      if (statusFilter === 'selesai' && !selesai) return false;
      if (statusFilter === 'belum_selesai' && selesai) return false;
      if (statusFilter === 'belum_proper' && Boolean(p.inovasiProper)) return false;
      if (statusFilter === 'ada_kosong' && !hasKosong) return false;

      if (!q) return true;
      return (
        String(p.nama || '').toLowerCase().includes(q) ||
        String(p.nip || '').toLowerCase().includes(q) ||
        String(p.instansi || p.instansiPelatihan || '').toLowerCase().includes(q) ||
        String(p.tim?.namaTim || p.namaTimExcel || '').toLowerCase().includes(q)
      );
    });
  }, [peserta, search, selectedTim, statusFilter]);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="space-y-4 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            Peserta &amp; pengisian wawancara
          </h2>
          <p className="mt-0.5 text-xs text-zinc-600">
            {isAdmin
              ? 'Daftar seluruh peserta kegiatan dalam mode baca saja (read-only). Klik Lihat Form untuk memeriksa kelengkapan dokumen Proper dan bukti wawancara.'
              : 'Klik Wawancara untuk mengisi nilai kosong dan catatan bukti; status selesai berlaku setelah Proper diunggah dan wawancara dikonfirmasi.'}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIP, atau instansi..."
              className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white pl-9 pr-3 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {isAdmin && teamOptions.length > 0 && (
              <select
                value={selectedTim}
                onChange={(e) => setSelectedTim(e.target.value)}
                aria-label="Filter berdasarkan tim"
                className="min-h-[42px] rounded-lg border border-zinc-500 bg-white px-3 text-xs font-medium text-zinc-950 focus:border-zinc-950 focus:outline-none"
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
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filter status peserta"
              className="min-h-[42px] rounded-lg border border-zinc-500 bg-white px-3 text-xs font-medium text-zinc-950 focus:border-zinc-950 focus:outline-none"
            >
              <option value="semua">Semua status ({peserta.length})</option>
              <option value="selesai">Selesai ({counts.selesai})</option>
              <option value="belum_selesai">Belum Selesai ({counts.belumSelesai})</option>
              <option value="belum_proper">Belum Unggah Proper ({counts.belumProper})</option>
              <option value="ada_kosong">Ada Nilai Kosong ({counts.adaKosong})</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-600">
          {peserta.length === 0
            ? isAdmin
              ? 'Belum ada data peserta pada kegiatan ini.'
              : 'Belum ada peserta yang ditugaskan ke tim Anda pada kegiatan ini.'
            : 'Tidak ada peserta yang sesuai dengan pencarian atau filter.'}
        </div>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
            <thead>
              <tr className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                <th className="px-3 py-3">Peserta / NIP</th>
                <th className="px-3 py-3">Tim</th>
                <th className="px-3 py-3 text-right">Survey</th>
                <th className="px-3 py-3 text-right">Wawancara</th>
                <th className="px-3 py-3 text-right">Akhir Berbobot</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filtered.map((p) => {
                const selesai = isPesertaSelesai(p);
                const hasProper = Boolean(p.inovasiProper);
                const kosongCount = (p.wawancara || []).filter(
                  (w: any) => w.nilai === null
                ).length;
                const instansiText = p.instansi || p.instansiPelatihan || '-';
                const timText = p.tim?.namaTim || p.namaTimExcel || 'Belum Dibagi';
                const surveyVal = p.hasil?.rataSurveiL;
                const wawancaraVal = p.hasil?.rataWawancaraM;
                const totalVal = p.hasil?.totalForm;

                return (
                  <tr key={p.id} className="transition-colors hover:bg-zinc-50/80">
                    <td className="px-3 py-3.5">
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-[11px] font-semibold text-zinc-900"
                        >
                          {getInitials(p.nama)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-950">{p.nama}</div>
                          <div className="mt-0.5 font-mono text-[11px] text-zinc-600">
                            {p.nip || '-'}
                          </div>
                          <div className="mt-0.5 text-[11px] text-zinc-500">
                            {instansiText}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 align-middle">
                      <span className="inline-flex rounded-md border border-zinc-400 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-900">
                        {timText}
                      </span>
                    </td>

                    <td className="px-3 py-3.5 text-right align-middle font-mono text-zinc-800 tabular-nums">
                      {formatScoreId(surveyVal)}
                    </td>

                    <td className="px-3 py-3.5 text-right align-middle font-mono tabular-nums">
                      {typeof wawancaraVal === 'number' ? (
                        <span className="font-medium text-zinc-950">
                          {formatScoreId(wawancaraVal)}
                        </span>
                      ) : (
                        <span className="inline-flex rounded border border-zinc-400 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-800">
                          KOSONG
                        </span>
                      )}
                      {kosongCount > 0 && (
                        <div className="mt-0.5 text-[10px] font-normal text-zinc-500">
                          {kosongCount} kriteria kosong
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-right align-middle font-mono font-semibold text-zinc-950 tabular-nums">
                      {formatScoreId(totalVal)}
                    </td>

                    <td className="px-3 py-3.5 text-center align-middle">
                      {selesai ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-white">
                            <CheckCircledIcon className="h-3 w-3" aria-hidden="true" />
                            <span>Selesai</span>
                          </span>
                          <span className="mt-1 font-mono text-[10px] text-zinc-500">
                            {formatTimestampSql(p.wawancaraSelesaiAt)}
                          </span>
                        </div>
                      ) : !hasProper ? (
                        <span className="inline-flex rounded border border-zinc-400 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-900">
                          Belum Unggah Proper
                        </span>
                      ) : (
                        <span className="inline-flex rounded border border-zinc-400 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-800">
                          Belum Selesai
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-right align-middle">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Link
                          href={`/kegiatan/${kegiatanId}/wawancara/${p.id}`}
                          className={
                            isAdmin
                              ? 'inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-950 hover:text-white'
                              : 'inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800'
                          }
                        >
                          {isAdmin ? (
                            <EyeOpenIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Pencil1Icon className="h-3.5 w-3.5" aria-hidden="true" />
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
      )}
    </section>
  );
}
