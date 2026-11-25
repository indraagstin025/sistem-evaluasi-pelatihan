'use client';

import {
  CLIENT_NETWORK_ERROR_MESSAGE,
  ClientRequestError,
  isBrowserOffline,
} from '@/lib/client-error';

/**
 * Membaca seluruh byte File ke Blob di memori browser agar pengiriman FormData
 * tidak bergantung lagi pada handle file disk yang rawan terkunci/kedaluwarsa.
 */
export async function readFileIntoMemoryBlob(
  file: File,
  fallbackMimeType = 'application/octet-stream'
): Promise<Blob> {
  try {
    const buffer = await file.arrayBuffer();
    return new Blob([buffer], { type: file.type || fallbackMimeType });
  } catch {
    throw new Error(
      `File "${file.name}" tidak dapat dibaca oleh browser. Pastikan file tidak sedang terbuka di aplikasi lain atau terkunci oleh sinkronisasi cloud, lalu pilih ulang.`
    );
  }
}

/**
 * Mengirim FormData POST dengan 1x retry otomatis bila browser gagal instan (TypeError < 3 detik)
 * akibat socket/tab lama sebelum request sempat diproses server.
 */
export async function fetchFormDataWithRetry(
  url: string,
  buildFormData: () => FormData,
  options?: { quickFailureThresholdMs?: number; retryDelayMs?: number }
): Promise<Response> {
  if (isBrowserOffline()) {
    throw new ClientRequestError(CLIENT_NETWORK_ERROR_MESSAGE, {
      code: 'OFFLINE',
      isNetworkError: true,
    });
  }

  const quickThreshold = options?.quickFailureThresholdMs ?? 3000;
  const retryDelay = options?.retryDelayMs ?? 300;
  const startedAt = Date.now();

  try {
    return await fetch(url, {
      method: 'POST',
      body: buildFormData(),
      cache: 'no-store',
      credentials: 'same-origin',
    });
  } catch (err) {
    const elapsedMs = Date.now() - startedAt;
    if (err instanceof TypeError && elapsedMs < quickThreshold) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return fetch(url, {
        method: 'POST',
        body: buildFormData(),
        cache: 'no-store',
        credentials: 'same-origin',
      });
    }
    throw err;
  }
}

/**
 * Menyusun pesan error upload yang akurat ketika fetch gagal di lapisan jaringan browser.
 */
export function formatUploadNetworkError(): string {
  if (isBrowserOffline()) {
    return CLIENT_NETWORK_ERROR_MESSAGE;
  }
  return 'Ada masalah pada koneksi internet atau permintaan unggah tertahan di jaringan lokal sebelum mencapai server. Periksa internet Anda atau muat ulang halaman lalu coba kembali.';
}
