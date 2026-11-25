'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBanner } from '@/components/ui/status-banner';
import { TableSectionSkeleton } from '@/components/ui/page-skeletons';
import { AnalisisTerbukaCard } from '@/components/kegiatan/AnalisisTerbukaCard';
import { fetchJsonWithCache, getClientCache } from '@/lib/client-cache';
import { apiFetchJson, formatClientErrorMessage } from '@/lib/client-error';
import type {
  AnalisisTerbukaKategori,
  AnalisisTerbukaView,
} from '@/lib/ai-jawaban-terbuka';
import type {
  HasilSurveyKegiatanSummary,
  LikertSummarySide,
  SurveyQuestionSummaryItem,
} from '@/lib/survey-summary';

const KELOMPOK_TABS = [
  { key: 'PERILAKU', label: 'Perubahan Perilaku' },
  { key: 'HASIL_KONTRIBUSI', label: 'Dampak & Kontribusi' },
  { key: 'HASIL_AKSI', label: 'Hasil Aksi Perubahan' },
  { key: 'DUKUNGAN', label: 'Faktor Dukungan' },
  { key: 'KENDALA', label: 'Faktor Kendala' },
] as const;

const KATEGORI_URUTAN = [
  { index: 3, label: 'Sangat Sesuai', barClass: 'bg-zinc-950', textClass: 'text-zinc-950 font-semibold' },
  { index: 2, label: 'Sesuai', barClass: 'bg-zinc-700', textClass: 'text-zinc-900 font-medium' },
  { index: 1, label: 'Kurang Sesuai', barClass: 'bg-zinc-400', textClass: 'text-zinc-700' },
  { index: 0, label: 'Tidak Sesuai', barClass: 'bg-zinc-200', textClass: 'text-zinc-600' },
] as const;

function cleanPertanyaanText(raw: string): string {
  return String(raw || '').replace(/^\d+\.\s*/, '').trim();
}

function RespondenSummaryCell({ side }: { side: LikertSummarySide }) {
  if (!side || side.total === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center text-[11px] text-zinc-600">
        Belum ada jawaban
      </div>
    );
  }

  let maxCount = 0;
  for (const cat of KATEGORI_URUTAN) {
    const count = side.counts[cat.index] ?? 0;
    if (count > maxCount) maxCount = count;
  }
  const topCategories = KATEGORI_URUTAN.filter(
    (cat) => (side.counts[cat.index] ?? 0) === maxCount
  );
  const dominantPct = Math.round((maxCount / side.total) * 100);
  const summaryBadgeText =
    topCategories.length > 1
      ? `Seri: ${topCategories.map((c) => c.label).join(' & ')} (${dominantPct}%)`
      : `Jawaban terbanyak: ${topCategories[0].label} (${dominantPct}%)`;

  return (
    <div className="min-w-[275px] space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="inline-flex rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] font-semibold text-white">
          {summaryBadgeText}
        </span>
        <span className="text-[11px] font-medium text-zinc-600">
          {side.total} responden
        </span>
      </div>

      {/* Bilah Proporsi Jawaban Monokrom */}
      <div
        aria-hidden="true"
        className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-200"
      >
        {KATEGORI_URUTAN.map((cat) => {
          const count = side.counts[cat.index] ?? 0;
          if (count <= 0) return null;
          const pct = (count / side.total) * 100;
          return (
            <div
              key={cat.label}
              style={{ width: `${pct}%` }}
              className={cat.barClass}
            />
          );
        })}
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        {KATEGORI_URUTAN.map((cat) => {
          const count = side.counts[cat.index] ?? 0;
          const pct = Math.round((count / side.total) * 100);
          return (
            <div
              key={cat.label}
              className={`flex items-center justify-between gap-1 ${
                count === 0 ? 'text-zinc-600' : cat.textClass
              }`}
            >
              <dt className="whitespace-nowrap">{cat.label}</dt>
              <dd className="shrink-0 tabular-nums">
                {count} ({pct}%)
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

function QuestionTable({ items }: { items: SurveyQuestionSummaryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-zinc-600">
        Belum ada butir pernyataan terimpor untuk kelompok ini.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
        <caption className="sr-only">
          Rekapitulasi pernyataan kuesioner survei beserta sebaran jawaban alumni dan atasan
        </caption>
        <thead className="bg-zinc-50 text-zinc-700">
          <tr>
            <th scope="col" className="w-12 px-3 py-3 font-semibold">No</th>
            <th scope="col" className="px-3 py-3 font-semibold">Aspek &amp; Pernyataan Kuesioner</th>
            <th scope="col" className="px-3 py-3 font-semibold">Penilaian Alumni</th>
            <th scope="col" className="px-3 py-3 font-semibold">Penilaian Atasan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {items.map((q, idx) => (
            <tr key={q.kode} className="align-top hover:bg-zinc-50/70">
              <td className="px-3 py-3.5 font-mono text-zinc-500">{idx + 1}</td>
              <td className="min-w-[240px] max-w-md px-3 py-3.5">
                {q.subDimensi && (
                  <span className="inline-flex rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-800">
                    {q.subDimensi}
                  </span>
                )}
                <p className="mt-1.5 leading-relaxed text-zinc-900">
                  {cleanPertanyaanText(q.pertanyaan)}
                </p>
              </td>
              <td className="px-3 py-3.5">
                <RespondenSummaryCell side={q.alumni} />
              </td>
              <td className="px-3 py-3.5">
                <RespondenSummaryCell side={q.atasan} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HasilSurveiPage({
  params,
}: {
  params: { id: string };
}) {
  const apiUrl = `/api/kegiatan/${params.id}/hasil-survei`;
  const cached = getClientCache<{
    success: boolean;
    data: HasilSurveyKegiatanSummary;
  }>(apiUrl);

  const [summary, setSummary] = useState<HasilSurveyKegiatanSummary | null>(
    cached?.data?.data ?? null
  );
  const [loading, setLoading] = useState(!cached?.data?.data);
  const [error, setError] = useState<string | null>(null);

  const analisisUrl = `/api/kegiatan/${params.id}/analisis-terbuka`;
  const [analisisMap, setAnalisisMap] = useState<
    Record<AnalisisTerbukaKategori, AnalisisTerbukaView> | null
  >(null);
  const [analisisLoading, setAnalisisLoading] = useState(true);
  const [analyzingKat, setAnalyzingKat] = useState<AnalisisTerbukaKategori | null>(null);
  const [analisisErrors, setAnalisisErrors] = useState<
    Partial<Record<AnalisisTerbukaKategori, string | null>>
  >({});

  useEffect(() => {
    let active = true;
    async function loadAnalisis() {
      try {
        setAnalisisLoading(true);
        const json = await apiFetchJson<{
          success: boolean;
          data?: Record<AnalisisTerbukaKategori, AnalisisTerbukaView>;
          error?: string;
        }>(analisisUrl, {
          fallbackError: 'Gagal memuat analisis tema jawaban terbuka.',
        });
        if (!active) return;
        if (json.success && json.data) {
          setAnalisisMap(json.data);
        }
      } catch (err: unknown) {
        if (!active) return;
        const msg = formatClientErrorMessage(
          err,
          'Gagal memuat analisis tema jawaban terbuka.'
        );
        setAnalisisErrors({
          kendala_survei: msg,
          dukungan_survei: msg,
          deskripsi_wawancara: msg,
        });
      } finally {
        if (active) setAnalisisLoading(false);
      }
    }
    void loadAnalisis();
    return () => {
      active = false;
    };
  }, [analisisUrl]);

  async function handleAnalyzeKategori(kategori: AnalisisTerbukaKategori) {
    setAnalyzingKat(kategori);
    setAnalisisErrors((prev) => ({ ...prev, [kategori]: null }));
    try {
      const json = await apiFetchJson<{
        success: boolean;
        data?: Record<AnalisisTerbukaKategori, AnalisisTerbukaView>;
        error?: string;
      }>(analisisUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kategori }),
        fallbackError: 'Gagal menjalankan analisis tema AI. Coba lagi beberapa saat.',
      });
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Gagal menjalankan analisis tema AI.');
      }
      setAnalisisMap(json.data);
    } catch (err: unknown) {
      setAnalisisErrors((prev) => ({
        ...prev,
        [kategori]: formatClientErrorMessage(
          err,
          'Gagal menjalankan analisis tema AI. Coba lagi beberapa saat.'
        ),
      }));
    } finally {
      setAnalyzingKat((curr) => (curr === kategori ? null : curr));
    }
  }

  useEffect(() => {
    let active = true;
    async function load(silent = false) {
      try {
        if (!silent) setLoading(true);
        const { data: json } = await fetchJsonWithCache<{
          success: boolean;
          data?: HasilSurveyKegiatanSummary;
          error?: string;
        }>(apiUrl, { force: silent });
        if (!active) return;
        if (!json.success || !json.data) {
          if (!silent) {
            setError(json.error || 'Gagal memuat hasil survei. Coba muat ulang halaman.');
          }
          return;
        }
        setSummary(json.data);
      } catch (err: any) {
        if (active && !silent) {
          setError(
            formatClientErrorMessage(
              err,
              'Gagal memuat hasil survei. Coba muat ulang halaman.'
            )
          );
        }
      } finally {
        if (active && !silent) setLoading(false);
      }
    }
    const hasCached = Boolean(cached?.data?.data);
    void load(hasCached);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  if (loading) {
    return <TableSectionSkeleton rows={6} />;
  }

  if (error || !summary) {
    return (
      <StatusBanner
        tone="error"
        title="Gagal memuat hasil survei"
        message={error || 'Data survei belum tersedia. Coba muat ulang halaman.'}
      />
    );
  }

  const totalRespondenKuesioner =
    summary.jumlahRespondenAlumni + summary.jumlahRespondenAtasan;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Responden survei</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">
            {totalRespondenKuesioner} responden
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {summary.jumlahRespondenAlumni} alumni dan {summary.jumlahRespondenAtasan} atasan, dari{' '}
            {summary.totalPeserta} peserta terdaftar
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Mutasi jabatan peserta</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">
            {summary.mutasiJabatan.berubah} peserta berubah jabatan · {summary.mutasiJabatan.tetap}{' '}
            tetap
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Belum terdata: {summary.mutasiJabatan.tidakDiketahui} peserta
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Metode pelaksanaan</p>
          <div className="mt-2 space-y-1 text-xs text-zinc-800">
            {summary.metodePelaksanaan.length === 0 ? (
              <p className="text-zinc-500">Belum tercatat di Excel</p>
            ) : (
              summary.metodePelaksanaan.slice(0, 3).map((m) => (
                <div key={m.metode} className="flex justify-between gap-2">
                  <span className="truncate">{m.metode}</span>
                  <span className="font-mono font-semibold text-zinc-950">{m.jumlah} peserta</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Sebaran asal instansi</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">
            {summary.instansiList.length} instansi
          </p>
          <p className="mt-1 truncate text-xs text-zinc-500">
            {summary.instansiList[0]
              ? `Terbanyak: ${summary.instansiList[0].instansi} (${summary.instansiList[0].jumlah} peserta)`
              : 'Belum ada data instansi'}
          </p>
        </div>
      </div>

      {/* Ringkasan Jawaban Kuesioner per Kelompok */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 border-b border-zinc-200 pb-3.5">
          <h2 className="text-base font-semibold text-zinc-950">
            Ringkasan Jawaban Survei (Alumni dan Atasan)
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Perbandingan jawaban alumni dan atasan untuk setiap pernyataan, dalam jumlah dan persen.
          </p>
        </div>

        <Tabs defaultValue="PERILAKU">
          <TabsList className="mb-4 h-auto flex-wrap justify-start gap-1">
            {KELOMPOK_TABS.map((t) => {
              const count = (summary.pertanyaanByKelompok[t.key] || []).length;
              return (
                <TabsTrigger key={t.key} value={t.key} className="text-xs">
                  {t.label} ({count} pertanyaan)
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="CATATAN_WAWANCARA" className="text-xs">
              Catatan Wawancara (
              {analisisMap?.deskripsi_wawancara.totalTeksAktual ?? '...'} catatan)
            </TabsTrigger>
          </TabsList>

          {KELOMPOK_TABS.map((t) => (
            <TabsContent key={t.key} value={t.key} className="space-y-4">
              <QuestionTable items={summary.pertanyaanByKelompok[t.key] || []} />

              {t.key === 'DUKUNGAN' && (
                <AnalisisTerbukaCard
                  data={analisisMap?.dukungan_survei ?? null}
                  loading={analisisLoading}
                  analyzing={analyzingKat === 'dukungan_survei'}
                  error={analisisErrors.dukungan_survei ?? null}
                  onAnalyze={() => void handleAnalyzeKategori('dukungan_survei')}
                  onDismissError={() =>
                    setAnalisisErrors((prev) => ({ ...prev, dukungan_survei: null }))
                  }
                />
              )}

              {t.key === 'DUKUNGAN' && summary.dukunganTerbuka.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <h3 className="text-xs font-semibold text-zinc-950">
                    Catatan Terbuka Faktor Dukungan ({summary.dukunganTerbuka.length} catatan)
                  </h3>
                  <ul className="mt-2.5 max-h-64 space-y-2 overflow-y-auto text-xs text-zinc-700">
                    {summary.dukunganTerbuka.map((item, idx) => (
                      <li key={idx} className="rounded-lg border border-zinc-200 bg-white p-2.5">
                        <span className="font-semibold text-zinc-950">
                          {item.pesertaNama} ({item.responden === 'atasan' ? 'Atasan' : 'Alumni'}):{' '}
                        </span>
                        <span>{item.teks}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {t.key === 'KENDALA' && (
                <AnalisisTerbukaCard
                  data={analisisMap?.kendala_survei ?? null}
                  loading={analisisLoading}
                  analyzing={analyzingKat === 'kendala_survei'}
                  error={analisisErrors.kendala_survei ?? null}
                  onAnalyze={() => void handleAnalyzeKategori('kendala_survei')}
                  onDismissError={() =>
                    setAnalisisErrors((prev) => ({ ...prev, kendala_survei: null }))
                  }
                />
              )}

              {t.key === 'KENDALA' && summary.kendalaTerbuka.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <h3 className="text-xs font-semibold text-zinc-950">
                    Catatan Terbuka Faktor Kendala ({summary.kendalaTerbuka.length} catatan)
                  </h3>
                  <ul className="mt-2.5 max-h-64 space-y-2 overflow-y-auto text-xs text-zinc-700">
                    {summary.kendalaTerbuka.map((item, idx) => (
                      <li key={idx} className="rounded-lg border border-zinc-200 bg-white p-2.5">
                        <span className="font-semibold text-zinc-950">
                          {item.pesertaNama} ({item.responden === 'atasan' ? 'Atasan' : 'Alumni'}):{' '}
                        </span>
                        <span>{item.teks}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          ))}

          <TabsContent value="CATATAN_WAWANCARA" className="space-y-4">
            <AnalisisTerbukaCard
              data={analisisMap?.deskripsi_wawancara ?? null}
              loading={analisisLoading}
              analyzing={analyzingKat === 'deskripsi_wawancara'}
              error={analisisErrors.deskripsi_wawancara ?? null}
              onAnalyze={() => void handleAnalyzeKategori('deskripsi_wawancara')}
              onDismissError={() =>
                setAnalisisErrors((prev) => ({ ...prev, deskripsi_wawancara: null }))
              }
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
