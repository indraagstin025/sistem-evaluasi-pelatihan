'use client';

import React, { useEffect, useState } from 'react';
import {
  EyeClosedIcon,
  EyeOpenIcon,
  LockClosedIcon,
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
import { TablePagination } from '@/components/ui/table-pagination';

interface EvaluatorUser {
  id: string;
  nama: string;
  nip: string | null;
  email: string | null;
  mustChangePassword: boolean;
  aktif: boolean;
  timDiampu: Array<{
    id: string;
    namaTim: string;
    kegiatan: { id: string; nama: string };
  }>;
}

export default function KelolaEvaluatorPage() {
  const [users, setUsers] = useState<EvaluatorUser[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFetchError(json.error || 'Gagal memuat daftar Evaluator.');
        return;
      }
      setUsers(json.data || []);
    } catch {
      setFetchError('Koneksi bermasalah saat memuat daftar Evaluator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
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
        setCreateError(json.error || 'Gagal membuat akun Evaluator.');
        return;
      }
      setCreateOpen(false);
      setCreateError(null);
      setForm({ nama: '', nip: '', email: '', password: '' });
      setBanner({ tone: 'success', text: json.message });
      setPage(1);
      await loadUsers();
    } catch {
      setCreateError('Gagal menghubungi server.');
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
        setResetError(json.error || 'Gagal mereset kata sandi.');
        return;
      }
      setResetTarget(null);
      setResetPassword('');
      setResetError(null);
      setBanner({ tone: 'success', text: json.message });
      await loadUsers();
    } catch {
      setResetError('Koneksi gagal saat mereset kata sandi.');
    } finally {
      setResetting(false);
    }
  };

  const handleToggleAktif = async (u: EvaluatorUser) => {
    setBanner(null);
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aktif: !u.aktif }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setBanner({ tone: 'error', text: json.error || 'Gagal mengubah status akun.' });
        return;
      }
      await loadUsers();
    } catch {
      setBanner({ tone: 'error', text: 'Gagal menghubungi server.' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Topbar
        title="Kelola Akun Evaluator"
        subtitle="Buat akun Evaluator dengan username NIP dan sandi awal, serta reset kata sandi bila diperlukan"
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
            Akun Evaluator dapat dibuat di sini atau langsung di menu Pembagian Tim pada masing-masing kegiatan.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-800">
                  <th className="px-4 py-3">Nama Evaluator</th>
                  <th className="px-4 py-3">NIP (Username Login)</th>
                  <th className="px-4 py-3">Tim Diampu</th>
                  <th className="px-4 py-3">Status Sandi</th>
                  <th className="px-4 py-3">Status Akun</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {users
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/70">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-950">{u.nama}</p>
                        {u.email && <p className="text-[11px] text-zinc-600">{u.email}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-900">{u.nip || '-'}</td>
                      <td className="px-4 py-3 text-zinc-700">
                        {u.timDiampu.length > 0
                          ? u.timDiampu.map((t) => `${t.namaTim} (${t.kegiatan.nama})`).join(', ')
                          : 'Belum ditugaskan'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-medium ${
                            u.mustChangePassword
                              ? 'border-zinc-900 bg-zinc-100 text-zinc-950'
                              : 'border-zinc-300 bg-white text-zinc-700'
                          }`}
                        >
                          {u.mustChangePassword ? 'Wajib Ganti Sandi' : 'Sudah Diganti'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${
                            u.aktif ? 'bg-zinc-950 text-white' : 'border border-zinc-400 text-zinc-600'
                          }`}
                        >
                          {u.aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
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
                            onClick={() => handleToggleAktif(u)}
                            className="min-h-[34px] rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:border-zinc-950 hover:text-zinc-950"
                          >
                            {u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
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
              Evaluator akan login menggunakan NIP dan sandi awal ini, lalu wajib mengganti sandi pada login pertama.
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
                  Nama Lengkap Evaluator <span className="text-zinc-500">*</span>
                </label>
                <input
                  id="ev-nama"
                  type="text"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Contoh: Angga Muchlis Al Rachmat"
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="ev-nip"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  NIP (Username Login) <span className="text-zinc-500">*</span>
                </label>
                <input
                  id="ev-nip"
                  type="text"
                  required
                  value={form.nip}
                  onChange={(e) => setForm({ ...form, nip: e.target.value })}
                  placeholder="Contoh: 197905012009021001"
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 font-mono text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-zinc-500">
                  Masukkan NIP 18 digit tanpa spasi.
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
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Opsional"
                  className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="ev-pass"
                  className="mb-1.5 block text-xs font-semibold text-zinc-900"
                >
                  Kata Sandi Awal (min. 6 karakter) <span className="text-zinc-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="ev-pass"
                    type={showCreatePass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Sandi sementara"
                    className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white pl-3.5 pr-11 font-mono text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePass((prev) => !prev)}
                    aria-label={showCreatePass ? 'Sembunyikan sandi' : 'Lihat sandi'}
                    className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
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

      {/* Modal Reset Sandi Evaluator */}
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
              Tetapkan sandi sementara baru untuk {resetTarget?.nama} (NIP {resetTarget?.nip}). Evaluator akan diwajibkan mengganti sandi saat login berikutnya.
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
                  Sandi Sementara Baru (min. 6 karakter)
                </label>
                <div className="relative">
                  <input
                    id="reset-pass"
                    type={showResetPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Masukkan sandi baru"
                    className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white pl-3.5 pr-11 font-mono text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPass((prev) => !prev)}
                    aria-label={showResetPass ? 'Sembunyikan sandi' : 'Lihat sandi'}
                    className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
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
    </div>
  );
}
