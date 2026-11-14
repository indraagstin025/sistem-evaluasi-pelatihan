'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  BarChartIcon,
  CalendarIcon,
  Cross2Icon,
  DashboardIcon,
  HamburgerMenuIcon,
  Pencil2Icon,
  PersonIcon,
  PieChartIcon,
} from '@radix-ui/react-icons';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: DashboardIcon },
  { name: 'Daftar Peserta', href: '/peserta', icon: PersonIcon },
  { name: 'Input Nilai', href: '/input-nilai', icon: Pencil2Icon },
  { name: 'Perbandingan', href: '/perbandingan', icon: BarChartIcon },
  { name: 'Ekspose', href: '/ekspose', icon: PieChartIcon },
];

function BrandMark() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2.5 rounded-lg py-1 pr-2 text-left transition hover:opacity-85"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 shrink-0"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="#09090B" />
        <rect x="8.5" y="16" width="3.5" height="8" rx="0.75" fill="#A1A1AA" />
        <rect x="14.25" y="11" width="3.5" height="13" rx="0.75" fill="#E4E4E7" />
        <rect x="20" y="7" width="3.5" height="17" rx="0.75" fill="#FFFFFF" />
      </svg>
      <div className="leading-tight">
        <span className="block text-sm font-semibold tracking-tight text-zinc-950">
          BPSDM Jabar
        </span>
        <span className="block text-[11px] font-normal text-zinc-600">
          Evaluasi Pasca Pelatihan
        </span>
      </div>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isRouteActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <header className="no-print sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <BrandMark />

          <Separator
            orientation="vertical"
            className="hidden h-6 bg-zinc-200 lg:block"
          />

          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative inline-flex h-16 items-center gap-2 whitespace-nowrap px-3.5 text-xs transition-colors',
                    isActive
                      ? 'font-semibold text-zinc-950 after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:bg-zinc-950'
                      : 'font-normal text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      isActive ? 'text-zinc-950' : 'text-zinc-600'
                    )}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[11px] font-medium text-zinc-700 sm:inline-flex">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-zinc-700" aria-hidden="true" />
            <span>PKP Angkatan VII · 2023</span>
          </div>

          <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogPrimitive.Trigger asChild>
              <button
                type="button"
                aria-label="Buka menu navigasi"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-950 transition hover:bg-zinc-100 lg:hidden"
              >
                <HamburgerMenuIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </DialogPrimitive.Trigger>

            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="no-print fixed inset-0 z-50 bg-zinc-950/45 lg:hidden" />
              <DialogPrimitive.Content
                aria-describedby="mobile-nav-desc"
                className="no-print fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-200 bg-white focus:outline-none lg:hidden"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                  <DialogPrimitive.Title className="sr-only">
                    Menu Navigasi Utama
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description id="mobile-nav-desc" className="sr-only">
                    Daftar halaman evaluasi pasca pelatihan BPSDM Jawa Barat.
                  </DialogPrimitive.Description>
                  <div className="leading-tight">
                    <span className="block text-sm font-semibold tracking-tight text-zinc-950">
                      BPSDM Jabar
                    </span>
                    <span className="block text-[11px] font-normal text-zinc-600">
                      PKP Angkatan VII · 2023
                    </span>
                  </div>
                  <DialogPrimitive.Close
                    aria-label="Tutup menu navigasi"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                  >
                    <Cross2Icon className="h-4 w-4" aria-hidden="true" />
                  </DialogPrimitive.Close>
                </div>

                <nav aria-label="Menu seluler" className="flex-1 space-y-1 p-3">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = isRouteActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex min-h-[44px] items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors',
                          isActive
                            ? 'bg-zinc-950 font-medium text-white'
                            : 'font-normal text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="border-t border-zinc-200 px-5 py-4">
                  <p className="text-xs font-medium text-zinc-800">
                    BPSDM Prov. Jawa Barat
                  </p>
                  <p className="mt-0.5 text-[11px] font-normal text-zinc-600">
                    Instrumen Survei &amp; Wawancara PKP
                  </p>
                </div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </div>
      </div>
    </header>
  );
}
