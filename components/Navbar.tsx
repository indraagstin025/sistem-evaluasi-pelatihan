'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  CalendarIcon,
  Cross2Icon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
  ExitIcon,
  ExternalLinkIcon,
  HamburgerMenuIcon,
  PersonIcon,
} from '@radix-ui/react-icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import type { SessionUser } from '@/lib/auth';

interface NavbarProps {
  user: SessionUser | null;
  children?: React.ReactNode;
}

function BrandLogoSvg() {
  return (
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
  );
}

function BrandMark({
  nonInteractive = false,
  compact = false,
}: {
  nonInteractive?: boolean;
  compact?: boolean;
}) {
  const inner = (
    <>
      <BrandLogoSvg />
      {!compact && (
        <div className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold tracking-tight text-zinc-950">
            BPSDM Jabar
          </span>
          <span className="block truncate text-[11px] font-normal text-zinc-600">
            Evaluasi Pasca Pelatihan
          </span>
        </div>
      )}
    </>
  );

  if (nonInteractive) {
    return (
      <div className="flex shrink-0 items-center gap-2.5 py-1 text-left">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href="/"
      className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-lg py-1 text-left transition hover:opacity-85"
    >
      {inner}
    </Link>
  );
}

export default function Navbar({ user, children }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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
      <div className="min-h-screen">
        <header className="no-print sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <BrandMark />
            {!user && (
              <Link
                href="/unggah-inovasi"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
              >
                Link Public
                <ExternalLinkIcon className="h-3.5 w-3.5 text-zinc-700" aria-hidden="true" />
              </Link>
            )}
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:p-0"
        >
          {children}
        </main>
      </div>
    );
  }

  if (isPublicUpload || !user) {
    return (
      <div className="min-h-screen">
        <header className="no-print sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <BrandMark nonInteractive={isPublicUpload} />
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:p-0"
        >
          {children}
        </main>
      </div>
    );
  }

  const navItems: Array<{
    name: string;
    href: string;
    icon: typeof CalendarIcon;
    externalTab?: boolean;
  }> =
    user.role === 'SUPER_ADMIN'
      ? [
          { name: 'Kegiatan', href: '/kegiatan', icon: CalendarIcon },
          { name: 'Kelola Evaluator', href: '/pengguna', icon: PersonIcon },
          {
            name: 'Link Public',
            href: '/unggah-inovasi',
            icon: ExternalLinkIcon,
            externalTab: true,
          },
        ]
      : [{ name: 'Kegiatan Saya', href: '/kegiatan', icon: CalendarIcon }];

  const isNavActive = (href: string, externalTab?: boolean) => {
    if (externalTab) return false;
    if (href === '/kegiatan') {
      return pathname === '/kegiatan' || pathname.startsWith('/kegiatan/');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar Utama Desktop */}
      <aside
        aria-label="Sidebar navigasi utama"
        className={cn(
          'no-print hidden border-r border-zinc-200 bg-white transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0 lg:flex-col',
          collapsed ? 'lg:w-[72px]' : 'lg:w-52 xl:w-56'
        )}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-zinc-200',
            collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-4'
          )}
        >
          {!collapsed && <BrandMark />}

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Perluas sidebar utama' : 'Ciutkan sidebar utama'}
            title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
          >
            {collapsed ? (
              <DoubleArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <DoubleArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <nav aria-label="Menu utama" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {!collapsed && (
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold text-zinc-500">
              Menu Utama
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.href, item.externalTab);
            const linkNode = (
              <Link
                key={item.href}
                href={item.href}
                target={item.externalTab ? '_blank' : undefined}
                rel={item.externalTab ? 'noopener noreferrer' : undefined}
                aria-label={item.name}
                className={cn(
                  'flex min-h-[42px] items-center rounded-xl transition-colors',
                  collapsed ? 'justify-center px-0' : 'gap-2.5 px-3 py-2 text-xs',
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
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              );
            }
            return linkNode;
          })}
        </nav>

        <div className="shrink-0 border-t border-zinc-200 p-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  aria-label="Keluar"
                  className="flex min-h-[40px] w-full items-center justify-center rounded-xl border border-zinc-400 bg-white text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-50"
                >
                  <ExitIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {user.nama} ({loggingOut ? 'Keluar...' : 'Keluar'})
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="space-y-2.5">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="truncate text-xs font-semibold text-zinc-950">
                  {user.nama}
                </p>
                <p className="truncate text-[11px] font-normal text-zinc-600">
                  {user.role === 'SUPER_ADMIN'
                    ? 'Super Admin'
                    : `Evaluator · ${user.nip || '-'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                <ExitIcon className="h-3.5 w-3.5 text-zinc-700" aria-hidden="true" />
                <span>{loggingOut ? 'Keluar...' : 'Keluar'}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Kolom Kanan: Topbar Mobile + Konten Utama */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur lg:hidden">
          <BrandMark />

          <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogPrimitive.Trigger asChild>
              <button
                type="button"
                aria-label="Buka menu navigasi"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-zinc-400 bg-white px-3 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-100"
              >
                <HamburgerMenuIcon className="h-4 w-4" aria-hidden="true" />
                <span>Menu</span>
              </button>
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/45 backdrop-blur-[1px]" />
              <DialogPrimitive.Content
                aria-describedby={undefined}
                className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-zinc-200 bg-white focus:outline-none"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                  <div className="min-w-0 pr-2">
                    <DialogPrimitive.Title className="truncate text-sm font-semibold text-zinc-950">
                      {user.nama}
                    </DialogPrimitive.Title>
                    <p className="truncate text-[11px] font-normal text-zinc-600">
                      {user.role === 'SUPER_ADMIN'
                        ? 'Super Admin'
                        : `Evaluator · ${user.nip || '-'}`}
                    </p>
                  </div>
                  <DialogPrimitive.Close asChild>
                    <button
                      type="button"
                      aria-label="Tutup menu navigasi"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100"
                    >
                      <Cross2Icon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </DialogPrimitive.Close>
                </div>

                <nav aria-label="Menu navigasi mobile" className="flex-1 space-y-1 p-4">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isNavActive(item.href, item.externalTab);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        target={item.externalTab ? '_blank' : undefined}
                        rel={item.externalTab ? 'noopener noreferrer' : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors',
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
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-500 bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-100"
                  >
                    <ExitIcon className="h-4 w-4" aria-hidden="true" />
                    <span>{loggingOut ? 'Keluar...' : 'Keluar Akun'}</span>
                  </button>
                </div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </header>

        <main
          id="main-content"
          className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-6 print:max-w-none print:p-0"
        >
          <div className="mx-auto w-full max-w-[1380px] print:max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
