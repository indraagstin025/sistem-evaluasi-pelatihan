'use client';

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
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'Koneksi internet terputus. Periksa jaringan Anda, lalu coba lagi.';
  }
  return 'Permintaan unggah tertahan di browser/jaringan lokal sebelum mencapai server (sering terjadi pada tab lama, ekstensi browser, antivirus/firewall, atau file yang masih terbuka). Muat ulang halaman lalu coba unggah kembali.';
}
