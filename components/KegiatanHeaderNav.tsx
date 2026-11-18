'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/cn';
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
  role: UserRole;
}

function formatDateID(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function KegiatanHeaderNav({ kegiatan, role }: KegiatanHeaderNavProps) {
  const pathname = usePathname();
  const base = `/kegiatan/${kegiatan.id}`;

  const tabs =
    role === 'SUPER_ADMIN'
      ? [
          { label: 'Ringkasan & Jawaban', href: base, exact: true },
          { label: 'Hasil Survei', href: `${base}/hasil-survei` },
          { label: 'Input Data', href: `${base}/input-data` },
          { label: 'Pembagian Tim', href: `${base}/pembagian-tim` },
          { label: 'Pantau Wawancara', href: `${base}/pantau-wawancara` },
          { label: 'Perbandingan', href: `${base}/perbandingan` },
          { label: 'Ekspose', href: `${base}/ekspose` },
        ]
      : [{ label: 'Peserta & Wawancara', href: `${base}/wawancara` }];

  return (
    <div className="no-print space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
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
      </div>

      <nav
        aria-label="Navigasi menu kegiatan"
        className="flex gap-1.5 overflow-x-auto border-b border-zinc-200 pb-2.5"
      >
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'inline-flex min-h-[36px] shrink-0 items-center rounded-lg px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-zinc-950 font-semibold text-white'
                  : 'border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:text-zinc-950'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
