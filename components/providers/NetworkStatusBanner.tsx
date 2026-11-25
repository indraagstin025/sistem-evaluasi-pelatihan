'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';

/**
 * Pemantau koneksi internet global pada sisi browser.
 * Menampilkan pemberitahuan real-time ketika koneksi terputus di tengah sesi
 * dan konfirmasi singkat ketika koneksi internet kembali pulih.
 */
export function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [justRestored, setJustRestored] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    let restoreTimer: ReturnType<typeof setTimeout> | null = null;

    if (navigator.onLine === false) {
      setIsOffline(true);
    }

    const handleOffline = () => {
      if (restoreTimer) {
        clearTimeout(restoreTimer);
        restoreTimer = null;
      }
      setJustRestored(false);
      setIsOffline(true);
    };

    const handleOnline = () => {
      setIsOffline((wasOffline) => {
        if (wasOffline) {
          setJustRestored(true);
          if (restoreTimer) clearTimeout(restoreTimer);
          restoreTimer = setTimeout(() => {
            setJustRestored(false);
          }, 4000);
        }
        return false;
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (restoreTimer) clearTimeout(restoreTimer);
    };
  }, []);

  if (!isOffline && !justRestored) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="no-print fixed inset-x-0 top-3 z-[70] mx-auto w-[calc(100%-1.5rem)] max-w-xl px-1"
    >
      {isOffline ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-700 bg-red-950 px-4 py-3 text-xs text-white shadow-lg">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-200" aria-hidden="true" />
          <div className="min-w-0 flex-1 leading-relaxed">
            <p className="font-semibold">Ada masalah pada koneksi internet Anda</p>
            <p className="mt-0.5 text-[11px] text-red-100">
              Jaringan terputus. Periksa Wi-Fi atau data seluler Anda sebelum menyimpan atau memuat ulang data.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-medium text-white shadow-lg">
          <CheckCircledIcon className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
          <span>Koneksi internet kembali terhubung. Anda dapat melanjutkan penyimpanan data.</span>
        </div>
      )}
    </div>
  );
}
