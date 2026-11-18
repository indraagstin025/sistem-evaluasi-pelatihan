'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import type { UserRole } from '@/lib/session-token';

interface KegiatanHeaderNavProps {
  kegiatan: {
    id: string;
    nama: string;
    jenisPelatihan: string;
    penyelenggara: string;
    lokasi: string;
    tanggalMulai: string;
    tanggalSelesai: string;
  };
  role?: UserRole;
  children?: React.ReactNode;
}

function formatDateID(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function KegiatanHeaderNav({
  kegiatan,
  children,
}: KegiatanHeaderNavProps) {
  return (
    <div className="space-y-6">
      {/* Header Konteks Kegiatan */}
      <div className="no-print border-b border-zinc-200 pb-4">
        <Link
          href="/kegiatan"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 transition hover:text-zinc-950"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Kembali ke Daftar Kegiatan</span>
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded border border-zinc-500 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-950">
            {kegiatan.jenisPelatihan}
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
            {kegiatan.nama}
          </h1>
        </div>
        <p className="mt-1 text-xs font-normal text-zinc-600">
          {kegiatan.penyelenggara} · {kegiatan.lokasi} · {formatDateID(kegiatan.tanggalMulai)} s.d.{' '}
          {formatDateID(kegiatan.tanggalSelesai)}
        </p>
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
