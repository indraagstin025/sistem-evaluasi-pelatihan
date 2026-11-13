'use client';

import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

interface ChartColumnData {
  num: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  barColor: string;
  bars: { label: string; value: number }[];
  legend: string;
  legendColor: string;
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
      num: '1',
      badgeBg: 'bg-blue-600',
      title: 'Survei Alumni',
      subtitle: '(Aksi Perubahan)',
      barColor: 'bg-[#3B82F6]',
      bars: [
        { label: 'P1', value: hitungRataKolom(peserta, 's_panjang', 25) },
        { label: 'P2', value: hitungRataKolom(peserta, 's_tujuan', 25) },
        { label: 'P3', value: hitungRataKolom(peserta, 's_manfaat', 25) },
      ],
      legend: '• P1   • P2   • P3',
      legendColor: 'text-[#3B82F6]',
    },
    {
      num: '2',
      badgeBg: 'bg-emerald-500',
      title: 'Wawancara',
      subtitle: '(Menengah & Panjang)',
      barColor: 'bg-[#10B981]',
      bars: [
        { label: 'K1', value: hitungRataKolom(peserta, 'w_menengah') },
        { label: 'K2', value: hitungRataKolom(peserta, 'w_panjang') },
      ],
      legend: '• K1   • K2',
      legendColor: 'text-[#10B981]',
    },
    {
      num: '3',
      badgeBg: 'bg-blue-600',
      title: 'Wawancara',
      subtitle: '(Seluruh Tujuan)',
      barColor: 'bg-[#3B82F6]',
      bars: [{ label: 'K3', value: hitungRataKolom(peserta, 'w_tujuan') }],
      legend: '• K3',
      legendColor: 'text-[#3B82F6]',
    },
    {
      num: '4',
      badgeBg: 'bg-amber-500',
      title: 'Wawancara',
      subtitle: '(Manfaat Aksi)',
      barColor: 'bg-[#F59E0B]',
      bars: [{ label: 'K4', value: hitungRataKolom(peserta, 'w_manfaat') }],
      legend: '• K4',
      legendColor: 'text-[#F59E0B]',
    },
    {
      num: '5',
      badgeBg: 'bg-cyan-500',
      title: 'Wawancara',
      subtitle: '(Komunikasi)',
      barColor: 'bg-[#06B6D4]',
      bars: [{ label: 'K5', value: hitungRataKolom(peserta, 'w_komunikasi') }],
      legend: '• K5',
      legendColor: 'text-[#06B6D4]',
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-gray-900">Ringkasan Grafik Ekspose</h2>
        </div>
        <Link
          href="/ekspose"
          className="text-xs font-medium text-gray-700 hover:text-emerald-600 transition-colors"
        >
          Lihat Semua Grafik →
        </Link>
      </div>

      {/* 5 Segmented Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {columns.map((col, idx) => (
          <div key={col.num} className={`flex flex-col justify-between ${idx > 0 ? 'md:pl-4 pt-4 md:pt-0' : ''}`}>
            {/* Title with circular badge */}
            <div className="flex items-start gap-2 mb-3">
              <span className={`w-5 h-5 rounded-full ${col.badgeBg} text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5`}>
                {col.num}
              </span>
              <div>
                <p className="text-xs font-semibold text-gray-900 leading-tight">{col.title}</p>
                <p className="text-[11px] text-gray-500 leading-tight">{col.subtitle}</p>
              </div>
            </div>

            {/* Chart Area with Sumbu Y & Horizontal Gridlines */}
            <div className="relative h-44 flex items-end pt-5 pb-1">
              {/* Y-Axis Labels & Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] text-gray-400">
                {[100, 80, 60, 40, 20, 0].map((tick) => (
                  <div key={tick} className="flex items-center gap-1.5 w-full">
                    <span className="w-4 text-right shrink-0">{tick}</span>
                    <div className="h-px bg-gray-100 flex-1" />
                  </div>
                ))}
              </div>

              {/* Bars Container */}
              <div className="relative z-10 flex-1 ml-6 h-full flex items-end justify-center gap-2.5">
                {col.bars.map((bar) => {
                  const barHeightPercent = Math.min(Math.max(bar.value, 0), 100);

                  return (
                    <div key={bar.label} className="flex flex-col items-center justify-end h-full flex-1 max-w-[42px] group">
                      <span className="text-[10px] font-bold text-gray-900 mb-1 leading-none">
                        {bar.value.toFixed(1)}
                      </span>
                      <div
                        style={{ height: `${barHeightPercent * 0.78}%` }}
                        className={`w-full ${col.barColor} rounded-t transition-all duration-300 group-hover:opacity-90`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="text-center mt-2.5 pt-2 border-t border-gray-50">
              <span className={`text-[11px] font-semibold tracking-wide ${col.legendColor}`}>
                {col.legend}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
