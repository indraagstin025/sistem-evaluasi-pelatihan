'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeftIcon,
  BarChartIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
  DashboardIcon,
  EyeOpenIcon,
  FileTextIcon,
  LayersIcon,
  MixIcon,
  UploadIcon,
} from '@radix-ui/react-icons';
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
  role,
  children,
}: KegiatanHeaderNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const base = `/kegiatan/${kegiatan.id}`;

  const menuItems: Array<{
    label: string;
    href: string;
    icon: typeof DashboardIcon;
    exact?: boolean;
  }> =
    role === 'SUPER_ADMIN'
      ? [
          { label: 'Ringkasan & Jawaban', href: base, exact: true, icon: DashboardIcon },
          { label: 'Hasil Survei', href: `${base}/hasil-survei`, icon: BarChartIcon },
          { label: 'Input Data', href: `${base}/input-data`, icon: UploadIcon },
          { label: 'Pembagian Tim', href: `${base}/pembagian-tim`, icon: LayersIcon },
          { label: 'Peserta & Wawancara', href: `${base}/wawancara`, icon: ClipboardIcon },
          { label: 'Pantau Wawancara', href: `${base}/pantau-wawancara`, icon: EyeOpenIcon },
          { label: 'Perbandingan', href: `${base}/perbandingan`, icon: MixIcon },
          { label: 'Ekspose', href: `${base}/ekspose`, icon: FileTextIcon },
        ]
      : [{ label: 'Peserta & Wawancara', href: `${base}/wawancara`, icon: ClipboardIcon }];

  const isMenuActive = (item: { href: string; exact?: boolean }) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const activeItem = menuItems.find(isMenuActive) || menuItems[0];

  return (
    <div className="space-y-5">
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

      {/* Switcher Menu Kegiatan Mobile / Tablet (< lg) */}
      <div className="no-print lg:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-controls="kegiatan-mobile-menu"
          className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-left text-xs font-semibold text-zinc-950 transition hover:bg-zinc-50"
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-zinc-500 font-medium">Menu Kegiatan:</span>
            <span className="truncate">{activeItem?.label}</span>
          </span>
          {mobileMenuOpen ? (
            <ChevronUpIcon className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden="true" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden="true" />
          )}
        </button>

        {mobileMenuOpen && (
          <nav
            id="kegiatan-mobile-menu"
            aria-label="Navigasi menu kegiatan mobile"
            className="mt-2 space-y-1 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isMenuActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex min-h-[42px] items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors',
                    active
                      ? 'bg-zinc-950 font-semibold text-white'
                      : 'font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
                  )}
                >
                  <Icon
                    className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-zinc-600')}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Layout Workspace Kegiatan: Sidebar Kiri (Desktop) + Konten Utama */}
      <div className="lg:flex lg:items-start lg:gap-5">
        <aside
          aria-label="Sidebar menu kegiatan"
          className="no-print hidden lg:sticky lg:top-6 lg:block lg:w-52 xl:w-56 lg:shrink-0"
        >
          <nav
            aria-label="Navigasi menu kegiatan"
            className="rounded-2xl border border-zinc-200 bg-white p-2.5"
          >
            <p className="px-2.5 pb-2 pt-1 text-[11px] font-semibold text-zinc-500">
              Menu Kegiatan
            </p>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isMenuActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-[40px] items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors',
                      active
                        ? 'bg-zinc-950 font-semibold text-white'
                        : 'font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'text-white' : 'text-zinc-600'
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
