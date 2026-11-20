'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, EyeClosedIcon, EyeOpenIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { StatusBanner } from '@/components/ui/status-banner';

export default function GantiSandiPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal 6 karakter. Buat kata sandi yang lebih panjang.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(
        'Kata sandi yang diulang tidak sama dengan kata sandi baru. Ketik ulang dengan sama persis.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(
          json.error ||
            'Gagal menyimpan kata sandi baru. Periksa kata sandi saat ini, lalu coba lagi.'
        );
        return;
      }

      router.push('/kegiatan');
      router.refresh();
    } catch {
      setErrorMsg('Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-11rem)] max-w-md flex-col justify-center py-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-7 sm:p-8">
        <div className="mb-6">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-zinc-500 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-950">
            <LockClosedIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Wajib Ganti Kata Sandi</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Ganti Kata Sandi
          </h1>
          <p className="mt-1.5 text-sm font-normal text-zinc-600">
            Anda menggunakan kata sandi awal atau kata sandi sementara dari Super Admin. Ganti kata
            sandi sebelum melanjutkan.
          </p>
        </div>

        {errorMsg && (
          <StatusBanner
            tone="error"
            message={errorMsg}
            onDismiss={() => setErrorMsg(null)}
            className="mb-5"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="sandi-lama"
              className="mb-1.5 block text-xs font-medium text-zinc-900"
            >
              Kata Sandi Saat Ini
            </label>
            <div className="relative">
              <input
                id="sandi-lama"
                name="current-password"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                enterKeyHint="next"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi awal / sementara"
                className="w-full rounded-lg border border-zinc-500 bg-white py-2.5 pl-3.5 pr-12 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                aria-label={showCurrent ? 'Sembunyikan kata sandi saat ini' : 'Lihat kata sandi saat ini'}
                aria-pressed={showCurrent}
                className="absolute right-0.5 top-1/2 inline-flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 sm:right-1 sm:h-9 sm:w-9"
              >
                {showCurrent ? (
                  <EyeClosedIcon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <EyeOpenIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="sandi-baru"
              className="mb-1.5 block text-xs font-medium text-zinc-900"
            >
              Kata Sandi Baru (minimal 6 karakter)
            </label>
            <div className="relative">
              <input
                id="sandi-baru"
                name="new-password"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                enterKeyHint="next"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan kata sandi baru"
                className="w-full rounded-lg border border-zinc-500 bg-white py-2.5 pl-3.5 pr-12 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                aria-label={showNew ? 'Sembunyikan kata sandi baru' : 'Lihat kata sandi baru'}
                aria-pressed={showNew}
                className="absolute right-0.5 top-1/2 inline-flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 sm:right-1 sm:h-9 sm:w-9"
              >
                {showNew ? (
                  <EyeClosedIcon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <EyeOpenIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="sandi-konfirmasi"
              className="mb-1.5 block text-xs font-medium text-zinc-900"
            >
              Ulangi Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                id="sandi-konfirmasi"
                name="confirm-new-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                enterKeyHint="done"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                className="w-full rounded-lg border border-zinc-500 bg-white py-2.5 pl-3.5 pr-12 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? 'Sembunyikan ulangi kata sandi' : 'Lihat ulangi kata sandi'}
                aria-pressed={showConfirm}
                className="absolute right-0.5 top-1/2 inline-flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 sm:right-1 sm:h-9 sm:w-9"
              >
                {showConfirm ? (
                  <EyeClosedIcon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <EyeOpenIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4" aria-hidden="true" />
            <span>{loading ? 'Menyimpan kata sandi baru...' : 'Simpan Kata Sandi Baru'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
