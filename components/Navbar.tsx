'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  BarChartIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
  Cross2Icon,
  DashboardIcon,
  DrawingPinFilledIcon,
  DrawingPinIcon,
  ExitIcon,
  ExternalLinkIcon,
  EyeOpenIcon,
  FileTextIcon,
  HamburgerMenuIcon,
  LayersIcon,
  MixIcon,
  PersonIcon,
  UploadIcon,
} from '@radix-ui/react-icons';
import { cn } from '@/lib/cn';
import type { SessionUser } from '@/lib/auth';

interface NavbarProps {
  user: SessionUser | null;
  children?: React.ReactNode;
}

interface SubNavItem {
  label: string;
  href: string;
  icon: typeof DashboardIcon;
  exact?: boolean;
}

function getKegiatanSubItems(
  kegiatanId: string,
  role: SessionUser['role']
): SubNavItem[] {
  const base = `/kegiatan/${kegiatanId}`;
  if (role === 'SUPER_ADMIN') {
    return [
      { label: 'Ringkasan & Jawaban', href: base, exact: true, icon: DashboardIcon },
      { label: 'Hasil Survei', href: `${base}/hasil-survei`, icon: BarChartIcon },
      { label: 'Input Data', href: `${base}/input-data`, icon: UploadIcon },
      { label: 'Pembagian Tim', href: `${base}/pembagian-tim`, icon: LayersIcon },
      { label: 'Peserta & Wawancara', href: `${base}/wawancara`, icon: ClipboardIcon },
      { label: 'Pantau Wawancara', href: `${base}/pantau-wawancara`, icon: EyeOpenIcon },
      { label: 'Perbandingan', href: `${base}/perbandingan`, icon: MixIcon },
      { label: 'Ekspose', href: `${base}/ekspose`, icon: FileTextIcon },
    ];
  }
  return [{ label: 'Peserta & Wawancara', href: `${base}/wawancara`, icon: ClipboardIcon }];
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
}: {
  nonInteractive?: boolean;
}) {
  const inner = (
    <>
      <BrandLogoSvg />
      <div className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold tracking-tight text-zinc-950">
          BPSDM Jabar
        </span>
        <span className="block truncate text-[11px] font-normal text-zinc-600">
          Evaluasi Pasca Pelatihan
        </span>
      </div>
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

function KegiatanDropdownList({
  items,
  pathname,
  onNavigate,
  id,
}: {
  items: SubNavItem[];
  pathname: string;
  onNavigate?: () => void;
  id: string;
}) {
  return (
    <div
      id={id}
      aria-label="Submenu menu kegiatan"
      className="ml-3.5 mt-1 space-y-0.5 border-l border-zinc-200 pl-2.5"
    >
      {items.map((sub) => {
        const SubIcon = sub.icon;
        const subActive = sub.exact
          ? pathname === sub.href
          : pathname === sub.href || pathname.startsWith(`${sub.href}/`);

        return (
          <Link
            key={sub.href}
            href={sub.href}
            onClick={onNavigate}
            aria-current={subActive ? 'page' : undefined}
            className={cn(
              'flex min-h-[36px] items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors',
              subActive
                ? 'bg-zinc-950 font-semibold text-white'
                : 'font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
            )}
          >
            <SubIcon
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                subActive ? 'text-white' : 'text-zinc-500'
              )}
              aria-hidden="true"
            />
            <span className="truncate">{sub.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Navbar({ user, children }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusExpanded, setFocusExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isExpanded = hovered || focusExpanded || pinned;

  const kegiatanDetailMatch = pathname.match(/^\/kegiatan\/([^/]+)/);
  const activeKegiatanId = kegiatanDetailMatch?.[1] ?? null;
  const [kegiatanSubOpen, setKegiatanSubOpen] = useState(true);

  useEffect(() => {
    if (activeKegiatanId) {
      setKegiatanSubOpen(true);
    }
  }, [activeKegiatanId]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleSidebarMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setHovered(true);
  };

  const handleSidebarMouseLeave = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setHovered(false);
      setFocusExpanded(false);
    }, 80);
  };

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

  const kegiatanSubItems = activeKegiatanId
    ? getKegiatanSubItems(activeKegiatanId, user.role)
    : [];

  const isNavActive = (href: string, externalTab?: boolean) => {
    if (externalTab) return false;
    if (href === '/kegiatan') {
      return pathname === '/kegiatan' || pathname.startsWith('/kegiatan/');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div
      className={cn(
        'min-h-screen transition-[padding-left] duration-200 print:pl-0',
        pinned ? 'lg:pl-60 xl:pl-64' : 'lg:pl-[72px]'
      )}
    >
      {/* Sidebar Utama Desktop (Mode Hover Overlay + Opsi Sematkan) */}
      <aside
        aria-label="Sidebar navigasi utama"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        onFocus={(e) => {
          if (e.target instanceof HTMLElement && e.target.matches(':focus-visible')) {
            setFocusExpanded(true);
          }
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setFocusExpanded(false);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !pinned) {
            setHovered(false);
            setFocusExpanded(false);
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          }
        }}
        className={cn(
          'no-print fixed inset-y-0 left-0 z-40 hidden border-r border-zinc-200 bg-white transition-[width,box-shadow] duration-150 lg:flex lg:flex-col',
          isExpanded ? 'w-60 xl:w-64 shadow-xl' : 'w-[72px] shadow-none'
        )}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-zinc-200',
            isExpanded ? 'justify-between gap-2 px-4' : 'justify-center px-2'
          )}
        >
          {isExpanded ? (
            <>
              <BrandMark />
              <button
                type="button"
                onClick={() => setPinned((prev) => !prev)}
                aria-label={pinned ? 'Lepas sematan sidebar' : 'Sematkan sidebar'}
                title={
                  pinned
                    ? 'Lepas sematan (kembali ke mode hover)'
                    : 'Sematkan agar tetap terbuka'
                }
                aria-pressed={pinned}
                className={cn(
                  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition',
                  pinned
                    ? 'border-zinc-950 bg-zinc-950 text-white'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-100 hover:text-zinc-950'
                )}
              >
                {pinned ? (
                  <DrawingPinFilledIcon className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <DrawingPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </>
          ) : (
            <Link
              href="/"
              aria-label="Beranda BPSDM Jabar"
              className="flex items-center justify-center rounded-lg p-1"
            >
              <BrandLogoSvg />
            </Link>
          )}
        </div>

        <nav aria-label="Menu utama" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {isExpanded && (
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold text-zinc-500">
              Menu Utama
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.href, item.externalTab);
            const hasKegiatanDropdown =
              item.href === '/kegiatan' && activeKegiatanId !== null && kegiatanSubItems.length > 0;

            if (!isExpanded) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.externalTab ? '_blank' : undefined}
                  rel={item.externalTab ? 'noopener noreferrer' : undefined}
                  aria-label={item.name}
                  className={cn(
                    'flex min-h-[42px] items-center justify-center rounded-xl transition-colors',
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
                </Link>
              );
            }

            if (hasKegiatanDropdown) {
              return (
                <div key={item.href}>
                  <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50/80 p-1">
                    <Link
                      href={item.href}
                      className="flex min-h-[34px] min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-100"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-zinc-900" aria-hidden="true" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setKegiatanSubOpen((prev) => !prev)}
                      aria-expanded={kegiatanSubOpen}
                      aria-controls="sidebar-kegiatan-dropdown"
                      aria-label={
                        kegiatanSubOpen
                          ? 'Tutup submenu menu kegiatan'
                          : 'Buka submenu menu kegiatan'
                      }
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-200/70 hover:text-zinc-950"
                    >
                      {kegiatanSubOpen ? (
                        <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {kegiatanSubOpen && (
                    <KegiatanDropdownList
                      id="sidebar-kegiatan-dropdown"
                      items={kegiatanSubItems}
                      pathname={pathname}
                    />
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.externalTab ? '_blank' : undefined}
                rel={item.externalTab ? 'noopener noreferrer' : undefined}
                className={cn(
                  'flex min-h-[42px] items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors',
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
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-zinc-200 p-3">
          {!isExpanded ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Keluar"
              className="flex min-h-[40px] w-full items-center justify-center rounded-xl border border-zinc-400 bg-white text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-50"
            >
              <ExitIcon className="h-4 w-4" aria-hidden="true" />
            </button>
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

      {/* Kolom Konten: Topbar Mobile + Konten Utama */}
      <div className="flex min-h-screen min-w-0 flex-col">
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
                className="fixed inset-y-0 left-0 z-50 flex w-[285px] max-w-[85vw] flex-col border-r border-zinc-200 bg-white focus:outline-none"
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

                <nav
                  aria-label="Menu navigasi mobile"
                  className="flex-1 space-y-1 overflow-y-auto p-4"
                >
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isNavActive(item.href, item.externalTab);
                    const hasKegiatanDropdown =
                      item.href === '/kegiatan' &&
                      activeKegiatanId !== null &&
                      kegiatanSubItems.length > 0;

                    if (hasKegiatanDropdown) {
                      return (
                        <div key={item.href}>
                          <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
                            <Link
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
                            >
                              <Icon className="h-4 w-4 shrink-0 text-zinc-900" aria-hidden="true" />
                              <span className="truncate">{item.name}</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => setKegiatanSubOpen((prev) => !prev)}
                              aria-expanded={kegiatanSubOpen}
                              aria-controls="mobile-kegiatan-dropdown"
                              aria-label={
                                kegiatanSubOpen
                                  ? 'Tutup submenu menu kegiatan'
                                  : 'Buka submenu menu kegiatan'
                              }
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-200/70"
                            >
                              {kegiatanSubOpen ? (
                                <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>
                          </div>

                          {kegiatanSubOpen && (
                            <KegiatanDropdownList
                              id="mobile-kegiatan-dropdown"
                              items={kegiatanSubItems}
                              pathname={pathname}
                              onNavigate={() => setMobileOpen(false)}
                            />
                          )}
                        </div>
                      );
                    }

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
          className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 print:max-w-none print:p-0"
        >
          <div className="mx-auto w-full max-w-[1380px] print:max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
