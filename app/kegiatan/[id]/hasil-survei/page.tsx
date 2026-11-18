'use client';

import React, { useEffect, useState } from 'react';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBanner } from '@/components/ui/status-banner';
import type {
  HasilSurveyKegiatanSummary,
  SurveyQuestionSummaryItem,
} from '@/lib/survey-summary';

const KELOMPOK_TABS = [
  { key: 'PERILAKU', label: 'Perilaku (Level 3)' },
  { key: 'HASIL_KONTRIBUSI', label: 'Hasil & Kontribusi' },
  { key: 'HASIL_AKSI', label: 'Aksi Perubahan (Level 4)' },
  { key: 'DUKUNGAN', label: 'Faktor Dukungan' },
  { key: 'KENDALA', label: 'Faktor Kendala' },
] as const;

function QuestionTable({ items }: { items: SurveyQuestionSummaryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-zinc-600">
        Belum ada item kuesioner terimpor untuk kelompok ini.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
        <thead className="bg-zinc-50 text-zinc-700">
          <tr>
            <th className="px-3 py-2.5 font-semibold">No</th>
            <th className="px-3 py-2.5 font-semibold">Dimensi &amp; Pernyataan</th>
            <th className="px-3 py-2.5 text-center font-semibold">Alumni (n / Rata2)</th>
            <th className="px-3 py-2.5 text-center font-semibold">
              Distribusi Alumni (1/2/3/4)
            </th>
            <th className="px-3 py-2.5 text-center font-semibold">Atasan (n / Rata2)</th>
            <th className="px-3 py-2.5 text-center font-semibold">
              Distribusi Atasan (1/2/3/4)
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {items.map((q) => (
            <tr key={q.kode} className="hover:bg-zinc-50">
              <td className="px-3 py-2.5 font-mono text-zinc-500">{q.urutan}</td>
              <td className="max-w-md px-3 py-2.5">
                {q.subDimensi && (
                  <div className="text-[11px] font-semibold text-zinc-500">
                    {q.subDimensi}
                  </div>
                )}
                <div className="mt-0.5 text-zinc-900">{q.pertanyaan}</div>
              </td>
              <td className="px-3 py-2.5 text-center font-mono">
                <div className="font-semibold text-zinc-950">
                  {q.alumni.rataRata !== null ? q.alumni.rataRata.toFixed(2) : '-'}
                </div>
                <div className="text-[11px] text-zinc-500">n={q.alumni.total}</div>
              </td>
              <td className="px-3 py-2.5 text-center font-mono text-[11px] text-zinc-700">
                {q.alumni.counts.join(' / ')}
              </td>
              <td className="px-3 py-2.5 text-center font-mono">
                <div className="font-semibold text-zinc-950">
                  {q.atasan.rataRata !== null ? q.atasan.rataRata.toFixed(2) : '-'}
                </div>
                <div className="text-[11px] text-zinc-500">n={q.atasan.total}</div>
              </td>
              <td className="px-3 py-2.5 text-center font-mono text-[11px] text-zinc-700">
                {q.atasan.counts.join(' / ')}
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
  const [summary, setSummary] = useState<HasilSurveyKegiatanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/kegiatan/${params.id}/hasil-survei`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (!active) return;
        if (!res.ok || !json.success) {
          setError(json.error || 'Gagal memuat hasil survei keseluruhan.');
          return;
        }
        setSummary(json.data);
      } catch {
        if (active) setError('Terjadi gangguan koneksi saat memuat hasil survei.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8">
        <ReloadIcon className="h-5 w-5 animate-spin text-zinc-700" aria-hidden="true" />
        <p className="mt-2.5 text-sm font-medium text-zinc-700">
          Menghitung ringkasan hasil survei keseluruhan...
        </p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <StatusBanner
        tone="error"
        title="Gagal memuat hasil survei"
        message={error || 'Data tidak tersedia.'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Umum & Mutasi Jabatan (Bab 6.7 / Bahan Ekspose) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Responden Survei</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">
            {summary.jumlahRespondenAlumni} Alumni · {summary.jumlahRespondenAtasan} Atasan
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Dari total {summary.totalPeserta} peserta terdaftar
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Mutasi Jabatan Peserta</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">
            {summary.mutasiJabatan.berubah} Berubah · {summary.mutasiJabatan.tetap} Tetap
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Belum teridentifikasi: {summary.mutasiJabatan.tidakDiketahui}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Metode Pelaksanaan</p>
          <div className="mt-2 space-y-1 text-xs text-zinc-800">
            {summary.metodePelaksanaan.length === 0 ? (
              <p className="text-zinc-500">Belum tercatat pada Excel</p>
            ) : (
              summary.metodePelaksanaan.slice(0, 3).map((m) => (
                <div key={m.metode} className="flex justify-between gap-2">
                  <span className="truncate">{m.metode}</span>
                  <span className="font-mono font-semibold text-zinc-950">{m.jumlah}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Sebaran Asal Instansi</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">
            {summary.instansiList.length} Instansi
          </p>
          <p className="mt-1 truncate text-xs text-zinc-500">
            {summary.instansiList[0]
              ? `Terbanyak: ${summary.instansiList[0].instansi} (${summary.instansiList[0].jumlah})`
              : 'Belum ada data instansi'}
          </p>
        </div>
      </div>

      {/* Ringkasan Kuesioner per Kelompok */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 border-b border-zinc-200 pb-3.5">
          <h2 className="text-base font-semibold text-zinc-950">
            Ringkasan Kuesioner Keseluruhan (Alumni vs Atasan)
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Distribusi skor 1 (Tidak Sesuai / Tidak Tercapai) hingga 4 (Sangat Sesuai /
            Sangat Tercapai) dari seluruh responden survei sebagai bahan penyusunan kesimpulan
            Ekspose.
          </p>
        </div>

        <Tabs defaultValue="PERILAKU">
          <TabsList className="mb-4 h-auto flex-wrap justify-start gap-1">
            {KELOMPOK_TABS.map((t) => {
              const count = (summary.pertanyaanByKelompok[t.key] || []).length;
              return (
                <TabsTrigger key={t.key} value={t.key} className="text-xs">
                  {t.label} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>

          {KELOMPOK_TABS.map((t) => (
            <TabsContent key={t.key} value={t.key} className="space-y-4">
              <QuestionTable items={summary.pertanyaanByKelompok[t.key] || []} />

              {t.key === 'DUKUNGAN' && summary.dukunganTerbuka.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <h3 className="text-xs font-semibold text-zinc-950">
                    Catatan Terbuka Faktor Pendukung ({summary.dukunganTerbuka.length})
                  </h3>
                  <ul className="mt-2.5 max-h-64 space-y-2 overflow-y-auto text-xs text-zinc-700">
                    {summary.dukunganTerbuka.map((item, idx) => (
                      <li key={idx} className="rounded-lg border border-zinc-200 bg-white p-2.5">
                        <span className="font-semibold text-zinc-950">
                          {item.pesertaNama} ({item.responden}):{' '}
                        </span>
                        <span>{item.teks}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {t.key === 'KENDALA' && summary.kendalaTerbuka.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <h3 className="text-xs font-semibold text-zinc-950">
                    Catatan Terbuka Faktor Kendala ({summary.kendalaTerbuka.length})
                  </h3>
                  <ul className="mt-2.5 max-h-64 space-y-2 overflow-y-auto text-xs text-zinc-700">
                    {summary.kendalaTerbuka.map((item, idx) => (
                      <li key={idx} className="rounded-lg border border-zinc-200 bg-white p-2.5">
                        <span className="font-semibold text-zinc-950">
                          {item.pesertaNama} ({item.responden}):{' '}
                        </span>
                        <span>{item.teks}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </div>
  );
}
