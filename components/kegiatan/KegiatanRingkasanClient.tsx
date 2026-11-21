'use client';

import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import StatCards from '@/components/dashboard/StatCards';
import WarningBanner from '@/components/dashboard/WarningBanner';
import ChartEksposeOverview from '@/components/dashboard/ChartEksposeOverview';
import KegiatanWorkflowChecklist from '@/components/kegiatan/KegiatanWorkflowChecklist';
import { StatusBanner } from '@/components/ui/status-banner';
import { TablePagination } from '@/components/ui/table-pagination';
import { KegiatanRingkasanSkeleton } from '@/components/ui/page-skeletons';
import {
  fetchJsonWithCache,
  getClientCache,
  setClientCache,
} from '@/lib/client-cache';

interface KegiatanRingkasanClientProps {
  kegiatanId: string;
  initialData?: any;
}

function getSurveySkor(p: any, kode: string): number | null {
  const found = (p.survey || []).find((s: any) => s.kode === kode);
  return typeof found?.skor === 'number' ? found.skor : null;
}

function getWawancaraNilai(p: any, kriteria: string): number | null {
  const found = (p.wawancara || []).find((w: any) => w.kriteria === kriteria);
  return typeof found?.nilai === 'number' ? found.nilai : null;
}

function formatNum(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || Number.isNaN(v)) return 'Belum dinilai';
  return Number(v).toFixed(digits);
}

export default function KegiatanRingkasanClient({
  kegiatanId,
  initialData,
}: KegiatanRingkasanClientProps) {
  const apiUrl = `/api/kegiatan/${kegiatanId}`;
  const cachedEntry = initialData ? null : getClientCache<{ success: boolean; data: any }>(apiUrl);

  const [data, setData] = useState<any>(initialData ?? cachedEntry?.data?.data ?? null);
  const [loading, setLoading] = useState(!initialData && !cachedEntry?.data?.data);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [filterStatus, setFilterStatus] = useState<'semua' | 'kosong' | 'lengkap'>('semua');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadData = async (options?: { force?: boolean; silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true);
      setError(null);
      const { data: json } = await fetchJsonWithCache<{
        success: boolean;
        data?: any;
        error?: string;
      }>(apiUrl, { force: options?.force });
      if (!json.success) {
        if (!options?.silent) {
          setError(json.error || 'Gagal memuat ringkasan kegiatan. Coba muat ulang halaman.');
        }
        return;
      }
      setData(json.data);
    } catch (err: any) {
      if (!options?.silent) {
        setError(
          err?.message ||
            'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.'
        );
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setClientCache(apiUrl, { success: true, data: initialData });
      setLoading(false);
      return;
    }
    const existing = getClientCache<{ success: boolean; data: any }>(apiUrl);
    if (existing?.data?.data) {
      setData(existing.data.data);
      setLoading(false);
      void loadData({ force: true, silent: true });
      return;
    }
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kegiatanId, initialData]);

  const peserta: any[] = data?.peserta || [];
  const selisihImport: any[] = data?.selisihImport || [];

  const computed = useMemo(() => {
    const chartPeserta = peserta.map((p) => ({
      id: p.id,
      nama: p.nama,
      s_panjang: getSurveySkor(p, 'L4_01'),
      s_tujuan: getSurveySkor(p, 'L4_02'),
      s_manfaat: getSurveySkor(p, 'L4_03'),
      w_menengah: getWawancaraNilai(p, 'menengah'),
      w_panjang: getWawancaraNilai(p, 'jangkaPanjang'),
      w_tujuan: getWawancaraNilai(p, 'seluruhTujuan'),
      w_manfaat: getWawancaraNilai(p, 'manfaat'),
      w_komunikasi: getWawancaraNilai(p, 'komunikasi'),
    }));

    const daftarKosong = peserta.filter((p) => {
      const m = p.hasil?.rataWawancaraM;
      return m === null || m === undefined;
    });

    const validSurvei = peserta.filter(
      (p) => typeof p.hasil?.rataSurveiL === 'number'
    );
    const validWawancara = peserta.filter(
      (p) => typeof p.hasil?.rataWawancaraM === 'number'
    );
    const validSelisih = peserta.filter(
      (p) => typeof p.hasil?.selisih === 'number'
    );

    const rataRataSurveiL =
      validSurvei.length > 0
        ? validSurvei.reduce((a, p) => a + p.hasil.rataSurveiL, 0) / validSurvei.length
        : 0;
    const rataRataWawancaraM =
      validWawancara.length > 0
        ? validWawancara.reduce((a, p) => a + p.hasil.rataWawancaraM, 0) /
          validWawancara.length
        : 0;

    let selisihTerbesarPositif: any = null;
    let selisihTerbesarNegatif: any = null;
    for (const p of validSelisih) {
      const val = p.hasil.selisih;
      if (!selisihTerbesarPositif || val > selisihTerbesarPositif.selisih) {
        selisihTerbesarPositif = { nama: p.nama, selisih: val };
      }
      if (!selisihTerbesarNegatif || val < selisihTerbesarNegatif.selisih) {
        selisihTerbesarNegatif = { nama: p.nama, selisih: val };
      }
    }

    return {
      chartPeserta,
      daftarKosong,
      ringkasan: {
        totalPeserta: peserta.length,
        totalValidSurvei: validSurvei.length,
        totalValidWawancara: validWawancara.length,
        rataRataSurveiL,
        rataRataWawancaraM,
        selisihTerbesarPositif,
        selisihTerbesarNegatif,
      },
    };
  }, [peserta]);

  const filteredPeserta = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return peserta.filter((p) => {
      const isKosong =
        p.hasil?.rataWawancaraM === null || p.hasil?.rataWawancaraM === undefined;
      if (filterStatus === 'kosong' && !isKosong) return false;
      if (filterStatus === 'lengkap' && isKosong) return false;
      if (!q) return true;
      return (
        String(p.nama || '').toLowerCase().includes(q) ||
        String(p.nip || '').toLowerCase().includes(q) ||
        String(p.instansi || '').toLowerCase().includes(q) ||
        String(p.tim?.namaTim || p.namaTimExcel || '').toLowerCase().includes(q)
      );
    });
  }, [peserta, deferredSearch, filterStatus]);

  if (loading) {
    return <KegiatanRingkasanSkeleton />;
  }

  if (error) {
    return <StatusBanner tone="error" title="Gagal memuat kegiatan" message={error} />;
  }

  return (
    <div className="space-y-6">
      {data?.viewerRole === 'SUPER_ADMIN' && (
        <KegiatanWorkflowChecklist
          kegiatanId={kegiatanId}
          totalPeserta={peserta.length}
          teams={data?.tim || []}
          totalWawancaraSelesai={
            peserta.filter((p) => Boolean(p.wawancaraSelesaiAt && p.inovasiProper)).length
          }
          totalProper={peserta.filter((p) => Boolean(p.inovasiProper)).length}
        />
      )}

      <StatCards ringkasan={computed.ringkasan} />

      <WarningBanner
        daftarKosong={computed.daftarKosong}
        totalPeserta={peserta.length}
        eksposeHref={`/kegiatan/${kegiatanId}/ekspose`}
        inputDataHref={`/kegiatan/${kegiatanId}/input-data`}
        pantauHref={`/kegiatan/${kegiatanId}/pantau-wawancara`}
      />

      {selisihImport.length > 0 && (
        <section
          aria-labelledby="selisih-import-title"
          className="rounded-2xl border border-zinc-900 bg-zinc-50 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ExclamationTriangleIcon
                className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950"
                aria-hidden="true"
              />
              <div>
                <h2 id="selisih-import-title" className="text-sm font-semibold text-zinc-950">
                  Peringatan Selisih Nilai Antarfile Excel
                </h2>
                <p className="mt-0.5 text-xs text-zinc-700">
                  Nilai wawancara memakai <strong>Form Penilaian</strong>. Ditemukan{' '}
                  {selisihImport.length} angka yang berbeda antara Form Penilaian dan Ekspose
                  (paparan hasil evaluasi); angka yang tampil di bawah ini memakai Form Penilaian.
                </p>
              </div>
            </div>
            <Link
              href={`/kegiatan/${kegiatanId}/input-data`}
              className="inline-flex min-h-[36px] items-center rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
            >
              Kelola Impor File Excel
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
              <caption className="sr-only">
                Daftar selisih nilai wawancara antara Form Penilaian dan Ekspose Excel
              </caption>
              <thead className="bg-zinc-50 text-zinc-700">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5 font-semibold">Nama Peserta</th>
                  <th scope="col" className="px-3.5 py-2.5 font-semibold">Kriteria</th>
                  <th scope="col" className="px-3.5 py-2.5 text-right font-semibold">
                    Form Penilaian (dipakai)
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 text-right font-semibold">Ekspose</th>
                  <th scope="col" className="px-3.5 py-2.5 font-semibold">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {selisihImport.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50">
                    <td className="px-3.5 py-2.5 font-medium text-zinc-950">
                      {s.pesertaNama}
                    </td>
                    <td className="px-3.5 py-2.5 text-zinc-700">{s.kriteriaLabel}</td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-zinc-950">
                      {s.nilaiForm === null ? 'Belum dinilai' : s.nilaiForm}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-zinc-600">
                      {s.nilaiEkspose === null ? 'Belum dinilai' : s.nilaiEkspose}
                    </td>
                    <td className="px-3.5 py-2.5 text-zinc-600">{s.catatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ChartEksposeOverview
        peserta={computed.chartPeserta}
        eksposeHref={`/kegiatan/${kegiatanId}/ekspose`}
      />

      <section
        aria-labelledby="jawaban-perbandingan-title"
        className="rounded-2xl border border-zinc-200 bg-white p-5"
      >
        <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 pb-4 lg:flex-row lg:items-center">
          <div>
            <h2 id="jawaban-perbandingan-title" className="text-base font-semibold text-zinc-950">
              Tabel Perbandingan 3 Butir per Peserta
            </h2>
            <p className="mt-1 text-xs text-zinc-600">
              Menampilkan perbandingan hasil Survei dan Wawancara pada 3 butir Aksi Perubahan per
              peserta (Selisih = Nilai Wawancara - Nilai Survei). Ringkasan kuesioner lengkap
              tersedia pada menu{' '}
              <Link
                href={`/kegiatan/${kegiatanId}/hasil-survei`}
                className="font-medium text-zinc-950 underline underline-offset-4"
              >
                Hasil Survei
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Cari nama, NIP, instansi, atau tim"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama, NIP, instansi, tim..."
                className="min-h-[40px] w-full rounded-lg border border-zinc-500 bg-white pl-9 pr-3 text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 sm:w-60"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any);
                setPage(1);
              }}
              aria-label="Filter kelengkapan wawancara"
              className="min-h-[40px] rounded-lg border border-zinc-500 bg-white px-3 text-xs font-medium text-zinc-950 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            >
              <option value="semua">Semua ({peserta.length})</option>
              <option value="kosong">
                Belum Lengkap ({computed.daftarKosong.length})
              </option>
              <option value="lengkap">
                Sudah Lengkap ({peserta.length - computed.daftarKosong.length})
              </option>
            </select>
          </div>
        </div>

        {filteredPeserta.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-600">
            {peserta.length === 0
              ? 'Belum ada peserta terimpor pada kegiatan ini.'
              : 'Tidak ada peserta yang sesuai dengan pencarian atau filter.'}
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
                <caption className="sr-only">
                  Perbandingan 3 butir Aksi Perubahan (Survei dan Wawancara), selisih, serta nilai akhir berbobot per peserta
                </caption>
                <thead className="bg-zinc-50 text-zinc-700">
                  <tr>
                    <th scope="col" className="px-3 py-2.5 font-semibold">No</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Peserta &amp; Tim</th>
                    <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                      Jangka Panjang (Survei / Wawancara)
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                      Tujuan Aksi (Survei / Wawancara)
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                      Manfaat (Survei / Wawancara)
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Survei</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Wawancara</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Selisih</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Nilai Akhir Berbobot</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredPeserta
                    .slice((page - 1) * pageSize, page * pageSize)
                    .map((p, idx) => {
                    const s1 = getSurveySkor(p, 'L4_01');
                    const s2 = getSurveySkor(p, 'L4_02');
                    const s3 = getSurveySkor(p, 'L4_03');
                    const w2 = getWawancaraNilai(p, 'jangkaPanjang');
                    const w3 = getWawancaraNilai(p, 'seluruhTujuan');
                    const w4 = getWawancaraNilai(p, 'manfaat');
                    const l = p.hasil?.rataSurveiL ?? null;
                    const m = p.hasil?.rataWawancaraM ?? null;
                    const selisih = p.hasil?.selisih ?? null;
                    const totalForm = p.hasil?.totalForm ?? null;
                    const rowNumber = (page - 1) * pageSize + idx + 1;

                    return (
                      <tr key={p.id} className="hover:bg-zinc-50">
                        <td className="px-3 py-3 font-mono text-zinc-500">{rowNumber}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-zinc-950">{p.nama}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                          NIP (Nomor Induk Pegawai) {p.nip || '-'} ·{' '}
                          {p.tim?.namaTim || p.namaTimExcel || 'Belum Dibagi ke Tim'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-mono">
                        <span className="font-semibold text-zinc-950">
                          {s1 ?? 'Belum dinilai'}
                        </span>{' '}
                        <span className="text-zinc-600">/</span>{' '}
                        <span className={w2 === null ? 'text-zinc-600' : 'font-semibold text-zinc-950'}>
                          {w2 === null ? 'Belum dinilai' : w2}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-mono">
                        <span className="font-semibold text-zinc-950">
                          {s2 ?? 'Belum dinilai'}
                        </span>{' '}
                        <span className="text-zinc-600">/</span>{' '}
                        <span className={w3 === null ? 'text-zinc-600' : 'font-semibold text-zinc-950'}>
                          {w3 === null ? 'Belum dinilai' : w3}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-mono">
                        <span className="font-semibold text-zinc-950">
                          {s3 ?? 'Belum dinilai'}
                        </span>{' '}
                        <span className="text-zinc-600">/</span>{' '}
                        <span className={w4 === null ? 'text-zinc-600' : 'font-semibold text-zinc-950'}>
                          {w4 === null ? 'Belum dinilai' : w4}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-medium text-zinc-900">
                        {formatNum(l)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-zinc-950">
                        {m === null ? (
                          <span className="rounded border border-zinc-400 px-1.5 py-0.5 text-[10px]">
                            Belum dinilai
                          </span>
                        ) : (
                          formatNum(m)
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-zinc-800">
                        {selisih === null
                          ? '-'
                          : `${selisih >= 0 ? '+' : ''}${selisih.toFixed(2)}`}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-medium text-zinc-900">
                        {totalForm === null ? 'Belum dinilai' : totalForm.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/kegiatan/${kegiatanId}/wawancara/${p.id}`}
                          className="inline-flex min-h-[34px] items-center rounded-lg border border-zinc-500 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-950 transition hover:bg-zinc-950 hover:text-white"
                        >
                          Buka Form
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] text-zinc-600">
            Keterangan kolom: Survei = rata-rata survei (L); Wawancara = rata-rata wawancara (M)
            dari 3 kriteria; Selisih = Nilai Wawancara - Nilai Survei; Nilai Akhir Berbobot =
            gabungan berbobot 5 kriteria.
          </p>

          <TablePagination
            page={page}
            pageSize={pageSize}
            totalItems={filteredPeserta.length}
            onPageChange={setPage}
            itemLabel="peserta"
          />
          </>
        )}
      </section>
    </div>
  );
}
