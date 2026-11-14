'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Database } from 'lucide-react';

interface WarningBannerProps {
  daftarKosong?: any[];
  totalPeserta?: number;
}

export default function WarningBanner({ daftarKosong, totalPeserta = 0 }: WarningBannerProps) {
  const count = daftarKosong?.length ?? 0;
  const firstP = daftarKosong?.[0];

  if (totalPeserta === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 shrink-0">
            <Database className="w-4 h-4 text-slate-600" />
            <span className="font-bold text-slate-800">Belum Ada Data</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-700 text-xs sm:text-sm">
            Belum ada data peserta. Mulai dengan mengimpor file Excel.
          </span>
        </div>

        <Link
          href="/peserta"
          className="self-start sm:self-auto inline-flex items-center justify-center bg-white border border-slate-200 text-slate-800 text-xs font-bold px-3.5 py-1.5 rounded-xl hover:bg-slate-100 transition shrink-0"
        >
          Lihat Daftar Peserta →
        </Link>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-emerald-800">Data Sudah Lengkap</span>
          </div>
          <span className="text-emerald-300 hidden sm:inline">|</span>
          <span className="text-emerald-900 text-xs sm:text-sm">
            Semua peserta sudah punya data survei dan wawancara yang lengkap.
          </span>
        </div>

        <Link
          href="/ekspose"
          className="self-start sm:self-auto inline-flex items-center justify-center bg-white border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-xl hover:bg-emerald-100/60 transition shrink-0"
        >
          Lihat Ekspose →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/80 border border-amber-200 rounded-2xl px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-2.5 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="font-bold text-amber-800">Perlu Diperhatikan</span>
        </div>
        <span className="text-amber-300 hidden sm:inline">|</span>
        <span className="text-amber-950 text-xs sm:text-sm">
          {count} peserta belum punya nilai wawancara{' '}
          {firstP ? `(${firstP.nama})` : ''}. Nilai yang kosong tetap ditulis KOSONG, bukan dianggap nol.
        </span>
      </div>

      <Link
        href={firstP?.id ? `/peserta/${firstP.id}` : '/peserta'}
        className="self-start sm:self-auto inline-flex items-center justify-center bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold px-3.5 py-1.5 rounded-xl hover:bg-amber-200 transition shrink-0"
      >
        Isi Nilainya Sekarang →
      </Link>
    </div>
  );
}
