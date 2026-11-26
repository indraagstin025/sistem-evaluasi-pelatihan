'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  MagicWandIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import { StatusBanner } from '@/components/ui/status-banner';
import { AI_OPEN_TEXT_MIN_RECORDS } from '@/lib/ekspose-config';
import type { AnalisisTerbukaView } from '@/lib/ai-jawaban-terbuka';

interface AnalisisTerbukaCardProps {
  data: AnalisisTerbukaView | null;
  loading: boolean;
  analyzing: boolean;
  error: string | null;
  onAnalyze: () => void;
  onDismissError?: () => void;
}

function formatWaktuIndonesia(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function shortModelLabel(modelUsed: string | null): string | null {
  if (!modelUsed) return null;
  return modelUsed.replace(/^models\//, '');
}

export function AnalisisTerbukaCard({
  data,
  loading,
  analyzing,
  error,
  onAnalyze,
  onDismissError,
}: AnalisisTerbukaCardProps) {
  const [expandedThemes, setExpandedThemes] = useState<Record<string, boolean>>({});

  const toggleTheme = (key: string) => {
    setExpandedThemes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="h-4 w-56 animate-pulse rounded bg-zinc-200" />
        <div className="mt-2 h-3 w-80 animate-pulse rounded bg-zinc-200" />
      </div>
    );
  }

  if (!data) {
    return error ? (
      <StatusBanner
        tone="error"
        title="Gagal memuat analisis tema"
        message={error}
        onDismiss={onDismissError}
      />
    ) : null;
  }

  const hasData = data.totalTeksAktual > 0;
  const hasEnoughData = data.totalTeksAktual >= AI_OPEN_TEXT_MIN_RECORDS;
  const modelLabel = shortModelLabel(data.modelUsed);
  const updatedLabel = formatWaktuIndonesia(data.updatedAt);

  return (
    <div className="space-y-4 rounded-xl border border-zinc-300 bg-zinc-50/80 p-4 sm:p-5">
      {/* Header & Tombol Aksi */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-950">{data.judul}</h3>
            <span className="inline-flex rounded border border-zinc-400 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700">
              Anonim · Terverifikasi Data
            </span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-600">{data.deskripsi}</p>
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={analyzing || !hasEnoughData}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <ReloadIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Menganalisis Tema...
            </>
          ) : (
            <>
              <MagicWandIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {data.hasSavedResult ? 'Perbarui Analisis AI' : 'Analisis Tema dengan AI'}
            </>
          )}
        </button>
      </div>

      {/* Metadata Status */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
        <span className="rounded border border-zinc-300 bg-white px-2 py-0.5 font-medium text-zinc-800 tabular-nums">
          {data.totalTeksAktual} catatan · {data.totalPesertaAktual} peserta
        </span>
        {data.hasSavedResult && (
          <>
            <span
              className={
                data.sumber === 'ai'
                  ? 'rounded border border-zinc-900 bg-zinc-950 px-2 py-0.5 font-semibold text-white'
                  : 'rounded border border-zinc-400 bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-800'
              }
            >
              {data.sumber === 'ai' ? 'AI (Gemini)' : 'Templat Deterministik'}
            </span>
            {modelLabel && (
              <span className="font-mono text-[10px] text-zinc-600">{modelLabel}</span>
            )}
            {updatedLabel && (
              <span className="text-zinc-500">Diperbarui {updatedLabel} WIB</span>
            )}
          </>
        )}
      </div>

      {error && (
        <StatusBanner
          tone="error"
          title="Analisis gagal"
          message={error}
          onDismiss={onDismissError}
        />
      )}

      {data.hasSavedResult && data.isStale && (
        <StatusBanner
          tone="warning"
          title="Data jawaban berubah"
          message={`Jumlah catatan aktual (${data.totalTeksAktual}) berbeda dari analisis tersimpan (${data.totalTeksTersimpan}). Klik "Perbarui Analisis AI" agar tema sesuai data terbaru.`}
        />
      )}

      {data.hasSavedResult && data.sumber === 'template' && data.catatan && (
        <StatusBanner
          tone="info"
          title="Menggunakan templat cadangan"
          message={data.catatan}
        />
      )}

      {/* Isi Daftar Tema */}
      {!hasData ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-6 text-center text-xs text-zinc-600">
          Belum ada jawaban terbuka yang terisi untuk {data.sumberLabel.toLowerCase()}.
        </div>
      ) : !hasEnoughData ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-5 text-xs leading-relaxed text-zinc-700">
          Data jawaban terbuka belum cukup untuk dikelompokkan AI (baru tersedia{' '}
          <strong className="text-zinc-950">{data.totalTeksAktual} catatan</strong>; minimal{' '}
          <strong className="text-zinc-950">{AI_OPEN_TEXT_MIN_RECORDS} catatan</strong>).
        </div>
      ) : !data.hasSavedResult ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-5 text-xs leading-relaxed text-zinc-700">
          Tersedia <strong className="text-zinc-950">{data.totalTeksAktual} catatan</strong> dari{' '}
          <strong className="text-zinc-950">{data.totalPesertaAktual} peserta</strong>. Klik{' '}
          <strong className="text-zinc-950">&ldquo;Analisis Tema dengan AI&rdquo;</strong> untuk
          mengelompokkan jawaban secara otomatis. Hanya teks anonim (tanpa nama dan NIP) yang
          dikirim ke Gemini, dan setiap hitungan diverifikasi oleh server terhadap jawaban asli.
        </div>
      ) : (
        <div className="space-y-3">
          {data.temas.map((tema, idx) => {
            const themeKey = `${data.kategori}-${idx}-${tema.namaTema}`;
            const isOpen = Boolean(expandedThemes[themeKey]);
            return (
              <article
                key={themeKey}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 font-mono text-[10px] font-semibold text-white">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-semibold text-zinc-950 sm:text-sm">
                        {tema.namaTema}
                      </h4>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-700">
                      {tema.ringkasan}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
                    <span className="inline-flex rounded border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-[11px] font-semibold text-white tabular-nums">
                      {tema.jumlah} catatan ({tema.persentase}%)
                    </span>
                    <span className="text-[11px] font-medium text-zinc-600 tabular-nums">
                      {tema.jumlahPeserta} peserta unik
                    </span>
                  </div>
                </div>

                {/* Bilah Proporsi */}
                <div
                  aria-hidden="true"
                  className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200"
                >
                  <div
                    className="h-full rounded-full bg-zinc-950 transition-all"
                    style={{ width: `${Math.max(4, Math.min(100, tema.persentase))}%` }}
                  />
                </div>

                {/* Tombol Penelusuran Sumber Jawaban Asli */}
                <div className="mt-3 border-t border-zinc-200 pt-2.5">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleTheme(themeKey)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-zinc-400 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-900 transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                  >
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                    {isOpen
                      ? `Sembunyikan ${tema.sumberItems.length} jawaban asli`
                      : `Telusuri ${tema.sumberItems.length} jawaban asli`}
                  </button>

                  {isOpen && (
                    <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1 text-xs">
                      {tema.sumberItems.map((item) => (
                        <li
                          key={item.recordId}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-zinc-950">
                                {item.pesertaNama}
                              </span>
                              <span className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-700">
                                {item.labelKonteks}
                              </span>
                            </div>
                            <Link
                              href={item.linkWawancara}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-950"
                            >
                              Buka Wawancara
                              <ExternalLinkIcon className="h-3 w-3" aria-hidden="true" />
                            </Link>
                          </div>
                          <p className="mt-1.5 whitespace-pre-line leading-relaxed text-zinc-700">
                            {item.teks}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
