'use client';

import React from 'react';
import { Clock, Trophy, Zap } from 'lucide-react';

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

  const pctValid = total > 0 ? ((valid / total) * 100).toFixed(1) : '0.0';
  const pctKosong = total > 0 ? ((kosong / total) * 100).toFixed(1) : '0.0';

  const validSurvei = ringkasan?.totalValidSurvei ?? 0;
  const lVal = validSurvei > 0 ? (ringkasan?.rataRataSurveiL ?? 0) : 0;
  const mVal = valid > 0 ? (ringkasan?.rataRataWawancaraM ?? 0) : 0;
  const avgBoth =
    validSurvei > 0 || valid > 0
      ? ((lVal + mVal) / (validSurvei > 0 && valid > 0 ? 2 : 1)).toFixed(2)
      : '0.00';

  const maxPos = ringkasan?.selisihTerbesarPositif?.selisih;
  const maxNeg = ringkasan?.selisihTerbesarNegatif?.selisih;
  const hasPos = typeof maxPos === 'number' && !isNaN(maxPos);
  const hasNeg = typeof maxNeg === 'number' && !isNaN(maxNeg);

  // Donut SVG circumference calculation (r = 38 => C = 2 * PI * 38 = 238.76)
  const c = 238.76;
  const dashValid = total > 0 ? ((valid / total) * c).toFixed(1) : '0';
  const dashKosong = total > 0 ? ((kosong / total) * c).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Status Data Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Clock className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Kelengkapan Data</h3>
        </div>

        <div className="flex items-center gap-6 py-4">
          {/* Donut Chart SVG */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                className="text-slate-100"
                strokeWidth="13"
                stroke="currentColor"
                fill="none"
              />
              {/* Green Segment (Lengkap) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                className="text-emerald-500"
                strokeWidth="13"
                strokeDasharray={`${dashValid} ${c}`}
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
              />
              {/* Amber Segment (Kosong) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                className="text-amber-500"
                strokeWidth="13"
                strokeDasharray={`${dashKosong} ${c}`}
                strokeDashoffset={`-${dashValid}`}
                stroke="currentColor"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-slate-900 leading-none">{total}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Peserta</span>
            </div>
          </div>

          {/* Legends */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-800 leading-none">Lengkap</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {valid} ({pctValid}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-800 leading-none">Wawancara Kosong</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {kosong} ({pctKosong}%)
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
          Nilai yang kosong tidak ikut dihitung dalam rata-rata wawancara.
        </p>
      </div>

      {/* 2. Rekap Nilai Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Trophy className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Rata-rata Nilai</h3>
        </div>

        <div className="space-y-3 py-2 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
            <span className="text-slate-600 font-medium">Nilai L (Survei Alumni)</span>
            <span className="font-mono font-bold text-slate-900">{lVal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
            <span className="text-slate-600 font-medium">Nilai M (Wawancara Evaluator)</span>
            <span className="font-mono font-bold text-slate-900">{mVal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 mt-2">
            <span className="text-emerald-950 font-bold">Rata-rata Gabungan</span>
            <span className="font-mono font-black text-emerald-700 text-base">{avgBoth}</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
          {total === 0
            ? 'Belum ada data untuk dihitung.'
            : Number(avgBoth) >= 76
            ? 'Rata-rata nilainya masuk rentang optimal (76–100).'
            : Number(avgBoth) >= 51
            ? 'Rata-rata nilainya masuk rentang baik (51–75).'
            : 'Rata-rata nilainya masih perlu ditingkatkan (< 51).'}
        </p>
      </div>

      {/* 3. Selisih Nilai Ekstrem Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900">Selisih Terbesar</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 py-2">
          {/* Positif */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
              Tertinggi (+)
            </span>
            <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
              {hasPos ? `${maxPos >= 0 ? '+' : ''}${maxPos.toFixed(2)}` : '0.00'}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium mt-1 block truncate">
              {ringkasan?.selisihTerbesarPositif?.nama || (total === 0 ? 'Belum ada data' : 'Wawancara lebih tinggi')}
            </span>
          </div>

          {/* Negatif */}
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-center">
            <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block">
              Terendah (-)
            </span>
            <span className="text-2xl font-black text-rose-700 font-mono mt-1 block">
              {hasNeg ? (maxNeg > 0 ? `-${maxNeg.toFixed(2)}` : maxNeg.toFixed(2)) : '0.00'}
            </span>
            <span className="text-[10px] text-rose-600 font-medium mt-1 block truncate">
              {ringkasan?.selisihTerbesarNegatif?.nama || (total === 0 ? 'Belum ada data' : 'Survei lebih tinggi')}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
          Perbedaan antara penilaian alumni dan penilaian evaluator.
        </p>
      </div>
    </div>
  );
}
