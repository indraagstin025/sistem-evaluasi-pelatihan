'use client';

import React, { useEffect } from 'react';

function isWibNightNow(): boolean {
  try {
    const hStr = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      hour12: false,
    }).format(new Date());
    const hour = Number.parseInt(hStr, 10);
    const normalizedHour = Number.isNaN(hour) ? new Date().getHours() : hour % 24;
    return normalizedHour >= 18 || normalizedHour < 6;
  } catch {
    const h = new Date().getHours();
    return h >= 18 || h < 6;
  }
}

/**
 * Mengatur tema terang/gelap secara otomatis berdasarkan jam WIB (Asia/Jakarta):
 * - 18.00–05.59 WIB: Mode Gelap (class `dark` pada <html>)
 * - 06.00–17.59 WIB: Mode Terang
 */
export function WibThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const syncTheme = () => {
      document.documentElement.classList.toggle('dark', isWibNightNow());
    };

    syncTheme();
    const interval = window.setInterval(syncTheme, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncTheme();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <>{children}</>;
}
