'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/cn';

export type ThemeMode = 'auto-wib' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'bpsdm-theme-mode';

function getWibHourAndLabel(): { hour: number; clockLabel: string } {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const hStr = parts.find((p) => p.type === 'hour')?.value ?? '12';
    const mStr = parts.find((p) => p.type === 'minute')?.value ?? '00';
    const hour = Number.parseInt(hStr, 10);
    return {
      hour: Number.isNaN(hour) ? 12 : hour % 24,
      clockLabel: `${hStr}:${mStr} WIB`,
    };
  } catch {
    const h = new Date().getHours();
    return { hour: h, clockLabel: `${String(h).padStart(2, '0')}:00 WIB` };
  }
}

export function isWibNightHour(hour: number): boolean {
  return hour >= 18 || hour < 6;
}

interface WibThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  wibClock: string;
  setMode: (nextMode: ThemeMode) => void;
  toggleSwitch: () => void;
}

const WibThemeContext = createContext<WibThemeContextValue>({
  mode: 'auto-wib',
  resolvedTheme: 'light',
  wibClock: '--:-- WIB',
  setMode: () => {},
  toggleSwitch: () => {},
});

export function useWibTheme(): WibThemeContextValue {
  return useContext(WibThemeContext);
}

export function WibThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto-wib');
  const [wibInfo, setWibInfo] = useState<{ hour: number; clockLabel: string }>(() =>
    getWibHourAndLabel()
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'auto-wib' || saved === 'light' || saved === 'dark') {
        setModeState(saved);
      }
    } catch {
      // Abaikan jika localStorage dibatasi
    }
    setWibInfo(getWibHourAndLabel());
  }, []);

  const resolvedTheme: ResolvedTheme =
    mode === 'dark'
      ? 'dark'
      : mode === 'light'
      ? 'light'
      : isWibNightHour(wibInfo.hour)
      ? 'dark'
      : 'light';

  useEffect(() => {
    const html = document.documentElement;
    if (resolvedTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [resolvedTheme]);

  useEffect(() => {
    const syncClock = () => setWibInfo(getWibHourAndLabel());
    const interval = window.setInterval(syncClock, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncClock();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch {
      // Abaikan jika localStorage dibatasi
    }
  }, []);

  const toggleSwitch = useCallback(() => {
    const nextResolved: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setMode(nextResolved);
  }, [resolvedTheme, setMode]);

  const value = useMemo<WibThemeContextValue>(
    () => ({
      mode,
      resolvedTheme,
      wibClock: wibInfo.clockLabel,
      setMode,
      toggleSwitch,
    }),
    [mode, resolvedTheme, wibInfo.clockLabel, setMode, toggleSwitch]
  );

  return (
    <WibThemeContext.Provider value={value}>{children}</WibThemeContext.Provider>
  );
}

/**
 * Tombol Switch Tema Terang/Gelap + opsi cepat Auto WIB (18.00–05.59 WIB Gelap).
 */
export function ThemeSwitchControl({ compact = false }: { compact?: boolean }) {
  const { mode, resolvedTheme, wibClock, setMode, toggleSwitch } = useWibTheme();
  const isDark = resolvedTheme === 'dark';

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleSwitch}
          title={
            isDark
              ? 'Mode Gelap aktif (klik untuk beralih ke Mode Terang)'
              : 'Mode Terang aktif (klik untuk beralih ke Mode Gelap)'
          }
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-400 bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 transition hover:bg-zinc-100"
        >
          {isDark ? (
            <MoonIcon className="h-3.5 w-3.5 text-zinc-900" aria-hidden="true" />
          ) : (
            <SunIcon className="h-3.5 w-3.5 text-zinc-900" aria-hidden="true" />
          )}
          <span>{isDark ? 'Gelap' : 'Terang'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('auto-wib')}
          aria-pressed={mode === 'auto-wib'}
          title={`Ikuti jadwal otomatis WIB (${wibClock})`}
          className={cn(
            'inline-flex min-h-[36px] items-center rounded-lg border px-2 py-1 text-[11px] font-medium transition',
            mode === 'auto-wib'
              ? 'border-zinc-950 bg-zinc-950 text-white'
              : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
          )}
        >
          Auto WIB
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isDark ? (
            <MoonIcon className="h-3.5 w-3.5 shrink-0 text-zinc-900" aria-hidden="true" />
          ) : (
            <SunIcon className="h-3.5 w-3.5 shrink-0 text-zinc-900" aria-hidden="true" />
          )}
          <span className="truncate text-xs font-medium text-zinc-950">
            {isDark ? 'Mode Gelap' : 'Mode Terang'}
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label={isDark ? 'Matikan mode gelap' : 'Aktifkan mode gelap'}
          onClick={toggleSwitch}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors',
            isDark
              ? 'border-zinc-950 bg-zinc-950'
              : 'border-zinc-400 bg-zinc-300'
          )}
        >
          <span
            className={cn(
              'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
              isDark ? 'translate-x-4' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-mono text-zinc-600">{wibClock}</span>
        <button
          type="button"
          onClick={() => setMode(mode === 'auto-wib' ? resolvedTheme : 'auto-wib')}
          aria-pressed={mode === 'auto-wib'}
          className={cn(
            'rounded-md border px-2 py-0.5 text-[10px] font-semibold transition',
            mode === 'auto-wib'
              ? 'border-zinc-950 bg-zinc-950 text-white'
              : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
          )}
        >
          {mode === 'auto-wib' ? 'Auto WIB Aktif' : 'Gunakan Auto WIB'}
        </button>
      </div>
    </div>
  );
}
