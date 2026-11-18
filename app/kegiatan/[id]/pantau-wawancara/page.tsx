'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  Link2Icon,
  MagnifyingGlassIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import { StatusBanner } from '@/components/ui/status-banner';
import { TablePagination } from '@/components/ui/table-pagination';

export default function PantauWawancaraPage({
  params,
}: {
  params: { id: string };
}) {
  const [teams, setTeams] = useState<any[]>([]);
  const [peserta, setPeserta] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [savingTimId, setSavingTimId] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'semua' | 'selesai' | 'belum' | 'sudah_proper' | 'belum_proper'
  >('semua');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/kegiatan/${params.id}/pantau-wawancara`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(
          json.error || 'Gagal memuat pemantauan wawancara. Coba muat ulang halaman.'
        );
        return;
      }
      setTeams(json.data?.teams || []);
      setPeserta(json.data?.peserta || []);
      const drafts: Record<string, string> = {};
      for (const t of json.data?.teams || []) {
        drafts[t.id] = t.linkMeeting || '';
      }
      setLinkDrafts(drafts);
    } catch {
      setError('Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSaveMeetingLink = async (timId: string) => {
    try {
      setSavingTimId(timId);
      setError(null);
      setSaveFeedback(null);
      const res = await fetch(`/api/kegiatan/${params.id}/pantau-wawancara`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timId,
          linkMeeting: (linkDrafts[timId] || '').trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(
          json.error || 'Gagal memperbarui tautan meeting. Periksa tautan, lalu coba lagi.'
        );
        return;
      }
      setSaveFeedback('Tautan meeting tim berhasil diperbarui.');
      await loadData();
    } catch {
      setError('Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.');
    } finally {
      setSavingTimId(null);
    }
  };

  const copyInternalLink = async (pesertaId: string, path: string) => {
    try {
      const fullUrl =
        typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(pesertaId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Abaikan jika browser membatasi clipboard
    }
  };

  const isSelesaiLengkap = (p: any) => Boolean(p.hasProper && p.wawancaraSelesaiAt);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return peserta.filter((p) => {
      const selesai = isSelesaiLengkap(p);
      if (statusFilter === 'selesai' && !selesai) return false;
      if (statusFilter === 'belum' && selesai) return false;
      if (statusFilter === 'sudah_proper' && !p.hasProper) return false;
      if (statusFilter === 'belum_proper' && p.hasProper) return false;
      if (!q) return true;
      return (
        String(p.nama || '').toLowerCase().includes(q) ||
        String(p.nip || '').toLowerCase().includes(q) ||
        String(p.timNama || '').toLowerCase().includes(q) ||
        String(p.evaluatorNama || '').toLowerCase().includes(q)
      );
    });
  }, [peserta, search, statusFilter]);

  const selesaiCount = peserta.filter((p) => isSelesaiLengkap(p)).length;
  const properCount = peserta.filter((p) => Boolean(p.hasProper)).length;

  return (
    <div className="space-y-6">
      {error && <StatusBanner tone="error" title="Perhatian" message={error} />}
      {saveFeedback && (
        <StatusBanner tone="success" title="Berhasil" message={saveFeedback} />
      )}

      {/* Ringkasan & Tautan Meeting Daring */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-2 border-b border-zinc-200 pb-3.5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              Tautan Meeting Daring
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Boleh dikosongkan. Isi tautan Zoom atau Google Meet tiap tim; bila kosong, hanya tautan
              formulir wawancara yang tampil.
            </p>
          </div>
          <div className="text-xs font-medium text-zinc-700">
            Wawancara selesai:{' '}
            <strong className="text-zinc-950">
              {selesaiCount} dari {peserta.length} peserta
            </strong>{' '}
            · Sudah unggah Proper (laporan Proyek Perubahan peserta):{' '}
            <strong className="text-zinc-950">
              {properCount} dari {peserta.length} peserta
            </strong>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs text-zinc-600">
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Memuat daftar tim...
          </div>
        ) : teams.length === 0 ? (
          <div className="py-6 text-xs text-zinc-600">
            Belum ada tim. Buat tim dulu di menu Pembagian Tim.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {teams.map((tim) => (
              <div
                key={tim.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-zinc-950">{tim.namaTim}</p>
                    <p className="text-[11px] text-zinc-600">
                      {tim.evaluator?.nama || 'Belum ada evaluator'} ({tim._count?.peserta || 0}{' '}
                      peserta)
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkDrafts[tim.id] || ''}
                    onChange={(e) =>
                      setLinkDrafts((prev) => ({ ...prev, [tim.id]: e.target.value }))
                    }
                    placeholder="https://zoom.us/j/..."
                    className="min-h-[38px] w-full rounded-lg border border-zinc-500 bg-white px-2.5 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={savingTimId === tim.id}
                    onClick={() => handleSaveMeetingLink(tim.id)}
                    className="min-h-[38px] shrink-0 rounded-lg bg-zinc-950 px-3 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {savingTimId === tim.id ? '...' : 'Simpan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tabel Pantau Wawancara per Peserta */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 pb-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              Wawancara &amp; Tautan Formulir Peserta
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Setiap peserta punya tautan formulir wawancara. Tautan meeting tim tampil bila sudah
              diatur. Nilai Wawancara (M) adalah rata-rata 3 kriteria utama.
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari peserta, tim, evaluator..."
                className="min-h-[40px] w-full rounded-lg border border-zinc-500 bg-white pl-9 pr-3 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              aria-label="Filter status wawancara"
              className="min-h-[40px] rounded-lg border border-zinc-500 bg-white px-3 text-xs font-medium text-zinc-950 focus:border-zinc-950 focus:outline-none"
            >
              <option value="semua">Semua ({peserta.length} peserta)</option>
              <option value="selesai">Wawancara Selesai ({selesaiCount})</option>
              <option value="belum">
                Belum Selesai: belum unggah Proper / belum selesai wawancara (
                {peserta.length - selesaiCount})
              </option>
              <option value="sudah_proper">Sudah Unggah Proper ({properCount})</option>
              <option value="belum_proper">
                Belum Unggah Proper ({peserta.length - properCount})
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-700">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Peserta</th>
                <th className="px-3 py-2.5 font-semibold">Tim &amp; Evaluator</th>
                <th className="px-3 py-2.5 text-center font-semibold">Laporan Proper</th>
                <th className="px-3 py-2.5 text-center font-semibold">Nilai Wawancara (M)</th>
                <th className="px-3 py-2.5 text-center font-semibold">Status</th>
                <th className="px-3 py-2.5 text-right font-semibold">Tautan Wawancara</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filtered
                .slice((page - 1) * pageSize, page * pageSize)
                .map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-zinc-950">{p.nama}</div>
                    <div className="font-mono text-[11px] text-zinc-500">NIP {p.nip || '-'}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-zinc-900">{p.timNama}</div>
                    <div className="text-[11px] text-zinc-500">
                      {p.evaluatorNama || 'Evaluator belum diatur'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {p.hasProper ? (
                      <span className="inline-flex rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-white">
                        Sudah
                      </span>
                    ) : (
                      <span className="inline-flex rounded border border-zinc-400 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                        Belum
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center font-mono">
                    <div className="font-semibold text-zinc-950">
                      {typeof p.rataWawancaraM === 'number'
                        ? p.rataWawancaraM.toFixed(2)
                        : 'Belum dinilai'}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {p.filledNilai} dari 5 nilai terisi · {p.filledDeskripsi} dari 5 catatan bukti
                      terisi
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {isSelesaiLengkap(p) ? (
                      <div>
                        <span className="inline-flex rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] font-semibold text-white">
                          Selesai
                        </span>
                        <div className="mt-0.5 text-[10px] text-zinc-500">
                          {new Date(p.wawancaraSelesaiAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    ) : !p.hasProper ? (
                      <span className="inline-flex rounded border border-zinc-400 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-900">
                        Belum Unggah Proper
                      </span>
                    ) : (
                      <span className="inline-flex rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600">
                        Wawancara Belum Selesai
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                      <Link
                        href={p.linkInternalWawancara}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-zinc-800"
                      >
                        <Link2Icon className="h-3 w-3" aria-hidden="true" />
                        <span>Buka Form</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => copyInternalLink(p.id, p.linkInternalWawancara)}
                        title="Salin tautan formulir wawancara"
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-zinc-500 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-900 transition hover:bg-zinc-100"
                      >
                        {copiedId === p.id ? (
                          <>
                            <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Salin Tautan</span>
                          </>
                        )}
                      </button>
                      {p.linkMeeting && (
                        <a
                          href={p.linkMeeting}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-zinc-500 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-950 transition hover:bg-zinc-100"
                        >
                          <ExternalLinkIcon className="h-3 w-3" aria-hidden="true" />
                          <span>Buka Meeting</span>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setPage}
          itemLabel="peserta"
        />
      </section>
    </div>
  );
}
