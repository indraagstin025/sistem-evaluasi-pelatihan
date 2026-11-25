'use client';

export const CLIENT_NETWORK_ERROR_MESSAGE =
  'Ada masalah pada koneksi internet Anda. Periksa jaringan Wi-Fi atau data seluler, lalu coba lagi.';

export const CLIENT_DATABASE_ERROR_MESSAGE =
  'Terjadi gangguan pada server database saat memproses data. Silakan muat ulang halaman atau coba beberapa saat lagi.';

export const CLIENT_GENERIC_ERROR_MESSAGE =
  'Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.';

export class ClientRequestError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    opts?: { status?: number; code?: string; isNetworkError?: boolean }
  ) {
    super(message);
    this.name = 'ClientRequestError';
    this.status = opts?.status;
    this.code = opts?.code;
    this.isNetworkError = Boolean(opts?.isNetworkError);
  }
}

const NETWORK_FAILURE_MSG_RE =
  /failed to fetch|networkerror|network request failed|load failed|err_internet_disconnected|err_network_changed|err_name_not_resolved|err_connection_|koneksi internet|jaringan|econnrefused|etimedout|timed out|the internet connection appears to be offline/i;

const UNSAFE_INTERNAL_TRACE_RE =
  /invalid `prisma\.|prisma\.|unknown argument|unknown field|prismaclient|invocation:|sqlstate|available options are marked/i;

export function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function isNetworkErrorLike(error: unknown): boolean {
  if (isBrowserOffline()) return true;
  if (error instanceof ClientRequestError && error.isNetworkError) return true;
  if (error instanceof TypeError) return true;

  if (error && typeof error === 'object') {
    const errObj = error as { name?: unknown; message?: unknown; code?: unknown };
    if (errObj.code === 'NETWORK_ERROR' || errObj.code === 'OFFLINE') return true;
    if (typeof errObj.message === 'string' && NETWORK_FAILURE_MSG_RE.test(errObj.message)) {
      return true;
    }
    if (errObj.name === 'AbortError' && typeof errObj.message === 'string' && /timeout/i.test(errObj.message)) {
      return true;
    }
  } else if (typeof error === 'string' && NETWORK_FAILURE_MSG_RE.test(error)) {
    return true;
  }

  return false;
}

/**
 * Memastikan tidak ada detail teknis internal Prisma/SQL yang tercetak di UI pengguna.
 */
export function sanitizeClientErrorText(rawText: string, status?: number): string {
  const cleaned = String(rawText || '').trim();
  if (!cleaned) {
    return status && status >= 500
      ? CLIENT_DATABASE_ERROR_MESSAGE
      : CLIENT_GENERIC_ERROR_MESSAGE;
  }
  if (UNSAFE_INTERNAL_TRACE_RE.test(cleaned)) {
    return CLIENT_DATABASE_ERROR_MESSAGE;
  }
  return cleaned;
}

/**
 * Formatter pesan error terpusat di sisi client untuk seluruh aksi fetch/simpan/muat data.
 */
export function formatClientErrorMessage(
  error: unknown,
  fallback = CLIENT_GENERIC_ERROR_MESSAGE
): string {
  if (isNetworkErrorLike(error)) {
    return CLIENT_NETWORK_ERROR_MESSAGE;
  }

  if (error instanceof ClientRequestError) {
    return sanitizeClientErrorText(error.message || fallback, error.status);
  }

  if (error instanceof Error) {
    return sanitizeClientErrorText(error.message || fallback);
  }

  if (typeof error === 'string') {
    return sanitizeClientErrorText(error);
  }

  return fallback;
}

export async function parseApiErrorFromResponse(
  res: Response,
  fallback?: string
): Promise<ClientRequestError> {
  const json = await res.json().catch(() => null);
  const code = typeof json?.code === 'string' ? json.code : undefined;
  const isNetworkStatus =
    code === 'NETWORK_ERROR' || res.status === 502 || res.status === 503 || res.status === 504;

  if (isNetworkStatus || isBrowserOffline()) {
    return new ClientRequestError(CLIENT_NETWORK_ERROR_MESSAGE, {
      status: res.status,
      code: code || 'NETWORK_ERROR',
      isNetworkError: true,
    });
  }

  const rawMsg =
    typeof json?.error === 'string'
      ? json.error
      : fallback || `Permintaan gagal (${res.status}). Silakan coba lagi.`;

  return new ClientRequestError(sanitizeClientErrorText(rawMsg, res.status), {
    status: res.status,
    code,
    isNetworkError: false,
  });
}

/**
 * Pembungkus fetch() terpusat yang melakukan validasi koneksi internet sebelum & sesudah request
 * serta melempar ClientRequestError yang aman untuk langsung ditampilkan ke pengguna.
 */
export async function apiFetchJson<T = any>(
  url: string,
  init?: RequestInit & { fallbackError?: string }
): Promise<T> {
  if (isBrowserOffline()) {
    throw new ClientRequestError(CLIENT_NETWORK_ERROR_MESSAGE, {
      code: 'OFFLINE',
      isNetworkError: true,
    });
  }

  const { fallbackError, ...fetchInit } = init || {};
  let res: Response;
  try {
    res = await fetch(url, {
      cache: 'no-store',
      ...fetchInit,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError' && init?.signal?.aborted) {
      throw err;
    }
    throw new ClientRequestError(
      formatClientErrorMessage(err, fallbackError || CLIENT_NETWORK_ERROR_MESSAGE),
      {
        code: 'NETWORK_ERROR',
        isNetworkError: isNetworkErrorLike(err),
      }
    );
  }

  if (!res.ok) {
    throw await parseApiErrorFromResponse(res, fallbackError);
  }

  const json = (await res.json().catch(() => null)) as T | null;
  if (!json) {
    throw new ClientRequestError('Respons server kosong atau tidak valid.', {
      status: res.status,
    });
  }

  return json;
}
