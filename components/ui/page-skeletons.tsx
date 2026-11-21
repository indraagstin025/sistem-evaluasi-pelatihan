import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function KegiatanListSkeleton() {
  return (
    <div className="space-y-6 pb-12" aria-busy="true" aria-label="Memuat daftar kegiatan">
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-[42px] w-32" />
          <Skeleton className="h-[42px] w-36" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <div className="grid grid-cols-4 gap-2 border-t border-zinc-200 pt-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-[34px] w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KegiatanRingkasanSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat ringkasan kegiatan">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-80 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="space-y-2.5 rounded-xl border border-zinc-200 p-3.5">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Skeleton className="h-44 rounded-2xl lg:col-span-5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-11 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSectionSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat data halaman">
      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-60" />
            <Skeleton className="h-3.5 w-96 max-w-full" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: rows }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardsGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat data">
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-3.5 w-96 max-w-full" />
        <div className="flex flex-wrap gap-2 pt-1">
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: cards }).map((_, idx) => (
          <div
            key={idx}
            className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-44" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormWawancaraSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat formulir wawancara">
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5">
        <Skeleton className="h-5 w-64" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-72" />
              <Skeleton className="h-14 w-24" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
