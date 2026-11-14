'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from '@radix-ui/react-icons';

interface WarningBannerProps {
  daftarKosong?: any[];
  totalPeserta?: number;
}

export default function WarningBanner({
  daftarKosong,
  totalPeserta = 0,
}: WarningBannerProps) {
  const count = daftarKosong?.length ?? 0;
  const firstP = daftarKosong?.[0];

  if (totalPeserta === 0) {
    return (
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-zinc-300 bg-zinc-50 px-5 py-3.5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-2.5 text-xs sm:items-center sm:text-sm">
          <InfoCircledIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-800 sm:mt-0" aria-hidden="true" />
          <p className="font-normal text-zinc-700">
            <span className="font-semibold text-zinc-950">Belum ada data peserta.</span>{' '}
            Mulai dengan mengimpor file Excel hasil survei atau wawancara.
          </p>
        </div>

        <Link
          href="/peserta"
          className="inline-flex shrink-0 items-center justify-center self-start rounded-lg border border-zinc-500 bg-white px-3.5 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100 sm:self-auto"
        >
          Buka Daftar Peserta
        </Link>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-zinc-300 bg-white px-5 py-3.5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-2.5 text-xs sm:items-center sm:text-sm">
          <CheckCircledIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950 sm:mt-0" aria-hidden="true" />
          <p className="font-normal text-zinc-700">
            <span className="font-semibold text-zinc-950">Data sudah lengkap.</span>{' '}
            Semua peserta memiliki nilai survei dan wawancara yang tervalidasi.
          </p>
        </div>

        <Link
          href="/ekspose"
          className="inline-flex shrink-0 items-center justify-center self-start rounded-lg bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 sm:self-auto"
        >
          Lihat Slide Ekspose
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between gap-3 rounded-2xl border border-zinc-900 bg-zinc-100 px-5 py-3.5 sm:flex-row sm:items-center">
      <div className="flex items-start gap-2.5 text-xs sm:items-center sm:text-sm">
        <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950 sm:mt-0" aria-hidden="true" />
        <p className="font-normal text-zinc-800">
          <span className="font-semibold text-zinc-950">Perlu dilengkapi:</span>{' '}
          {count} peserta belum memiliki nilai wawancara{' '}
          {firstP ? `(contoh: ${firstP.nama})` : ''}. Nilai kosong dicatat sebagai KOSONG, bukan nol.
        </p>
      </div>

      <Link
        href={firstP?.id ? `/peserta/${firstP.id}` : '/peserta'}
        className="inline-flex shrink-0 items-center justify-center self-start rounded-lg bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 sm:self-auto"
      >
        Isi Nilai Sekarang
      </Link>
    </div>
  );
}
