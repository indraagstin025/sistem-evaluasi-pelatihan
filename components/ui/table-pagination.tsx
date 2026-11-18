'use client';

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/cn';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (nextPage: number) => void;
  itemLabel?: string;
  loading?: boolean;
}

function buildPageNumbers(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) pages.push('ellipsis');
  for (let p = left; p <= right; p += 1) {
    pages.push(p);
  }
  if (right < total - 1) pages.push('ellipsis');
  pages.push(total);

  return pages;
}

/**
 * Bilah paginasi tabel konsisten dengan ukuran bawaan 10 data per halaman.
 */
export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel = 'peserta',
  loading = false,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(totalItems, safePage * pageSize);
  const pageNumbers = buildPageNumbers(safePage, totalPages);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-zinc-200 pt-4 sm:flex-row">
      <p className="text-xs text-zinc-600 tabular-nums">
        Menampilkan{' '}
        <span className="font-semibold text-zinc-950">
          {start}-{end}
        </span>{' '}
        dari <span className="font-semibold text-zinc-950">{totalItems}</span> {itemLabel}
      </p>

      {totalPages > 1 && (
        <nav aria-label={`Paginasi ${itemLabel}`} className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={loading || safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="Halaman sebelumnya"
            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-zinc-400 bg-white px-2.5 text-xs font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          {pageNumbers.map((item, idx) =>
            item === 'ellipsis' ? (
              <span
                key={`el-${idx}`}
                className="inline-flex min-h-[36px] min-w-[28px] items-center justify-center text-xs text-zinc-500"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                disabled={loading}
                aria-current={item === safePage ? 'page' : undefined}
                onClick={() => onPageChange(item)}
                className={cn(
                  'inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg px-2.5 font-mono text-xs tabular-nums transition disabled:opacity-50',
                  item === safePage
                    ? 'bg-zinc-950 font-semibold text-white'
                    : 'border border-zinc-300 bg-white font-medium text-zinc-800 hover:border-zinc-500 hover:bg-zinc-50'
                )}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            disabled={loading || safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="Halaman berikutnya"
            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-zinc-400 bg-white px-2.5 text-xs font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
