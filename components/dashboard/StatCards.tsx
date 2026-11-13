'use client';

import React from 'react';
import { Users, BarChart3, Scale } from 'lucide-react';

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
  const total = ringkasan?.totalPeserta ?? 30;
  const lVal = ringkasan?.rataRataSurveiL !== undefined ? ringkasan.rataRataSurveiL.toFixed(2) : '85.24';
  const mVal = ringkasan?.rataRataWawancaraM !== undefined ? ringkasan.rataRataWawancaraM.toFixed(2) : '83.17';

  const maxPos = ringkasan?.selisihTerbesarPositif?.selisih;
  const maxNeg = ringkasan?.selisihTerbesarNegatif?.selisih;

  const selisihDisplay = maxPos !== undefined ? `+${maxPos.toFixed(2)}` : '+16.67';
  const subSelisih =
    maxPos !== undefined && maxNeg !== undefined
      ? `(+${maxPos.toFixed(2)} / ${maxNeg.toFixed(2)})`
      : '(+16.67 / -40.00)';

  const stats = [
    {
      id: 'peserta',
      title: 'Total Peserta',
      value: String(total),
      trend: `N=${ringkasan?.totalValidSurvei ?? 30} Survei`,
      trendColor: 'text-emerald-700',
      icon: Users,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      sparkPath: 'M0 14 C20 18, 40 4, 60 12 C80 18, 95 2, 110 0',
      sparkStroke: '#10B981',
    },
    {
      id: 'l',
      title: 'Rata-rata L (Survei)',
      value: lVal,
      trend: 'Rentang Optimal',
      trendColor: 'text-emerald-700',
      icon: BarChart3,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      sparkPath: 'M0 16 C25 18, 45 6, 70 10 C90 14, 100 2, 110 0',
      sparkStroke: '#10B981',
    },
    {
      id: 'm',
      title: 'Rata-rata M (Wawancara)',
      value: mVal,
      trend: `N=${ringkasan?.totalValidWawancara ?? 29} Valid`,
      trendColor: 'text-emerald-700',
      icon: BarChart3,
      iconBg: 'bg-emerald-800',
      iconColor: 'text-white',
      sparkPath: 'M0 14 C20 16, 40 10, 60 14 C80 8, 95 4, 110 0',
      sparkStroke: '#10B981',
    },
    {
      id: 'selisih',
      title: 'Selisih Terbesar',
      value: selisihDisplay,
      trend: subSelisih,
      trendColor: 'text-slate-500',
      icon: Scale,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      sparkPath: 'M0 10 C20 18, 40 2, 60 14 C70 12, 75 0, 80 0',
      sparkStroke: '#10B981',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                <p className="text-[28px] font-black text-slate-900 mt-1 leading-tight tracking-tight">
                  {stat.value}
                </p>
              </div>

              <div className={`w-10 h-10 rounded-xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-[11px] font-bold ${stat.trendColor}`}>
                {stat.trend}
              </span>

              {/* Sparkline Visual */}
              <svg width="80" height="20" viewBox="0 0 110 20" fill="none" className="opacity-70">
                <path d={stat.sparkPath} stroke={stat.sparkStroke} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
