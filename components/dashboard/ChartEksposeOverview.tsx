'use client';

import Link from 'next/link';
import { BarChartIcon } from '@radix-ui/react-icons';

interface ChartBarItem {
  label: string;
  value: number;
  barClass: string;
}

interface ChartColumnData {
  num: string;
  title: string;
  subtitle: string;
  swatchClass: string;
  bars: ChartBarItem[];
  legend: string;
}

interface ChartEksposeOverviewProps {
  peserta?: any[];
}

function hitungRataKolom(peserta: any[], field: string, pengali = 1): number {
  const valid = peserta
    .map((p) => p?.[field])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) return 0;
  return (valid.reduce((acc, v) => acc + v, 0) / valid.length) * pengali;
}

export default function ChartEksposeOverview({ peserta = [] }: ChartEksposeOverviewProps) {
  const columns: ChartColumnData[] = [
    {
      num: '01',
      title: 'Survei Alumni',
      subtitle: 'Aksi Perubahan',
      swatchClass: 'bg-zinc-950',
      bars: [
        { label: 'P1', value: hitungRataKolom(peserta, 's_panjang', 25), barClass: 'bg-zinc-950' },
        { label: 'P2', value: hitungRataKolom(peserta, 's_tujuan', 25), barClass: 'bg-zinc-700' },
        { label: 'P3', value: hitungRataKolom(peserta, 's_manfaat', 25), barClass: 'bg-zinc-500' },
      ],
      legend: 'P1, P2, P3',
    },
    {
      num: '02',
      title: 'Wawancara',
      subtitle: 'Menengah & Panjang',
      swatchClass: 'bg-zinc-950',
      bars: [
        { label: 'K1', value: hitungRataKolom(peserta, 'w_menengah'), barClass: 'bg-zinc-950' },
        { label: 'K2', value: hitungRataKolom(peserta, 'w_panjang'), barClass: 'bg-zinc-600' },
      ],
      legend: 'K1, K2',
    },
    {
      num: '03',
      title: 'Wawancara',
      subtitle: 'Seluruh Tujuan',
      swatchClass: 'bg-zinc-950',
      bars: [{ label: 'K3', value: hitungRataKolom(peserta, 'w_tujuan'), barClass: 'bg-zinc-950' }],
      legend: 'K3',
    },
    {
      num: '04',
      title: 'Wawancara',
      subtitle: 'Manfaat Aksi',
      swatchClass: 'bg-zinc-700',
      bars: [{ label: 'K4', value: hitungRataKolom(peserta, 'w_manfaat'), barClass: 'bg-zinc-700' }],
      legend: 'K4',
    },
    {
      num: '05',
      title: 'Wawancara',
      subtitle: 'Komunikasi',
      swatchClass: 'bg-zinc-600',
      bars: [{ label: 'K5', value: hitungRataKolom(peserta, 'w_komunikasi'), barClass: 'bg-zinc-600' }],
      legend: 'K5',
    },
  ];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3.5">
        <div className="flex items-center gap-2">
          <BarChartIcon className="h-4 w-4 text-zinc-950" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-950">Ringkasan Grafik Ekspose</h2>
        </div>
        <Link
          href="/ekspose"
          className="text-xs font-medium text-zinc-950 underline underline-offset-4 transition hover:text-zinc-600"
        >
          Buka Semua Slide Ekspose
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 divide-y divide-zinc-200 pt-4 md:grid-cols-3 md:divide-x md:divide-y-0 lg:grid-cols-5">
        {columns.map((col, idx) => (
          <div
            key={col.num}
            className={`flex flex-col justify-between ${idx > 0 ? 'pt-4 md:pl-4 md:pt-0' : ''}`}
          >
            <div className="mb-3 flex items-baseline gap-2">
              <span className="font-mono text-xs font-medium text-zinc-600 tabular-nums">
                {col.num}
              </span>
              <div>
                <p className="text-xs font-medium leading-tight text-zinc-950">{col.title}</p>
                <p className="text-[11px] font-normal leading-tight text-zinc-600">{col.subtitle}</p>
              </div>
            </div>

            <div className="relative flex h-44 items-end pb-1 pt-5">
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between text-[10px] font-normal text-zinc-600">
                {[100, 80, 60, 40, 20, 0].map((tick) => (
                  <div key={tick} className="flex w-full items-center gap-1.5">
                    <span className="w-5 shrink-0 text-right font-mono tabular-nums">{tick}</span>
                    <div className="h-px flex-1 bg-zinc-200/80" />
                  </div>
                ))}
              </div>

              <div className="relative z-10 ml-7 flex h-full flex-1 items-end justify-center gap-2.5">
                {col.bars.map((bar) => {
                  const barHeightPercent = Math.min(Math.max(bar.value, 0), 100);

                  return (
                    <div
                      key={bar.label}
                      className="flex h-full max-w-[42px] flex-1 flex-col items-center justify-end"
                    >
                      <span className="mb-1 font-mono text-[10px] font-medium leading-none text-zinc-950 tabular-nums">
                        {bar.value.toFixed(1)}
                      </span>
                      <div
                        style={{ height: `${barHeightPercent * 0.78}%` }}
                        className={`w-full rounded-t-sm ${bar.barClass} transition-opacity duration-200 hover:opacity-85`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-center gap-1.5 border-t border-zinc-100 pt-2">
              <span className={`h-2 w-2 rounded-sm ${col.swatchClass}`} aria-hidden="true" />
              <span className="text-[11px] font-medium text-zinc-700">{col.legend}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
