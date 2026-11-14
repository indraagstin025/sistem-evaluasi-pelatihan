'use client';

import React from 'react';
import {
  CheckCircledIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MixerHorizontalIcon,
  TargetIcon,
} from '@radix-ui/react-icons';
import { Progress } from '@/components/ui/progress';

interface BottomCardsProps {
  ringkasan?: {
    totalPeserta: number;
    totalValidSurvei: number;
    totalValidWawancara: number;
    totalKosongWawancara: number;
    rataRataSurveiL: number;
    rataRataWawancaraM: number;
    selisihTerbesarPositif?: any;
    selisihTerbesarNegatif?: any;
  };
}

export default function BottomCards({ ringkasan }: BottomCardsProps) {
  const total = ringkasan?.totalPeserta ?? 0;
  const valid = ringkasan?.totalValidWawancara ?? 0;
  const kosong = ringkasan?.totalKosongWawancara ?? 0;

  const pctValid = total > 0 ? Math.round((valid / total) * 100) : 0;
  const pctValidStr = total > 0 ? ((valid / total) * 100).toFixed(1) : '0.0';
  const pctKosongStr = total > 0 ? ((kosong / total) * 100).toFixed(1) : '0.0';

  const validSurvei = ringkasan?.totalValidSurvei ?? 0;
  const lVal = validSurvei > 0 ? ringkasan?.rataRataSurveiL ?? 0 : 0;
  const mVal = valid > 0 ? ringkasan?.rataRataWawancaraM ?? 0 : 0;
  const avgBoth =
    validSurvei > 0 || valid > 0
      ? ((lVal + mVal) / (validSurvei > 0 && valid > 0 ? 2 : 1)).toFixed(2)
      : '0.00';

  const maxPos = ringkasan?.selisihTerbesarPositif?.selisih;
  const maxNeg = ringkasan?.selisihTerbesarNegatif?.selisih;
  const hasPos = typeof maxPos === 'number' && !isNaN(maxPos);
  const hasNeg = typeof maxNeg === 'number' && !isNaN(maxNeg);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* 1. Kelengkapan Data Card */}
      <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-5">
        <div>
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <ClockIcon className="h-4 w-4 text-zinc-800" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-zinc-950">Kelengkapan Data</h2>
          </div>

          <div className="space-y-4 py-4">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
                  {pctValidStr}%
                </p>
                <p className="text-xs font-normal text-zinc-600">
                  Wawancara terisi dari {total} peserta
                </p>
              </div>
            </div>

            <Progress
              value={pctValid}
              aria-label={`Kelengkapan data wawancara ${pctValidStr} persen`}
            />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-center gap-1.5 font-medium text-zinc-900">
                  <CheckCircledIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Lengkap</span>
                </div>
                <p className="mt-1 font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                  {valid} ({pctValidStr}%)
                </p>
              </div>

              <div
                className={
                  kosong > 0
                    ? 'rounded-xl border border-zinc-950 bg-zinc-950 p-3 text-white'
                    : 'rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-zinc-800'
                }
              >
                <div className="flex items-center gap-1.5 font-medium">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Kosong</span>
                </div>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
                  {kosong} ({pctKosongStr}%)
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="border-t border-zinc-100 pt-3 text-xs font-normal text-zinc-600">
          Nilai yang kosong tidak diikutsertakan dalam perhitungan rata-rata wawancara.
        </p>
      </div>

      {/* 2. Rata-rata Nilai Card */}
      <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-3">
        <div>
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <TargetIcon className="h-4 w-4 text-zinc-800" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-zinc-950">Rata-rata Nilai</h2>
          </div>

          <div className="space-y-3 py-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="font-normal text-zinc-600">Nilai L (Survei)</span>
              <span className="font-mono text-sm font-medium text-zinc-950 tabular-nums">
                {lVal.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="font-normal text-zinc-600">Nilai M (Wawancara)</span>
              <span className="font-mono text-sm font-medium text-zinc-950 tabular-nums">
                {mVal.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-950 bg-zinc-50 p-3">
              <span className="font-medium text-zinc-950">Gabungan</span>
              <span className="font-mono text-base font-semibold text-zinc-950 tabular-nums">
                {avgBoth}
              </span>
            </div>
          </div>
        </div>

        <p className="border-t border-zinc-100 pt-3 text-xs font-normal text-zinc-600">
          Perbandingan skor instrumen survei alumni dan wawancara evaluator.
        </p>
      </div>

      {/* 3. Ekstrem Selisih Card */}
      <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-4">
        <div>
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <MixerHorizontalIcon className="h-4 w-4 text-zinc-800" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-zinc-950">Ekstrem Selisih (M - L)</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="rounded-xl bg-zinc-950 p-3.5 text-center text-white">
              <span className="block text-xs font-medium text-zinc-300">
                Tertinggi (+)
              </span>
              <span className="mt-1 block font-mono text-xl font-semibold text-white tabular-nums">
                {hasPos ? `${maxPos >= 0 ? '+' : ''}${maxPos.toFixed(2)}` : '0.00'}
              </span>
              <span className="mt-1 block truncate text-[11px] font-normal text-zinc-300">
                {ringkasan?.selisihTerbesarPositif?.nama ||
                  (total === 0 ? 'Belum ada data' : 'Wawancara lebih tinggi')}
              </span>
            </div>

            <div className="rounded-xl border border-zinc-500 bg-zinc-50 p-3.5 text-center text-zinc-950">
              <span className="block text-xs font-medium text-zinc-700">
                Terendah (-)
              </span>
              <span className="mt-1 block font-mono text-xl font-semibold text-zinc-950 tabular-nums">
                {hasNeg
                  ? maxNeg > 0
                    ? `-${maxNeg.toFixed(2)}`
                    : maxNeg.toFixed(2)
                  : '0.00'}
              </span>
              <span className="mt-1 block truncate text-[11px] font-normal text-zinc-600">
                {ringkasan?.selisihTerbesarNegatif?.nama ||
                  (total === 0 ? 'Belum ada data' : 'Survei lebih tinggi')}
              </span>
            </div>
          </div>
        </div>

        <p className="border-t border-zinc-100 pt-3 text-xs font-normal text-zinc-600">
          Selisih paling besar antara nilai wawancara (M) dan nilai survei (L).
        </p>
      </div>
    </div>
  );
}
