'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircledIcon,
  ExternalLinkIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import { StatusBanner } from '@/components/ui/status-banner';

function getSurveySkor(p: any, kode: string): number | null {
  const found = (p.survey || []).find((s: any) => s.kode === kode);
  return typeof found?.skor === 'number' ? found.skor : null;
}

export default function DaftarWawancaraTimPage({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'semua' | 'belum_selesai' | 'selesai' | 'ada_kosong' | 'sudah_proper'
  >('semua');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/kegiatan/${params.id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!active) return;
        if (!res.ok || !json.success) {
          setError(json.error || 'Gagal memuat daftar peserta wawancara.');
          return;
        }
        setData(json.data);
      } catch {
        if (active) setError('Terjadi gangguan koneksi saat memuat peserta wawancara.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [params.id]);

  const peserta: any[] = data?.peserta || [];
  const teams: any[] = data?.tim || [];
  const meetingTeams = teams.filter((t) => Boolean(t.linkMeeting));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return peserta.filter((p) => {
      const hasKosong = (p.wawancara || []).some((w: any) => w.nilai === null);
      if (filterStatus === 'selesai' && !p.wawancaraSelesaiAt) return false;
      if (filterStatus === 'belum_selesai' && p.wawancaraSelesaiAt) return false;
      if (filterStatus === 'ada_kosong' && !hasKosong) return false;
      if (filterStatus === 'sudah_proper' && !p.inovasiProper) return false;
      if (!q) return true;
      return (
        String(p.nama || '').toLowerCase().includes(q) ||
        String(p.nip || '').toLowerCase().includes(q) ||
        String(p.instansi || '').toLowerCase().includes(q) ||
        String(p.tim?.namaTim || '').toLowerCase().includes(q)
      );
    });
  }, [peserta, search, filterStatus]);

  const selesaiCount = peserta.filter((p) => Boolean(p.wawancaraSelesaiAt)).length;
  const properCount = peserta.filter((p) => Boolean(p.inovasiProper)).length;

  if (loading) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8">
        <ReloadIcon className="h-5 w-5 animate-spin text-zinc-700" aria-hidden="true" />
        <p className="mt-2.5 text-sm font-medium text-zinc-700">
          Memuat daftar peserta wawancara...
        </p>
      </div>
    );
  }

  if (error) {
    return <StatusBanner tone="error" title="Gagal memuat peserta" message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Peserta Tim Anda</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">{peserta.length}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {teams.map((t) => t.namaTim).join(', ') || 'Belum tergabung tim'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Progres Wawancara</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">
            {selesaiCount} / {peserta.length} Selesai
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Nilai angka Excel terkunci otomatis (IT-07)
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Kesiapan Dokumen Proper</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">
            {properCount} / {peserta.length} Unggah
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Laporan &amp; evidence diunggah peserta sebelum wawancara
          </p>
        </div>
      </div>

      {meetingTeams.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-300 bg-zinc-50 px-5 py-3.5">
          <div>
            <p className="text-xs font-semibold text-zinc-950">
              Tautan Meeting Daring Tim (IT-08)
            </p>
            <p className="text-xs text-zinc-600">
              Gunakan ruang meeting berikut jika wawancara dilakukan secara daring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {meetingTeams.map((t) => (
              <a
                key={t.id}
                href={t.linkMeeting}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Meeting {t.namaTim}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 pb-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              Peserta &amp; Pengisian Wawancara
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Pilih peserta untuk membuka formulir 5 kriteria wawancara, melihat bukti Proper,
              dan mengisi hasil wawancara serta nilai yang masih kosong.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIP, instansi..."
                className="min-h-[40px] w-full rounded-lg border border-zinc-500 bg-white pl-9 pr-3 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none sm:w-56"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              aria-label="Filter daftar wawancara"
              className="min-h-[40px] rounded-lg border border-zinc-500 bg-white px-3 text-xs font-medium text-zinc-950 focus:border-zinc-950 focus:outline-none"
            >
              <option value="semua">Semua ({peserta.length})</option>
              <option value="belum_selesai">
                Belum Selesai ({peserta.length - selesaiCount})
              </option>
              <option value="selesai">Selesai ({selesaiCount})</option>
              <option value="ada_kosong">Ada Nilai Kosong</option>
              <option value="sudah_proper">Sudah Unggah Proper ({properCount})</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-600">
            {peserta.length === 0
              ? 'Belum ada peserta yang ditugaskan ke tim Anda pada kegiatan ini.'
              : 'Tidak ada peserta yang sesuai dengan filter.'}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-700">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Peserta &amp; Tim</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Survei (P1/P2/P3)</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Survei (L)</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Wawancara (M)</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Akhir Berbobot</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Proper</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Status</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filtered.map((p) => {
                  const s1 = getSurveySkor(p, 'L4_01');
                  const s2 = getSurveySkor(p, 'L4_02');
                  const s3 = getSurveySkor(p, 'L4_03');
                  const kosongCount = (p.wawancara || []).filter(
                    (w: any) => w.nilai === null
                  ).length;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="px-3 py-3">
                        <div className="font-semibold text-zinc-950">{p.nama}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                          NIP {p.nip}
                        </div>
                        <div className="mt-1 inline-flex rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-800">
                          {p.tim?.namaTim || p.namaTimExcel || 'Tanpa Tim'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-zinc-800">
                        {s1 ?? '-'} / {s2 ?? '-'} / {s3 ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono">
                        {typeof p.hasil?.rataSurveiL === 'number'
                          ? p.hasil.rataSurveiL.toFixed(2)
                          : '-'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-zinc-950">
                        {typeof p.hasil?.rataWawancaraM === 'number'
                          ? p.hasil.rataWawancaraM.toFixed(2)
                          : 'KOSONG'}
                        {kosongCount > 0 && (
                          <div className="text-[10px] font-normal text-zinc-500">
                            {kosongCount} kriteria kosong
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-mono">
                        {typeof p.hasil?.totalForm === 'number'
                          ? p.hasil.totalForm.toFixed(2)
                          : '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {p.inovasiProper ? (
                          <span className="inline-flex rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-white">
                            Sudah
                          </span>
                        ) : (
                          <span className="inline-flex rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600">
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {p.wawancaraSelesaiAt ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-950">
                              <CheckCircledIcon className="h-3 w-3" aria-hidden="true" />
                              Selesai
                            </span>
                            <span className="mt-0.5 text-[10px] text-zinc-500">
                              {new Date(p.wawancaraSelesaiAt).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex rounded border border-zinc-400 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700">
                            Belum Selesai
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/kegiatan/${params.id}/wawancara/${p.id}`}
                            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
                          >
                            <Pencil1Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Wawancara</span>
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
    </div>
  );
}
