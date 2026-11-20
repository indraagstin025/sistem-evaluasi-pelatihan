'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircledIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Link2Icon,
  MagnifyingGlassIcon,
  MixerHorizontalIcon,
  PersonIcon,
  PlusIcon,
  ReloadIcon,
  ShuffleIcon,
} from '@radix-ui/react-icons';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { StatusBanner } from '@/components/ui/status-banner';

interface GeneratedAcc {
  userId: string;
  timId: string;
  namaTim: string;
  nama: string;
  username: string;
  sandiAwal: string | null;
  status: 'created' | 'linked';
}

export default function PembagianTimPage({
  params,
}: {
  params: { id: string };
}) {
  const [teams, setTeams] = useState<any[]>([]);
  const [evaluators, setEvaluators] = useState<any[]>([]);
  const [totalPeserta, setTotalPeserta] = useState(0);
  const [hasExcelTeams, setHasExcelTeams] = useState(false);

  const [loading, setLoading] = useState(true);
  const [busyMode, setBusyMode] = useState<string | null>(null);
  const [confirmRandomOpen, setConfirmRandomOpen] = useState(false);
  const [savingTimId, setSavingTimId] = useState<string | null>(null);
  const [savedNoticeId, setSavedNoticeId] = useState<string | null>(null);
  const [movingPesertaId, setMovingPesertaId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [generatedAccounts, setGeneratedAccounts] = useState<GeneratedAcc[]>([]);

  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [evalDrafts, setEvalDrafts] = useState<Record<string, string>>({});
  const [collapsedTeams, setCollapsedTeams] = useState<Record<string, boolean>>({});
  const [searchPeserta, setSearchPeserta] = useState('');

  // Modal buat akun evaluator baru langsung pada tim
  const [createForTim, setCreateForTim] = useState<any>(null);
  const [newNama, setNewNama] = useState('');
  const [newNip, setNewNip] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creatingEval, setCreatingEval] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/kegiatan/${params.id}/tim`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setBanner({
          tone: 'error',
          message: json.error || 'Gagal memuat pembagian tim. Coba muat ulang halaman.',
        });
        return;
      }
      const d = json.data;
      setTeams(d.teams || []);
      setEvaluators(d.evaluators || []);
      setTotalPeserta(d.totalPeserta || 0);
      setHasExcelTeams(Boolean(d.hasExcelTeams));

      const nextLinks: Record<string, string> = {};
      const nextEvals: Record<string, string> = {};
      for (const t of d.teams || []) {
        nextLinks[t.id] = t.linkMeeting || '';
        nextEvals[t.id] = t.evaluatorId || '';
      }
      setLinkDrafts(nextLinks);
      setEvalDrafts(nextEvals);
    } catch {
      setBanner({
        tone: 'error',
        message: 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleGenerateTeams = async (mode: 'random' | 'from_excel' | 'auto_10') => {
    try {
      setBusyMode(mode);
      setBanner(null);
      setConfirmRandomOpen(false);
      const res = await fetch(`/api/kegiatan/${params.id}/tim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setBanner({
          tone: 'error',
          message: json.error || 'Gagal membagi tim. Muat ulang halaman, lalu coba lagi.',
        });
        return;
      }
      setGeneratedAccounts(json.data?.evaluatorAccounts || []);
      setBanner({ tone: 'success', message: json.message || 'Pembagian tim selesai.' });
      await loadData();
    } catch {
      setBanner({
        tone: 'error',
        message: 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.',
      });
    } finally {
      setBusyMode(null);
    }
  };

  const handleQuickAssignEvaluator = async (timId: string, nextEvaluatorId: string) => {
    setEvalDrafts((prev) => ({ ...prev, [timId]: nextEvaluatorId }));
    try {
      setSavingTimId(timId);
      setBanner(null);
      const res = await fetch(`/api/kegiatan/${params.id}/tim`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timId,
          evaluatorId: nextEvaluatorId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setBanner({
          tone: 'error',
          message: json.error || 'Gagal menautkan evaluator ke tim.',
        });
        await loadData();
        return;
      }
      setSavedNoticeId(timId);
      setTimeout(() => setSavedNoticeId((prev) => (prev === timId ? null : prev)), 2000);
      await loadData();
    } catch {
      setBanner({
        tone: 'error',
        message: 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.',
      });
    } finally {
      setSavingTimId(null);
    }
  };

  const handleSaveMeetingLink = async (timId: string) => {
    try {
      setSavingTimId(timId);
      setBanner(null);
      const res = await fetch(`/api/kegiatan/${params.id}/tim`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timId,
          linkMeeting: (linkDrafts[timId] || '').trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setBanner({
          tone: 'error',
          message: json.error || 'Gagal menyimpan tautan meeting.',
        });
        return;
      }
      setSavedNoticeId(timId);
      setTimeout(() => setSavedNoticeId((prev) => (prev === timId ? null : prev)), 2000);
      await loadData();
    } catch {
      setBanner({
        tone: 'error',
        message: 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.',
      });
    } finally {
      setSavingTimId(null);
    }
  };

  const handleMovePeserta = async (pesertaId: string, targetTimId: string) => {
    if (!targetTimId) return;
    try {
      setMovingPesertaId(pesertaId);
      setBanner(null);
      const res = await fetch(`/api/kegiatan/${params.id}/tim`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movePeserta: { pesertaId, targetTimId },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setBanner({ tone: 'error', message: json.error || 'Gagal memindahkan peserta.' });
        return;
      }
      setBanner({ tone: 'success', message: json.message || 'Peserta dipindahkan.' });
      await loadData();
    } catch {
      setBanner({
        tone: 'error',
        message: 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.',
      });
    } finally {
      setMovingPesertaId(null);
    }
  };

  const handleCreateEvaluatorForTim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForTim) return;
    try {
      setCreatingEval(true);
      setBanner(null);
      const res = await fetch(`/api/kegiatan/${params.id}/tim`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timId: createForTim.id,
          newEvaluator: {
            nama: newNama.trim(),
            nip: newNip.trim(),
            email: newEmail.trim() || undefined,
            password: newPassword,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setBanner({
          tone: 'error',
          message:
            json.error ||
            'Gagal membuat dan menautkan akun evaluator. Periksa isian, lalu coba lagi.',
        });
        return;
      }
      setCreateForTim(null);
      setNewNama('');
      setNewNip('');
      setNewEmail('');
      setNewPassword('');
      setBanner({
        tone: 'success',
        message: 'Akun Evaluator baru dibuat dan langsung ditugaskan ke tim.',
      });
      await loadData();
    } catch {
      setBanner({
        tone: 'error',
        message: 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.',
      });
    } finally {
      setCreatingEval(false);
    }
  };

  const assignedCount = useMemo(
    () => teams.filter((t) => Boolean(t.evaluatorId)).length,
    [teams]
  );

  const normalizedQuery = searchPeserta.trim().toLowerCase();

  return (
    <div className="space-y-6 pb-12">
      {/* Header Aksi 1-Klik */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <MixerHorizontalIcon className="h-4 w-4 text-zinc-950" aria-hidden="true" />
              <h2 className="text-base font-semibold text-zinc-950">
                Pembagian Tim &amp; Penugasan Evaluator
              </h2>
            </div>
            <p className="mt-1 text-xs text-zinc-600">
              Cukup klik <strong>Acak Peserta &amp; Evaluator</strong> untuk membagi peserta secara
              acak (~10/tim) sekaligus memasangkan akun Evaluator otomatis. Pengubahan Evaluator
              di setiap kartu tim tersimpan langsung tanpa tombol simpan tambahan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busyMode !== null || totalPeserta === 0}
              onClick={() => {
                if (teams.length > 0) setConfirmRandomOpen(true);
                else void handleGenerateTeams('random');
              }}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              <ShuffleIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {busyMode === 'random'
                  ? 'Mengacak Tim & Evaluator...'
                  : 'Acak Peserta & Evaluator (1-Klik)'}
              </span>
            </button>

            {hasExcelTeams && (
              <button
                type="button"
                disabled={busyMode !== null || totalPeserta === 0}
                onClick={() => void handleGenerateTeams('from_excel')}
                className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                {busyMode === 'from_excel' ? 'Memproses...' : 'Pakai Tim dari Excel'}
              </button>
            )}

            <button
              type="button"
              disabled={busyMode !== null || totalPeserta === 0}
              onClick={() => void handleGenerateTeams('auto_10')}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-50"
            >
              {busyMode === 'auto_10' ? 'Membagi...' : 'Bagi Urut Abjad (10/tim)'}
            </button>
          </div>
        </div>

        {/* Ringkasan Cepat + Filter Pencarian Peserta */}
        <div className="flex flex-col justify-between gap-3 border-t border-zinc-200 pt-3.5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-700">
            <span>
              Total peserta: <strong className="text-zinc-950">{totalPeserta}</strong>
            </span>
            <span>
              Jumlah tim: <strong className="text-zinc-950">{teams.length}</strong>
            </span>
            <span>
              Tim siap dengan Evaluator:{' '}
              <strong className="text-zinc-950">
                {assignedCount}/{teams.length}
              </strong>
            </span>
          </div>

          {teams.length > 0 && (
            <div className="relative sm:w-64">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Cari peserta dalam tim"
                value={searchPeserta}
                onChange={(e) => setSearchPeserta(e.target.value)}
                placeholder="Cari peserta atau NIP..."
                className="min-h-[38px] w-full rounded-lg border border-zinc-500 bg-white pl-9 pr-3 text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
              />
            </div>
          )}
        </div>
      </div>

      {banner && (
        <StatusBanner
          tone={banner.tone}
          title={banner.tone === 'success' ? 'Berhasil' : 'Perhatian'}
          message={banner.message}
          onDismiss={() => setBanner(null)}
        />
      )}

      {generatedAccounts.length > 0 && (
        <section className="rounded-2xl border border-zinc-900 bg-white p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">
                Akun Evaluator Terpasang ({generatedAccounts.length} tim)
              </h3>
              <p className="mt-0.5 text-xs text-zinc-600">
                Sandi juga bisa dilihat dan disalin kapan saja melalui menu{' '}
                <strong>Akun Evaluator</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGeneratedAccounts([])}
              className="rounded-lg border border-zinc-500 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-900 hover:bg-zinc-100"
            >
              Tutup
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
              <caption className="sr-only">
                Daftar akun evaluator yang terpasang atau dibuat otomatis saat pembagian tim
              </caption>
              <thead className="bg-zinc-50 text-zinc-700">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Tim</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Nama Evaluator</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Username / NIP</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Kata Sandi</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {generatedAccounts.map((acc) => (
                  <tr key={acc.timId}>
                    <td className="px-3 py-2 font-medium text-zinc-950">{acc.namaTim}</td>
                    <td className="px-3 py-2 text-zinc-800">{acc.nama}</td>
                    <td className="px-3 py-2 font-mono text-zinc-950">{acc.username}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-zinc-950">
                      {acc.sandiAwal || 'Sudah ada (cek menu Akun Evaluator)'}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded border border-zinc-400 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-800">
                        {acc.status === 'created' ? 'Akun baru dibuat' : 'Akun aktif terpasang'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-zinc-200 bg-white">
          <ReloadIcon className="h-5 w-5 animate-spin text-zinc-700" aria-hidden="true" />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600">
          {totalPeserta === 0
            ? 'Belum ada peserta terimpor. Impor file Excel terlebih dahulu.'
            : 'Belum ada tim. Klik "Acak Peserta & Evaluator (1-Klik)" untuk membentuk tim secara instan.'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {teams.map((tim) => {
            const allAnggota: any[] = tim.peserta || [];
            const anggota = normalizedQuery
              ? allAnggota.filter(
                  (p) =>
                    p.nama.toLowerCase().includes(normalizedQuery) ||
                    (p.nip || '').toLowerCase().includes(normalizedQuery)
                )
              : allAnggota;
            const isCollapsed = Boolean(collapsedTeams[tim.id]) && !normalizedQuery;
            const currentMeetingChanged =
              (linkDrafts[tim.id] || '').trim() !== (tim.linkMeeting || '').trim();

            return (
              <div
                key={tim.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-200 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-zinc-950">
                          {tim.namaTim}
                        </h3>
                        {savedNoticeId === tim.id && (
                          <span className="inline-flex items-center gap-1 rounded border border-zinc-400 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-900">
                            <CheckCircledIcon className="h-3 w-3" aria-hidden="true" />
                            Tersimpan
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-600">
                        {allAnggota.length} peserta dalam tim
                        {tim.evaluator ? ` · Evaluator: ${tim.evaluator.nama}` : ' · Belum ada evaluator'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateForTim(tim)}
                      className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-lg border border-zinc-500 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-950 transition hover:bg-zinc-100"
                    >
                      <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Buat Akun Baru</span>
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`evaluator-${tim.id}`}
                        className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-800"
                      >
                        <PersonIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Evaluator (otomatis simpan)</span>
                      </label>
                      <select
                        id={`evaluator-${tim.id}`}
                        disabled={savingTimId === tim.id}
                        value={evalDrafts[tim.id] || ''}
                        onChange={(e) => void handleQuickAssignEvaluator(tim.id, e.target.value)}
                        className="min-h-[40px] w-full rounded-lg border border-zinc-500 bg-white px-3 text-xs text-zinc-950 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 disabled:opacity-50"
                      >
                        <option value="">-- Belum ditugaskan --</option>
                        {evaluators.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.nama} ({ev.nip})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`meeting-${tim.id}`}
                        className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-800"
                      >
                        <Link2Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Tautan Meeting Daring</span>
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          id={`meeting-${tim.id}`}
                          type="url"
                          value={linkDrafts[tim.id] || ''}
                          onChange={(e) =>
                            setLinkDrafts((prev) => ({ ...prev, [tim.id]: e.target.value }))
                          }
                          placeholder="https://zoom.us/j/... (opsional)"
                          className="min-h-[40px] min-w-0 flex-1 rounded-lg border border-zinc-500 bg-white px-3 text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                        />
                        {currentMeetingChanged && (
                          <button
                            type="button"
                            disabled={savingTimId === tim.id}
                            onClick={() => void handleSaveMeetingLink(tim.id)}
                            className="min-h-[40px] shrink-0 rounded-lg bg-zinc-950 px-3 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                          >
                            {savingTimId === tim.id ? '...' : 'Simpan'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-zinc-700">
                        Daftar Peserta Tim ({anggota.length})
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedTeams((prev) => ({ ...prev, [tim.id]: !prev[tim.id] }))
                        }
                        aria-expanded={!isCollapsed}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-200/70 hover:text-zinc-950"
                      >
                        <span>{isCollapsed ? 'Tampilkan' : 'Lipat'}</span>
                        {isCollapsed ? (
                          <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronUpIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    {!isCollapsed && (
                      <ol className="mt-2 max-h-60 space-y-1.5 overflow-y-auto text-xs">
                        {anggota.length === 0 ? (
                          <li className="py-2 text-center text-[11px] text-zinc-600">
                            Tidak ada peserta yang cocok.
                          </li>
                        ) : (
                          anggota.map((p, idx) => (
                            <li
                              key={p.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-zinc-900">
                                  {idx + 1}. {p.nama}
                                </p>
                                <p className="font-mono text-[10px] text-zinc-600">
                                  {p.inovasiProper && p.wawancaraSelesaiAt
                                    ? 'Selesai'
                                    : !p.inovasiProper
                                      ? 'Belum Unggah Proper'
                                      : 'Wawancara Belum Selesai'}
                                </p>
                              </div>

                              {teams.length > 1 && (
                                <select
                                  aria-label={`Pindahkan ${p.nama} ke tim lain`}
                                  disabled={movingPesertaId === p.id}
                                  value={tim.id}
                                  onChange={(e) => void handleMovePeserta(p.id, e.target.value)}
                                  className="min-h-[30px] rounded border border-zinc-400 bg-zinc-50 px-2 text-[11px] font-medium text-zinc-800 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-950"
                                >
                                  {teams.map((optTim) => (
                                    <option key={optTim.id} value={optTim.id}>
                                      {optTim.id === tim.id ? optTim.namaTim : `Pindah -> ${optTim.namaTim}`}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </li>
                          ))
                        )}
                      </ol>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmRandomOpen}
        onOpenChange={setConfirmRandomOpen}
        title="Acak Ulang Peserta & Evaluator?"
        description="Seluruh peserta pada kegiatan ini akan dibagi ulang secara acak (~10 peserta/tim) dan dipasangkan otomatis dengan Evaluator secara acak (termasuk membuat akun baru jika Evaluator aktif kurang)."
        confirmLabel="Ya, Acak Sekarang"
        tone="primary"
        loading={busyMode === 'random'}
        onConfirm={() => {
          void handleGenerateTeams('random');
        }}
      />

      {/* Modal Buat Akun Evaluator Baru langsung saat pembagian tim */}
      <Dialog
        open={Boolean(createForTim)}
        onOpenChange={(open) => {
          if (!open) setCreateForTim(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Akun Evaluator Baru</DialogTitle>
            <DialogDescription>
              Akun akan langsung ditugaskan ke <strong>{createForTim?.namaTim}</strong>. Evaluator
              masuk memakai NIP/username sebagai login dan wajib ganti kata sandi saat pertama
              masuk.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvaluatorForTim} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              <div>
                <label
                  htmlFor="tim-ev-nama"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  Nama Lengkap Evaluator <span className="text-zinc-600">*</span>
                </label>
                <input
                  id="tim-ev-nama"
                  name="nama"
                  type="text"
                  autoComplete="name"
                  required
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso, S.Sos"
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
              </div>

              <div>
                <label
                  htmlFor="tim-ev-nip"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  NIP / Username Login <span className="text-zinc-600">*</span>
                </label>
                <input
                  id="tim-ev-nip"
                  name="nip"
                  type="text"
                  autoComplete="off"
                  required
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  placeholder="198501012010011001"
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 font-mono text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
              </div>

              <div>
                <label
                  htmlFor="tim-ev-email"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  Email (Opsional)
                </label>
                <input
                  id="tim-ev-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Contoh: evaluator@bpsdm.jabarprov.go.id"
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
              </div>

              <div>
                <label
                  htmlFor="tim-ev-pass"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  Kata Sandi Awal (minimal 6 karakter) <span className="text-zinc-600">*</span>
                </label>
                <input
                  id="tim-ev-pass"
                  name="new-password"
                  type="text"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kata sandi sementara evaluator"
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 font-mono text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setCreateForTim(null)}
                className="min-h-[40px] rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={creatingEval}
                className="min-h-[40px] rounded-lg bg-zinc-950 px-5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {creatingEval ? 'Menyimpan...' : 'Buat & Tugaskan'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
