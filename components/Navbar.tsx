'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  CalendarIcon,
  Cross2Icon,
  ExitIcon,
  ExternalLinkIcon,
  HamburgerMenuIcon,
  PersonIcon,
} from '@radix-ui/react-icons';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
import type { SessionUser } from '@/lib/auth';

interface NavbarProps {
  user: SessionUser | null;
}

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

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isPublicUpload =
    pathname.startsWith('/unggah-inovasi') || pathname.startsWith('/pasca-pelatihan');
  const isAuthScreen = pathname === '/login' || pathname === '/ganti-sandi';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setMobileOpen(false);
      setLoggingOut(false);
      router.push('/login');
      router.refresh();
    }
  };

  if (isAuthScreen) {
    return (
      <header className="no-print sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandMark />
          {!user && (
            <Link
              href="/unggah-inovasi"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
            >
              Link Public Proper
              <ExternalLinkIcon className="h-3.5 w-3.5 text-zinc-700" aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>
    );
  }

  if (isPublicUpload) {
    return (
      <header className="no-print sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-3">
            <span className="hidden rounded-md border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 sm:inline-flex">
              Link Public · Unggah Inovasi / Proper
            </span>
            <Link
              href={user ? '/kegiatan' : '/login'}
              className="inline-flex min-h-[36px] items-center rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
            >
              {user ? 'Kembali ke Panel' : 'Masuk Petugas'}
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const navItems =
    user?.role === 'SUPER_ADMIN'
      ? [
          { name: 'Kegiatan', href: '/kegiatan', icon: CalendarIcon },
          { name: 'Kelola Evaluator', href: '/pengguna', icon: PersonIcon },
          { name: 'Link Public Proper', href: '/unggah-inovasi', icon: ExternalLinkIcon },
        ]
      : user
        ? [{ name: 'Kegiatan Saya', href: '/kegiatan', icon: CalendarIcon }]
        : [];

  return (
    <header className="no-print sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <BrandMark />

          {navItems.length > 0 && (
            <>
              <Separator orientation="vertical" className="hidden h-6 bg-zinc-200 lg:block" />
              <nav aria-label="Menu utama" className="hidden items-center gap-1 lg:flex">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === '/kegiatan'
                      ? pathname === '/kegiatan' || pathname.startsWith('/kegiatan/')
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'relative inline-flex h-16 items-center gap-2 px-3 text-sm transition-colors',
                        active
                          ? 'font-semibold text-zinc-950'
                          : 'font-medium text-zinc-600 hover:text-zinc-950'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          active ? 'text-zinc-950' : 'text-zinc-500'
                        )}
                        aria-hidden="true"
                      />
                      <span>{item.name}</span>
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-3 bottom-0 h-[2px] bg-zinc-950"
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {user && (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="text-right leading-tight">
                  <p className="max-w-[180px] truncate text-xs font-semibold text-zinc-950">
                    {user.nama}
                  </p>
                  <p className="text-[11px] font-normal text-zinc-600">
                    {user.role === 'SUPER_ADMIN' ? 'Super Admin' : `Evaluator · ${user.nip || '-'}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-50"
                >
                  <ExitIcon className="h-3.5 w-3.5 text-zinc-700" aria-hidden="true" />
                  <span>Keluar</span>
                </button>
              </div>

              <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
                <DialogPrimitive.Trigger asChild>
                  <button
                    type="button"
                    aria-label="Buka menu navigasi"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-400 bg-white text-zinc-950 transition hover:bg-zinc-100 lg:hidden"
                  >
                    <HamburgerMenuIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </DialogPrimitive.Trigger>
                <DialogPrimitive.Portal>
                  <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/45 backdrop-blur-[1px]" />
                  <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-zinc-200 bg-white focus:outline-none"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                      <div>
                        <DialogPrimitive.Title className="text-sm font-semibold text-zinc-950">
                          {user.nama}
                        </DialogPrimitive.Title>
                        <p className="text-[11px] font-normal text-zinc-600">
                          {user.role === 'SUPER_ADMIN' ? 'Super Admin' : `Evaluator · ${user.nip || '-'}`}
                        </p>
                      </div>
                      <DialogPrimitive.Close asChild>
                        <button
                          type="button"
                          aria-label="Tutup menu navigasi"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100"
                        >
                          <Cross2Icon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </DialogPrimitive.Close>
                    </div>

                    <nav aria-label="Menu navigasi mobile" className="flex-1 space-y-1 p-4">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                          item.href === '/kegiatan'
                            ? pathname === '/kegiatan' || pathname.startsWith('/kegiatan/')
                            : pathname.startsWith(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              'flex min-h-[44px] items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors',
                              active
                                ? 'bg-zinc-950 font-semibold text-white'
                                : 'font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
                            )}
                          >
                            <Icon
                              className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-zinc-600')}
                              aria-hidden="true"
                            />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </nav>

                    <div className="border-t border-zinc-200 p-4">
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-zinc-500 bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-100"
                      >
                        <ExitIcon className="h-4 w-4" aria-hidden="true" />
                        <span>{loggingOut ? 'Keluar...' : 'Keluar Akun'}</span>
                      </button>
                    </div>
                  </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
              </DialogPrimitive.Root>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
