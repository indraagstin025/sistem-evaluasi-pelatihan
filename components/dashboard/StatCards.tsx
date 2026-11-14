'use client';

import React from 'react';
import {
  BarChartIcon,
  MixerHorizontalIcon,
  PersonIcon,
  TargetIcon,
} from '@radix-ui/react-icons';

interface StatCardsProps {
  ringkasan?: {
    totalPeserta: number;
    totalValidSurvei: number;
    totalValidWawancara: number;
    rataRataSurveiL: number;
    rataRataWawancaraM: number;
    selisihTerbesarPositif?: any;
    selisihTerbesarNegatif?: any;
  };
}

export default function StatCards({ ringkasan }: StatCardsProps) {
  const total = ringkasan?.totalPeserta ?? 0;
  const validSurvei = ringkasan?.totalValidSurvei ?? 0;
  const validWawancara = ringkasan?.totalValidWawancara ?? 0;

  const lVal =
    validSurvei > 0 && ringkasan?.rataRataSurveiL !== undefined
      ? ringkasan.rataRataSurveiL.toFixed(2)
      : '0.00';
  const mVal =
    validWawancara > 0 && ringkasan?.rataRataWawancaraM !== undefined
      ? ringkasan.rataRataWawancaraM.toFixed(2)
      : '0.00';

  const maxPos = ringkasan?.selisihTerbesarPositif?.selisih;
  const maxNeg = ringkasan?.selisihTerbesarNegatif?.selisih;
  const hasPos = typeof maxPos === 'number' && !isNaN(maxPos);
  const hasNeg = typeof maxNeg === 'number' && !isNaN(maxNeg);

  const selisihDisplay = hasPos
    ? `${maxPos >= 0 ? '+' : ''}${maxPos.toFixed(2)}`
    : '0.00';
  const subSelisih =
    hasPos && hasNeg
      ? `Rentang ${maxNeg.toFixed(2)} s.d. ${maxPos >= 0 ? '+' : ''}${maxPos.toFixed(2)}`
      : 'Belum ada perbandingan';

  const lRentangText =
    validSurvei === 0
      ? 'Belum ada data survei'
      : (ringkasan?.rataRataSurveiL ?? 0) >= 76
      ? 'Rentang Optimal (76-100)'
      : (ringkasan?.rataRataSurveiL ?? 0) >= 51
      ? 'Rentang Baik (51-75)'
      : 'Perlu ditingkatkan (< 51)';

  const wawancaraCoverage =
    total > 0 ? Math.round((validWawancara / total) * 100) : 0;

  const secondaryStats = [
    {
      id: 'peserta',
      title: 'Total peserta',
      value: String(total),
      detail: `${validSurvei} terdata survei, ${validWawancara} terdata wawancara`,
      icon: PersonIcon,
    },
    {
      id: 'cakupan',
      title: 'Cakupan wawancara',
      value: `${wawancaraCoverage}%`,
      detail: `${validWawancara} dari ${total} peserta tervalidasi`,
      icon: TargetIcon,
    },
    {
      id: 'selisih',
      title: 'Selisih tertinggi (M - L)',
      value: selisihDisplay,
      detail: subSelisih,
      icon: MixerHorizontalIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Hero Asymmetric Inverted Card */}
      <div className="flex flex-col justify-between rounded-2xl bg-zinc-950 p-6 text-white lg:col-span-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">
              Indeks Evaluasi Utama
            </p>
            <BarChartIcon className="h-4 w-4 shrink-0 text-zinc-300" aria-hidden="true" />
          </div>

          <div className="mt-5 grid grid-cols-2 divide-x divide-zinc-800">
            <div className="pr-4">
              <p className="text-xs font-normal text-zinc-300">Rata-rata L (Survei)</p>
              <p className="mt-1.5 font-mono text-3xl font-semibold leading-none tracking-tight text-white tabular-nums sm:text-[34px]">
                {lVal}
              </p>
              <p className="mt-2 text-[11px] font-normal text-zinc-300">
                {lRentangText}
              </p>
            </div>

            <div className="pl-4">
              <p className="text-xs font-normal text-zinc-300">Rata-rata M (Wawancara)</p>
              <p className="mt-1.5 font-mono text-3xl font-semibold leading-none tracking-tight text-white tabular-nums sm:text-[34px]">
                {mVal}
              </p>
              <p className="mt-2 text-[11px] font-normal text-zinc-300">
                {validWawancara} dari {total} terisi
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-3.5 text-xs">
          <span className="font-normal text-zinc-300">Gap Tertinggi (M - L)</span>
          <span className="font-mono font-semibold text-white tabular-nums">
            {selisihDisplay}
          </span>
        </div>
      </div>

      {/* Right Ledger Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
        {secondaryStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.id}
              className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-600">{stat.title}</p>
                  <Icon className="h-4 w-4 shrink-0 text-zinc-700" aria-hidden="true" />
                </div>
                <p className="mt-3 font-mono text-[28px] font-semibold leading-tight tracking-tight text-zinc-950 tabular-nums">
                  {stat.value}
                </p>
              </div>

              <p className="mt-4 border-t border-zinc-100 pt-2.5 text-xs font-normal text-zinc-600">
                {stat.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
