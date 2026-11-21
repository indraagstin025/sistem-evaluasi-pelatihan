'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import type { UserRole } from '@/lib/session-token';
import { getKegiatanWorkflowSteps } from '@/lib/kegiatan-workflow';

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
  role = 'SUPER_ADMIN',
  children,
}: KegiatanHeaderNavProps) {
  const pathname = usePathname();
  const steps = getKegiatanWorkflowSteps(kegiatan.id, role);

  const activeStep =
    steps.find((s) =>
      s.exact
        ? pathname === s.href
        : pathname === s.href || pathname.startsWith(`${s.href}/`)
    ) ?? null;

  return (
    <div className="space-y-6">
      {/* Header Konteks Kegiatan */}
      <div className="no-print space-y-3 border-b border-zinc-200 pb-4">
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
            {kegiatan.penyelenggara} · {kegiatan.lokasi} · {formatDateID(kegiatan.tanggalMulai)} sampai dengan{' '}
            {formatDateID(kegiatan.tanggalSelesai)}
          </p>
        </div>

        {activeStep?.hint && (
          <div className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-700">
            <InfoCircledIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden="true" />
            <span>{activeStep.hint}</span>
          </div>
        )}
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
