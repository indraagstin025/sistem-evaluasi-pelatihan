'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckIcon,
  CopyIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  LockClosedIcon,
  Pencil1Icon,
  PlusIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import Topbar from '@/components/Topbar';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBanner } from '@/components/ui/status-banner';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  fetchJsonWithCache,
  getClientCache,
  invalidateClientCache,
} from '@/lib/client-cache';

interface EvaluatorUser {
  id: string;
  nama: string;
  nip: string | null;
  email: string | null;
  revealedPassword?: string | null;
  mustChangePassword: boolean;
  aktif: boolean;
  timDiampu: Array<{
    id: string;
    namaTim: string;
    kegiatan: { id: string; nama: string };
  }>;
}

export default function KelolaEvaluatorPage() {
  const cachedUsers = getClientCache<{ success: boolean; data: EvaluatorUser[] }>('/api/users');
  const [users, setUsers] = useState<EvaluatorUser[]>(cachedUsers?.data?.data ?? []);
  const [loading, setLoading] = useState(!cachedUsers?.data?.data);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [form, setForm] = useState({ nama: '', nip: '', email: '', password: '' });

  const [resetTarget, setResetTarget] = useState<EvaluatorUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [showResetPass, setShowResetPass] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState<EvaluatorUser | null>(null);
  const [togglingAktif, setTogglingAktif] = useState(false);

  const [visiblePassIds, setVisiblePassIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<EvaluatorUser | null>(null);
  const [editForm, setEditForm] = useState({ nama: '', nip: '', email: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleCopyPassword = async (id: string, pwd: string) => {
    try {
      await navigator.clipboard.writeText(pwd);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {
      setBanner({ tone: 'error', text: 'Gagal menyalin kata sandi ke clipboard.' });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSavingEdit(true);
    setEditError(null);
    setBanner(null);
    try {
      const res = await fetch(`/api/users/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setEditError(json.error || 'Gagal memperbarui profil Evaluator.');
        return;
      }
      invalidateClientCache('/api/users');
      setEditTarget(null);
      setBanner({ tone: 'success', text: `Data Evaluator ${json.data.nama} berhasil diperbarui.` });
      await loadUsers({ force: true, silent: true });
    } catch {
      setEditError('Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.');
    } finally {
      setSavingEdit(false);
    }
  };

  const loadUsers = async (options?: { force?: boolean; silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setFetchError(null);
    try {
      const { data: json } = await fetchJsonWithCache<{
        success: boolean;
        data?: EvaluatorUser[];
        error?: string;
      }>('/api/users', { force: options?.force });
      if (!json.success) {
        if (!options?.silent) {
          setFetchError(
            json.error || 'Gagal memuat daftar Evaluator. Coba muat ulang halaman.'
          );
        }
        return;
      }
      setUsers(json.data || []);
    } catch (err: any) {
      if (!options?.silent) {
        setFetchError(
          err?.message ||
            'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.'
        );
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    const existing = getClientCache<{ success: boolean; data: EvaluatorUser[] }>('/api/users');
    if (existing?.data?.data) {
      void loadUsers({ force: true, silent: true });
    } else {
      void loadUsers();
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setBanner(null);
    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setCreateError(
          json.error || 'Gagal membuat akun Evaluator. Periksa isian, lalu coba lagi.'
        );
        return;
      }
      invalidateClientCache('/api/users');
      setCreateOpen(false);
      setCreateError(null);
      setForm({ nama: '', nip: '', email: '', password: '' });
      setBanner({ tone: 'success', text: json.message });
      setPage(1);
      await loadUsers({ force: true, silent: true });
    } catch {
      setCreateError('Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.');
    } finally {
      setCreating(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetting(true);
    setResetError(null);
    setBanner(null);
    try {
      const res = await fetch(`/api/users/${resetTarget.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setResetError(
          json.error || 'Gagal mereset kata sandi. Periksa kata sandi baru, lalu coba lagi.'
        );
        return;
      }
      invalidateClientCache('/api/users');
      setResetTarget(null);
      setResetPassword('');
      setResetError(null);
      setBanner({ tone: 'success', text: json.message });
      await loadUsers({ force: true, silent: true });
    } catch {
      setResetError('Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.');
    } finally {
      setResetting(false);
    }
  };

  const handleToggleAktif = async (u: EvaluatorUser) => {
    setBanner(null);
    setTogglingAktif(true);
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aktif: !u.aktif }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setBanner({
          tone: 'error',
          text: json.error || 'Gagal mengubah keaktifan akun. Coba muat ulang halaman.',
        });
        return;
      }
      invalidateClientCache('/api/users');
      setDeactivateTarget(null);
      await loadUsers({ force: true, silent: true });
    } catch {
      setBanner({
        tone: 'error',
        text: 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.',
      });
    } finally {
      setTogglingAktif(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Topbar
        title="Kelola Akun Evaluator"
        subtitle="Buat akun Evaluator (masuk dengan NIP atau Nomor Induk Pegawai dan kata sandi awal) serta reset kata sandi bila perlu"
      >
        <button
          type="button"
          onClick={() => {
            setCreateError(null);
            setShowCreatePass(false);
            setCreateOpen(true);
          }}
          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
        >
          <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Tambah Evaluator</span>
        </button>
      </Topbar>

      {banner && (
        <StatusBanner
          tone={banner.tone}
          message={banner.text}
          onDismiss={() => setBanner(null)}
        />
      )}

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-600">
          <ReloadIcon className="h-4 w-4 animate-spin text-zinc-950" aria-hidden="true" />
          <span>Memuat akun Evaluator...</span>
        </div>
      ) : fetchError ? (
        <StatusBanner tone="error" message={fetchError} onRetry={loadUsers} />
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-zinc-950">Belum Ada Akun Evaluator</p>
          <p className="mt-1 text-xs text-zinc-600">
            Klik &quot;Tambah Evaluator&quot; di atas, atau buat lewat menu Pembagian Tim di
            halaman kegiatan.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <caption className="sr-only">
                Daftar akun evaluator beserta NIP, tim yang ditangani, status kata sandi, dan status keaktifan
              </caption>
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-800">
                  <th scope="col" className="px-4 py-3">Nama Evaluator</th>
                  <th scope="col" className="px-4 py-3">NIP / Username</th>
                  <th scope="col" className="px-4 py-3">Tim yang Ditangani</th>
                  <th scope="col" className="px-4 py-3">Kata Sandi Saat Ini</th>
                  <th scope="col" className="px-4 py-3">Status Sandi &amp; Akun</th>
                  <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {users
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((u) => {
                    const isVisible = Boolean(visiblePassIds[u.id]);
                    const hasVaultPass = Boolean(u.revealedPassword);
                    return (
                    <tr key={u.id} className="hover:bg-zinc-50/70">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-950">{u.nama}</p>
                        {u.email && <p className="text-[11px] text-zinc-600">{u.email}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-900">{u.nip || '-'}</td>
                      <td className="px-4 py-3 text-zinc-700">
                        {u.timDiampu.length > 0
                          ? u.timDiampu.map((t) => `${t.namaTim} (${t.kegiatan.nama})`).join(', ')
                          : 'Belum ditugaskan ke tim mana pun'}
                      </td>
                      <td className="px-4 py-3">
                        {hasVaultPass ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="min-w-[96px] rounded border border-zinc-300 bg-zinc-50 px-2 py-1 font-mono text-[11px] font-medium text-zinc-950">
                              {isVisible ? u.revealedPassword : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setVisiblePassIds((prev) => ({
                                  ...prev,
                                  [u.id]: !prev[u.id],
                                }))
                              }
                              aria-label={isVisible ? `Sembunyikan sandi ${u.nama}` : `Lihat sandi ${u.nama}`}
                              aria-pressed={isVisible}
                              className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-lg border border-zinc-500 bg-white text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 sm:h-8 sm:w-8"
                            >
                              {isVisible ? (
                                <EyeClosedIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                <EyeOpenIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleCopyPassword(u.id, u.revealedPassword!)}
                              aria-label={`Salin sandi ${u.nama}`}
                              className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-lg border border-zinc-500 bg-white text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 sm:h-8 sm:w-8"
                            >
                              {copiedId === u.id ? (
                                <CheckIcon className="h-3.5 w-3.5 text-zinc-950" aria-hidden="true" />
                              ) : (
                                <CopyIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-600">
                            Belum terekam (reset sandi untuk rekam ulang)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${
                              u.aktif ? 'bg-zinc-950 text-white' : 'border border-zinc-500 text-zinc-600'
                            }`}
                          >
                            {u.aktif ? 'Aktif' : 'Nonaktif'}
                          </span>
                          <span
                            className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-medium ${
                              u.mustChangePassword
                                ? 'border-zinc-900 bg-zinc-100 text-zinc-950'
                                : 'border-zinc-400 bg-white text-zinc-700'
                            }`}
                          >
                            {u.mustChangePassword
                              ? 'Wajib ganti saat masuk'
                              : 'Sudah diubah sendiri'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditTarget(u);
                              setEditForm({
                                nama: u.nama || '',
                                nip: u.nip || '',
                                email: u.email || '',
                              });
                              setEditError(null);
                            }}
                            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-zinc-500 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-950 hover:bg-zinc-100"
                          >
                            <Pencil1Icon className="h-3 w-3" aria-hidden="true" />
                            <span>Ubah</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResetTarget(u);
                              setResetPassword('');
                              setResetError(null);
                              setShowResetPass(false);
                            }}
                            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-zinc-500 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-950 hover:bg-zinc-100"
                          >
                            <LockClosedIcon className="h-3 w-3" aria-hidden="true" />
                            <span>Reset Sandi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (u.aktif) {
                                setDeactivateTarget(u);
                              } else {
                                void handleToggleAktif(u);
                              }
                            }}
                            title={
                              u.aktif
                                ? 'Nonaktifkan (Evaluator tidak bisa masuk)'
                                : 'Aktifkan kembali akun Evaluator'
                            }
                            className="min-h-[34px] rounded-lg border border-zinc-500 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950"
                          >
                            {u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={users.length}
            onPageChange={setPage}
            itemLabel="akun evaluator"
          />
        </div>
      )}

      {/* Modal Tambah Evaluator */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateError(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Akun Evaluator</DialogTitle>
            <DialogDescription>
              Evaluator akan login menggunakan NIP (Nomor Induk Pegawai) dan kata sandi awal ini,
              lalu wajib mengganti kata sandi pada login pertama. Tanda * berarti wajib diisi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              {createError && (
                <StatusBanner
                  tone="error"
                  message={createError}
                  onDismiss={() => setCreateError(null)}
                />
              )}

              <div>
                <label
                  htmlFor="ev-nama"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  Nama Lengkap Evaluator <span className="text-zinc-600">*</span>
                </label>
                <input
                  id="ev-nama"
                  name="nama"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
              </div>

              <div>
                <label
                  htmlFor="ev-nip"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  NIP <span className="text-zinc-600">*</span>
                </label>
                <input
                  id="ev-nip"
                  name="nip"
                  type="text"
                  autoComplete="off"
                  inputMode="numeric"
                  required
                  value={form.nip}
                  onChange={(e) => setForm({ ...form, nip: e.target.value })}
                  placeholder="Contoh: 197905012009021001"
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 font-mono text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
                <p className="mt-1 text-[11px] text-zinc-600">
                  Masukkan NIP 18 digit tanpa spasi (contoh: 197905012009021001).
                </p>
              </div>

              <div>
                <label
                  htmlFor="ev-email"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  Email (Opsional)
                </label>
                <input
                  id="ev-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Contoh: evaluator@bpsdm.jabarprov.go.id"
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
              </div>

              <div>
                <label
                  htmlFor="ev-pass"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  Kata Sandi Awal (minimal 6 karakter) <span className="text-zinc-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="ev-pass"
                    name="new-password"
                    type={showCreatePass ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Masukkan kata sandi awal"
                    className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white pl-3.5 pr-12 font-mono text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePass((prev) => !prev)}
                    aria-label={showCreatePass ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    aria-pressed={showCreatePass}
                    className="absolute right-0.5 top-1/2 inline-flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 sm:right-1 sm:h-8 sm:w-8"
                  >
                    {showCreatePass ? (
                      <EyeClosedIcon className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <EyeOpenIcon className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="min-h-[40px] rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={creating}
                className="min-h-[40px] rounded-lg bg-zinc-950 px-5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {creating ? 'Menyimpan...' : 'Buat Akun'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Reset Kata Sandi Evaluator */}
      <Dialog
        open={resetTarget !== null}
        onOpenChange={(open) => {
          if (!open && !resetting) {
            setResetTarget(null);
            setResetError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Kata Sandi Evaluator</DialogTitle>
            <DialogDescription>
              Tetapkan kata sandi sementara baru untuk {resetTarget?.nama} (NIP{' '}
              {resetTarget?.nip || '-'}). Evaluator wajib mengganti kata sandi saat login berikutnya.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReset} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              {resetError && (
                <StatusBanner
                  tone="error"
                  message={resetError}
                  onDismiss={() => setResetError(null)}
                />
              )}

              <div>
                <label
                  htmlFor="reset-pass"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  Kata Sandi Sementara Baru (minimal 6 karakter)
                </label>
                <div className="relative">
                  <input
                    id="reset-pass"
                    name="reset-new-password"
                    type={showResetPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru"
                    className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white pl-3.5 pr-12 font-mono text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPass((prev) => !prev)}
                    aria-label={showResetPass ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    aria-pressed={showResetPass}
                    className="absolute right-0.5 top-1/2 inline-flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 sm:right-1 sm:h-8 sm:w-8"
                  >
                    {showResetPass ? (
                      <EyeClosedIcon className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <EyeOpenIcon className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="min-h-[40px] rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={resetting}
                className="min-h-[40px] rounded-lg bg-zinc-950 px-5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {resetting ? 'Mereset...' : 'Reset Kata Sandi'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditError(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ubah Profil &amp; NIP Evaluator</DialogTitle>
            <DialogDescription>
              Perbarui nama tampilan, NIP / username login, atau email Evaluator {editTarget?.nama}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              {editError && (
                <StatusBanner
                  tone="error"
                  message={editError}
                  onDismiss={() => setEditError(null)}
                />
              )}
              <div>
                <label
                  htmlFor="edit-ev-nama"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  Nama Lengkap Evaluator <span className="text-zinc-600">*</span>
                </label>
                <input
                  id="edit-ev-nama"
                  type="text"
                  required
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-ev-nip"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  NIP / Username Login <span className="text-zinc-600">*</span>
                </label>
                <input
                  id="edit-ev-nip"
                  type="text"
                  required
                  value={editForm.nip}
                  onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })}
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 font-mono text-sm text-zinc-950 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-ev-email"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  Email (Opsional)
                </label>
                <input
                  id="edit-ev-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="min-h-[40px] rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="min-h-[40px] rounded-lg bg-zinc-950 px-5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => {
          if (!open && !togglingAktif) setDeactivateTarget(null);
        }}
        title="Nonaktifkan Akun Evaluator?"
        description={
          deactivateTarget
            ? `Akun ${deactivateTarget.nama} (NIP ${deactivateTarget.nip || '-'}) akan dinonaktifkan sehingga Evaluator tidak bisa masuk ke sistem sampai akun diaktifkan kembali.`
            : ''
        }
        confirmLabel="Nonaktifkan Akun"
        tone="warning"
        loading={togglingAktif}
        onConfirm={() => {
          if (deactivateTarget) {
            void handleToggleAktif(deactivateTarget);
          }
        }}
      />
    </div>
  );
}
