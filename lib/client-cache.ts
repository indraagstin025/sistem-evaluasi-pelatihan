'use client';

import {
  CLIENT_NETWORK_ERROR_MESSAGE,
  ClientRequestError,
  formatClientErrorMessage,
  isBrowserOffline,
  isNetworkErrorLike,
  parseApiErrorFromResponse,
} from '@/lib/client-error';

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

  const executeFetch = async (signal?: AbortSignal): Promise<T> => {
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }
    if (isBrowserOffline()) {
      throw new ClientRequestError(CLIENT_NETWORK_ERROR_MESSAGE, {
        code: 'OFFLINE',
        isNetworkError: true,
      });
    }

    let res: Response;
    try {
      res = await fetch(url, {
        cache: 'no-store',
        signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError' && signal?.aborted) {
        throw err;
      }
      throw new ClientRequestError(formatClientErrorMessage(err), {
        code: 'NETWORK_ERROR',
        isNetworkError: isNetworkErrorLike(err),
      });
    }

    if (!res.ok) {
      throw await parseApiErrorFromResponse(res);
    }

    const json = (await res.json().catch(() => null)) as T | null;
    if (!json) {
      throw new ClientRequestError('Respons server kosong atau tidak valid.', {
        status: res.status,
      });
    }
    setClientCache(key, json);
    return json;
  };

  if (options?.signal) {
    const data = await executeFetch(options.signal);
    return { data, fromCache: false };
  }

  let promise = inFlightRequests.get(key) as Promise<T> | undefined;
  if (!promise || options?.force) {
    let createdPromise!: Promise<T>;
    createdPromise = (async () => {
      try {
        return await executeFetch();
      } finally {
        if (inFlightRequests.get(key) === createdPromise) {
          inFlightRequests.delete(key);
        }
      }
    })();

    promise = createdPromise;
    inFlightRequests.set(key, createdPromise);
  }

  const data = await promise;
  return { data, fromCache: false };
}
