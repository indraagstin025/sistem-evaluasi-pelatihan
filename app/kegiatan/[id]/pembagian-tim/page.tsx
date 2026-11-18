'use client';

import React, { useEffect, useState } from 'react';
import {
  Link2Icon,
  MixerHorizontalIcon,
  PersonIcon,
  PlusIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBanner } from '@/components/ui/status-banner';

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
  const [savingTimId, setSavingTimId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [evalDrafts, setEvalDrafts] = useState<Record<string, string>>({});

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
        setBanner({ tone: 'error', message: json.error || 'Gagal memuat pembagian tim.' });
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
      setBanner({ tone: 'error', message: 'Gangguan koneksi saat memuat pembagian tim.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleGenerateTeams = async (mode: 'from_excel' | 'auto_10') => {
    try {
      setBusyMode(mode);
      setBanner(null);
      const res = await fetch(`/api/kegiatan/${params.id}/tim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setBanner({ tone: 'error', message: json.error || 'Gagal membagi tim.' });
        return;
      }
      setBanner({ tone: 'success', message: json.message || 'Pembagian tim selesai.' });
      await loadData();
    } catch {
      setBanner({ tone: 'error', message: 'Gagal menghubungi server pembagian tim.' });
    } finally {
      setBusyMode(null);
    }
  };

  const handleSaveTim = async (timId: string) => {
    try {
      setSavingTimId(timId);
      setBanner(null);
      const res = await fetch(`/api/kegiatan/${params.id}/tim`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timId,
          evaluatorId: evalDrafts[timId] || null,
          linkMeeting: (linkDrafts[timId] || '').trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setBanner({ tone: 'error', message: json.error || 'Gagal menyimpan tim.' });
        return;
      }
      setBanner({ tone: 'success', message: 'Pengaturan tim berhasil disimpan.' });
      await loadData();
    } catch {
      setBanner({ tone: 'error', message: 'Koneksi bermasalah saat menyimpan tim.' });
    } finally {
      setSavingTimId(null);
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
          message: json.error || 'Gagal membuat dan menautkan akun evaluator.',
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
      setBanner({ tone: 'error', message: 'Koneksi bermasalah saat membuat akun.' });
    } finally {
      setCreatingEval(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <MixerHorizontalIcon className="h-4 w-4 text-zinc-950" aria-hidden="true" />
            <h2 className="text-base font-semibold text-zinc-950">
              Pembagian Tim &amp; Penugasan Evaluator (IT-12)
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            Total {totalPeserta} peserta terdaftar. Gunakan kelompok dari kolom Nama Tim Evaluator
            Excel atau bagi otomatis maksimal 10 peserta per tim (sisa peserta didistribusikan
            merata).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasExcelTeams && (
            <button
              type="button"
              disabled={busyMode !== null || totalPeserta === 0}
              onClick={() => handleGenerateTeams('from_excel')}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-50"
            >
              {busyMode === 'from_excel' ? 'Memproses...' : 'Sinkronkan Tim dari Excel'}
            </button>
          )}
          <button
            type="button"
            disabled={busyMode !== null || totalPeserta === 0}
            onClick={() => handleGenerateTeams('auto_10')}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {busyMode === 'auto_10' ? 'Membagi Tim...' : 'Bagi Tim Otomatis (10/Tim)'}
          </button>
        </div>
      </div>

      {banner && (
        <StatusBanner
          tone={banner.tone}
          title={banner.tone === 'success' ? 'Berhasil' : 'Perhatian'}
          message={banner.message}
        />
      )}

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-zinc-200 bg-white">
          <ReloadIcon className="h-5 w-5 animate-spin text-zinc-700" aria-hidden="true" />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600">
          {totalPeserta === 0
            ? 'Belum ada peserta terimpor. Impor file Excel terlebih dahulu.'
            : 'Belum ada tim terbentuk. Klik "Sinkronkan Tim dari Excel" atau "Bagi Tim Otomatis (10/Tim)".'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {teams.map((tim) => {
            const anggota: any[] = tim.peserta || [];
            return (
              <div
                key={tim.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-200 pb-3">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-950">
                        {tim.namaTim}
                      </h3>
                      <p className="mt-0.5 text-xs text-zinc-600">
                        {anggota.length} peserta dalam tim
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateForTim(tim)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-zinc-500 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-950 transition hover:bg-zinc-100"
                    >
                      <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Buat Akun Evaluator</span>
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-800">
                        <PersonIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Evaluator Penanggung Jawab</span>
                      </label>
                      <select
                        value={evalDrafts[tim.id] || ''}
                        onChange={(e) =>
                          setEvalDrafts((prev) => ({ ...prev, [tim.id]: e.target.value }))
                        }
                        className="min-h-[40px] w-full rounded-lg border border-zinc-500 bg-white px-3 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                      >
                        <option value="">-- Belum ditugaskan --</option>
                        {evaluators.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.nama} (NIP {ev.nip})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-800">
                        <Link2Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Tautan Meeting (Zoom/Meet)</span>
                      </label>
                      <input
                        type="url"
                        value={linkDrafts[tim.id] || ''}
                        onChange={(e) =>
                          setLinkDrafts((prev) => ({ ...prev, [tim.id]: e.target.value }))
                        }
                        placeholder="https://zoom.us/j/... (opsional)"
                        className="min-h-[40px] w-full rounded-lg border border-zinc-500 bg-white px-3 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="mb-2 text-[11px] font-semibold text-zinc-700">
                      Daftar Peserta Tim
                    </p>
                    <ol className="space-y-1.5 text-xs">
                      {anggota.map((p, idx) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5"
                        >
                          <span className="truncate font-medium text-zinc-900">
                            {idx + 1}. {p.nama}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                            {p.wawancaraSelesaiAt ? 'Selesai' : 'Menunggu'}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="mt-4 flex justify-end border-t border-zinc-200 pt-3">
                  <button
                    type="button"
                    disabled={savingTimId === tim.id}
                    onClick={() => handleSaveTim(tim.id)}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {savingTimId === tim.id ? 'Menyimpan...' : 'Simpan Pengaturan Tim'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat Akun Evaluator Baru langsung saat pembagian tim (IT-10) */}
      <Dialog
        open={Boolean(createForTim)}
        onOpenChange={(open) => {
          if (!open) setCreateForTim(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Akun Evaluator Baru</DialogTitle>
            <DialogDescription>
              Akun akan langsung ditugaskan ke <strong>{createForTim?.namaTim}</strong>. Evaluator
              masuk menggunakan NIP dan wajib mengganti sandi saat login pertama.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvaluatorForTim} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-800">
                Nama Lengkap Evaluator *
              </label>
              <input
                type="text"
                required
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                placeholder="Contoh: Angga Wijaya, S.Sos"
                className="min-h-[40px] w-full rounded-lg border border-zinc-500 bg-white px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-800">
                NIP (Username Login) *
              </label>
              <input
                type="text"
                required
                value={newNip}
                onChange={(e) => setNewNip(e.target.value)}
                placeholder="198501012010011001"
                className="min-h-[40px] w-full rounded-lg border border-zinc-500 bg-white px-3 font-mono text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-800">
                Email (Opsional)
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="evaluator@bpsdm.jabarprov.go.id"
                className="min-h-[40px] w-full rounded-lg border border-zinc-500 bg-white px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-800">
                Sandi Awal (min. 6 karakter) *
              </label>
              <input
                type="text"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Sandi sementara evaluator"
                className="min-h-[40px] w-full rounded-lg border border-zinc-500 bg-white px-3 font-mono text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <DialogFooter className="pt-2">
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
                className="min-h-[40px] rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
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
