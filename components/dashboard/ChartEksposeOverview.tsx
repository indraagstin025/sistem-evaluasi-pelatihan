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
  eksposeHref?: string;
}

function hitungRataKolom(peserta: any[], field: string, pengali = 1): number {
  const valid = peserta
    .map((p) => p?.[field])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) return 0;
  return (valid.reduce((acc, v) => acc + v, 0) / valid.length) * pengali;
}

export default function ChartEksposeOverview({
  peserta = [],
  eksposeHref = '/ekspose',
}: ChartEksposeOverviewProps) {
  const columns: ChartColumnData[] = [
    {
      num: '01',
      title: 'Survei alumni',
      subtitle: 'Hasil Aksi Perubahan',
      swatchClass: 'bg-zinc-950',
      bars: [
        { label: 'P1', value: hitungRataKolom(peserta, 's_panjang', 25), barClass: 'bg-zinc-950' },
        { label: 'P2', value: hitungRataKolom(peserta, 's_tujuan', 25), barClass: 'bg-zinc-700' },
        { label: 'P3', value: hitungRataKolom(peserta, 's_manfaat', 25), barClass: 'bg-zinc-500' },
      ],
      legend: 'P1 = Jangka Panjang, P2 = Tujuan, P3 = Manfaat',
    },
    {
      num: '02',
      title: 'Wawancara',
      subtitle: 'Target Menengah & Panjang',
      swatchClass: 'bg-zinc-950',
      bars: [
        { label: 'K1', value: hitungRataKolom(peserta, 'w_menengah'), barClass: 'bg-zinc-950' },
        { label: 'K2', value: hitungRataKolom(peserta, 'w_panjang'), barClass: 'bg-zinc-600' },
      ],
      legend: 'K1 = Jangka Menengah, K2 = Jangka Panjang',
    },
    {
      num: '03',
      title: 'Wawancara',
      subtitle: 'Pencapaian Seluruh Tujuan',
      swatchClass: 'bg-zinc-950',
      bars: [{ label: 'K3', value: hitungRataKolom(peserta, 'w_tujuan'), barClass: 'bg-zinc-950' }],
      legend: 'K3 = Seluruh Tujuan',
    },
    {
      num: '04',
      title: 'Wawancara',
      subtitle: 'Manfaat Aksi Perubahan',
      swatchClass: 'bg-zinc-700',
      bars: [{ label: 'K4', value: hitungRataKolom(peserta, 'w_manfaat'), barClass: 'bg-zinc-700' }],
      legend: 'K4 = Manfaat Aksi',
    },
    {
      num: '05',
      title: 'Wawancara',
      subtitle: 'Teknik Komunikasi',
      swatchClass: 'bg-zinc-600',
      bars: [{ label: 'K5', value: hitungRataKolom(peserta, 'w_komunikasi'), barClass: 'bg-zinc-600' }],
      legend: 'K5 = Teknik Komunikasi',
    },
  ];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3.5">
        <div className="flex items-center gap-2">
          <BarChartIcon className="h-4 w-4 text-zinc-950" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-950">
            Ringkasan grafik untuk Ekspose (presentasi hasil evaluasi)
          </h2>
          <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
            Skor 0–100 (poin)
          </span>
        </div>
        <Link
          href={eksposeHref}
          className="text-xs font-medium text-zinc-950 underline underline-offset-4 transition hover:text-zinc-600"
        >
          Lihat Semua Slide Ekspose
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

            <div className="pb-1 pt-6">
              <div className="relative h-40">
                <div className="pointer-events-none absolute inset-0 text-[10px] font-normal text-zinc-600">
                  {[100, 80, 60, 40, 20, 0].map((tick) => (
                    <div
                      key={tick}
                      style={{ bottom: `${tick}%` }}
                      className="absolute inset-x-0 flex h-0 items-center"
                    >
                      <span className="w-5 shrink-0 text-right font-mono leading-none tabular-nums">
                        {tick}
                      </span>
                      <div className="ml-1.5 h-px flex-1 bg-zinc-200/80" />
                    </div>
                  ))}
                </div>

                <div className="relative z-10 ml-7 flex h-full items-end justify-center gap-3">
                  {col.bars.map((bar) => {
                    const barHeightPercent = Math.min(Math.max(bar.value, 0), 100);

                    return (
                      <div
                        key={bar.label}
                        className="flex h-full max-w-[38px] flex-1 flex-col items-center justify-end"
                      >
                        <div
                          style={{ height: `${barHeightPercent}%` }}
                          className={`relative w-full rounded-t-sm ${bar.barClass} transition-opacity duration-200 hover:opacity-85`}
                        >
                          <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] font-semibold leading-none text-zinc-950 tabular-nums">
                            {bar.value.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="ml-7 mt-1.5 flex items-center justify-center gap-3">
                {col.bars.map((bar) => (
                  <span
                    key={bar.label}
                    className="max-w-[38px] flex-1 text-center font-mono text-[10px] font-medium text-zinc-600"
                  >
                    {bar.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-center gap-1.5 border-t border-zinc-100 pt-2">
              <span className={`h-2 w-2 shrink-0 rounded-sm ${col.swatchClass}`} aria-hidden="true" />
              <span className="text-[11px] font-medium text-zinc-700">{col.legend}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
