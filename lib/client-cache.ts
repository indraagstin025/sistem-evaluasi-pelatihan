'use client';

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

const DEFAULT_STALE_TIME_MS = 20_000;

export function getClientCache<T>(key: string): CacheEntry<T> | null {
  return (memoryCache.get(key) as CacheEntry<T> | undefined) ?? null;
}

export function setClientCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, fetchedAt: Date.now() });
}

export function invalidateClientCache(
  matcher?: string | RegExp | ((key: string) => boolean)
): void {
  if (!matcher) {
    memoryCache.clear();
    return;
  }
  for (const key of Array.from(memoryCache.keys())) {
    if (typeof matcher === 'string') {
      if (key.includes(matcher)) memoryCache.delete(key);
    } else if (matcher instanceof RegExp) {
      if (matcher.test(key)) memoryCache.delete(key);
    } else if (matcher(key)) {
      memoryCache.delete(key);
    }
  }
}

export function invalidateKegiatanCache(kegiatanId?: string): void {
  if (!kegiatanId) {
    invalidateClientCache();
    return;
  }
  invalidateClientCache((key) =>
    key.includes(kegiatanId) || key === '/api/kegiatan'
  );
}

/**
 * Mengambil JSON GET dari API dengan deduplikasi in-flight dan cache memori per sesi tab.
 * Gunakan bersama getClientCache untuk pola stale-while-revalidate tanpa efek loading berulang.
 */
export async function fetchJsonWithCache<T = any>(
  url: string,
  options?: {
    force?: boolean;
    staleTimeMs?: number;
    signal?: AbortSignal;
    cacheKey?: string;
  }
): Promise<{ data: T; fromCache: boolean }> {
  const key = options?.cacheKey ?? url;
  const staleTimeMs = options?.staleTimeMs ?? DEFAULT_STALE_TIME_MS;

  if (!options?.force) {
    const existing = getClientCache<T>(key);
    if (existing && Date.now() - existing.fetchedAt < staleTimeMs) {
      return { data: existing.data, fromCache: true };
    }
  }

  let promise = inFlightRequests.get(key) as Promise<T> | undefined;
  if (!promise || options?.force) {
    promise = (async () => {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: options?.signal,
      });
      const json = (await res.json().catch(() => null)) as T | null;
      if (!res.ok) {
        const errMsg =
          (json as any)?.error || `Permintaan gagal (${res.status}). Coba muat ulang halaman.`;
        throw new Error(errMsg);
      }
      if (!json) {
        throw new Error('Respons server kosong atau tidak valid.');
      }
      setClientCache(key, json);
      return json;
    })();

    inFlightRequests.set(key, promise);
    promise.finally(() => {
      if (inFlightRequests.get(key) === promise) {
        inFlightRequests.delete(key);
      }
    });
  }

  const data = await promise;
  return { data, fromCache: false };
}
