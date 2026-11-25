import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

export type ApiErrorCode = 'NETWORK_ERROR' | 'DATABASE_ERROR' | 'INTERNAL_ERROR';

/**
 * Error terkontrol untuk validasi/otorisasi HTTP terstruktur apabila dilempar dari service layer.
 */
export class AppHttpError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = 'AppHttpError';
    this.status = status;
    this.code = code;
  }
}

const PRISMA_CONNECTION_CODES = new Set([
  'P1000',
  'P1001',
  'P1002',
  'P1003',
  'P1008',
  'P1011',
  'P1017',
  'P2024',
]);

const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
]);

const NETWORK_MESSAGE_RE =
  /can't reach database server|connection terminated|connection closed|server closed the connection|socket hang up|econnrefused|econnreset|etimedout|enotfound|eai_again|fetch failed|timed out|timeout exceeded|network/i;

const DATABASE_MESSAGE_RE =
  /invalid `prisma\.|prisma\.|unknown argument|unknown field|prismaClient|postgres|sqlstate|foreign key constraint|unique constraint|column .* does not exist|relation .* does not exist/i;

function extractErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const obj = err as Record<string, any>;
  if (typeof obj.code === 'string') return obj.code;
  if (obj.cause && typeof obj.cause === 'object' && typeof obj.cause.code === 'string') {
    return obj.cause.code;
  }
  return undefined;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const causeMsg =
      err.cause instanceof Error ? ` ${err.cause.message}` : '';
    return `${err.message}${causeMsg}`;
  }
  if (typeof err === 'string') return err;
  return '';
}

function isPrismaError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    return true;
  }
  const name = (err as { name?: unknown }).name;
  return typeof name === 'string' && name.startsWith('PrismaClient');
}

export interface ClassifiedServerError {
  status: number;
  code: ApiErrorCode;
  error: string;
}

/**
 * Mengklasifikasikan error server secara aman agar detail query Prisma/SQL atau path sistem
 * tidak pernah terkirim ke browser pengguna. Seluruh error database dan internal menggunakan HTTP 500.
 */
export function classifyServerError(
  err: unknown,
  fallbackMessage?: string
): ClassifiedServerError {
  const errCode = extractErrorCode(err);
  const msg = extractErrorMessage(err);
  const prismaErr = isPrismaError(err);

  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    (errCode && PRISMA_CONNECTION_CODES.has(errCode)) ||
    (errCode && NETWORK_ERROR_CODES.has(errCode)) ||
    NETWORK_MESSAGE_RE.test(msg)
  ) {
    return {
      status: 500,
      code: 'NETWORK_ERROR',
      error:
        'Ada masalah pada koneksi jaringan ke server database. Pastikan koneksi internet stabil, lalu coba lagi beberapa saat.',
    };
  }

  if (prismaErr || DATABASE_MESSAGE_RE.test(msg)) {
    return {
      status: 500,
      code: 'DATABASE_ERROR',
      error:
        'Terjadi gangguan pada sistem database saat memproses data. Silakan muat ulang halaman atau hubungi administrator bila masalah berlanjut.',
    };
  }

  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    error:
      fallbackMessage ||
      'Terjadi kesalahan internal server saat memproses permintaan. Silakan coba lagi.',
  };
}

/**
 * Error handler API terpusat: mencatat detail teknis lengkap di server console dan mengembalikan
 * respons JSON HTTP 500 yang bersih dan aman untuk pengguna.
 */
export function handleApiError(
  error: unknown,
  context: string,
  fallbackMessage?: string
): NextResponse {
  if (error instanceof AppHttpError) {
    return NextResponse.json(
      {
        success: false,
        code: error.code || 'INTERNAL_ERROR',
        error: error.message,
      },
      { status: error.status }
    );
  }

  console.error(`[${context}] Error:`, error);
  const classified = classifyServerError(error, fallbackMessage);

  return NextResponse.json(
    {
      success: false,
      code: classified.code,
      error: classified.error,
    },
    { status: classified.status }
  );
}
