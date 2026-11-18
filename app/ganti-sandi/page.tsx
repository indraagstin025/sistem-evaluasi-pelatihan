'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { StatusBanner } from '@/components/ui/status-banner';

export default function GantiSandiPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
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
        setErrorMsg(json.error || 'Gagal memperbarui kata sandi.');
        return;
      }

      router.push('/kegiatan');
      router.refresh();
    } catch {
      setErrorMsg('Koneksi bermasalah saat menyimpan kata sandi baru.');
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
            <span>Pembaruan Kata Sandi Wajib</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Buat Kata Sandi Baru
          </h1>
          <p className="mt-1.5 text-sm font-normal text-zinc-600">
            Anda menggunakan sandi awal atau sandi sementara dari Super Admin. Ganti kata sandi sebelum melanjutkan.
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
            <input
              id="sandi-lama"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Sandi awal / sementara"
              className="w-full rounded-lg border border-zinc-500 bg-white px-3.5 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="sandi-baru"
              className="mb-1.5 block text-xs font-medium text-zinc-900"
            >
              Kata Sandi Baru (Minimal 6 Karakter)
            </label>
            <input
              id="sandi-baru"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan sandi baru"
              className="w-full rounded-lg border border-zinc-500 bg-white px-3.5 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="sandi-konfirmasi"
              className="mb-1.5 block text-xs font-medium text-zinc-900"
            >
              Ulangi Kata Sandi Baru
            </label>
            <input
              id="sandi-konfirmasi"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang sandi baru"
              className="w-full rounded-lg border border-zinc-500 bg-white px-3.5 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4" aria-hidden="true" />
            <span>{loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
