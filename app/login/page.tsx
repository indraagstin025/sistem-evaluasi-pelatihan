'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EnterIcon, ExternalLinkIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { StatusBanner } from '@/components/ui/status-banner';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error || 'Gagal masuk. Periksa kembali kredensial Anda.');
        return;
      }

      if (json.user?.mustChangePassword) {
        router.push('/ganti-sandi');
      } else {
        router.push('/kegiatan');
      }
      router.refresh();
    } catch {
      setErrorMsg('Koneksi bermasalah saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-11rem)] max-w-md flex-col justify-center py-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-7 sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-medium text-zinc-600">
            BPSDM Provinsi Jawa Barat
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
            Masuk ke Sistem Evaluasi
          </h1>
          <p className="mt-1.5 text-sm font-normal text-zinc-600">
            Gunakan email untuk Super Admin atau NIP untuk akun Evaluator.
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
              htmlFor="login-identifier"
              className="mb-1.5 block text-xs font-medium text-zinc-900"
            >
              Email atau NIP (Username)
            </label>
            <input
              id="login-identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Contoh: admin@bpsdm.jabarprov.go.id atau NIP"
              className="w-full rounded-lg border border-zinc-500 bg-white px-3.5 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-xs font-medium text-zinc-900"
            >
              Kata Sandi
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full rounded-lg border border-zinc-500 bg-white px-3.5 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <EnterIcon className="h-4 w-4" aria-hidden="true" />
            <span>{loading ? 'Memverifikasi...' : 'Masuk'}</span>
          </button>
        </form>

        <div className="mt-6 border-t border-zinc-200 pt-5 text-xs text-zinc-600">
          <div className="flex items-start gap-2">
            <LockClosedIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700" aria-hidden="true" />
            <p>
              Lupa kata sandi Evaluator? Hubungi Super Admin untuk melakukan reset kata sandi akun Anda.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
            <p className="font-medium text-zinc-950">Peserta / Alumni Pelatihan?</p>
            <p className="mt-0.5 text-zinc-600">
              Unggah Inovasi/Proper melalui Link Public tanpa login.
            </p>
            <Link
              href="/unggah-inovasi"
              className="mt-2 inline-flex items-center gap-1 font-semibold text-zinc-950 underline underline-offset-4 hover:text-zinc-700"
            >
              <span>Buka Link Public Unggah Inovasi/Proper</span>
              <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
