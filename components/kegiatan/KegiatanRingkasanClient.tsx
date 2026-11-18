'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import StatCards from '@/components/dashboard/StatCards';
import WarningBanner from '@/components/dashboard/WarningBanner';
import ChartEksposeOverview from '@/components/dashboard/ChartEksposeOverview';
import { StatusBanner } from '@/components/ui/status-banner';

interface KegiatanRingkasanClientProps {
  kegiatanId: string;
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
  if (v === null || v === undefined || Number.isNaN(v)) return 'KOSONG';
  return Number(v).toFixed(digits);
}

export default function KegiatanRingkasanClient({
  kegiatanId,
}: KegiatanRingkasanClientProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'kosong' | 'lengkap'>('semua');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/kegiatan/${kegiatanId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Gagal memuat ringkasan kegiatan.');
        return;
      }
      setData(json.data);
    } catch {
      setError('Terjadi gangguan koneksi saat memuat ringkasan kegiatan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kegiatanId]);

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
    const q = search.trim().toLowerCase();
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
  }, [peserta, search, filterStatus]);

  if (loading) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8">
        <ReloadIcon className="h-5 w-5 animate-spin text-zinc-700" aria-hidden="true" />
        <p className="mt-2.5 text-sm font-medium text-zinc-700">
          Memuat ringkasan dan perbandingan 3 item peserta...
        </p>
      </div>
    );
  }

  if (error) {
    return <StatusBanner tone="error" title="Gagal memuat kegiatan" message={error} />;
  }

  return (
    <div className="space-y-6">
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
                  Peringatan Selisih Nilai Antarberkas (IT-01)
                </h2>
                <p className="mt-0.5 text-xs text-zinc-700">
                  Sumber aktif nilai wawancara menggunakan <strong>Form Penilaian</strong>.
                  Terdeteksi {selisihImport.length} perbedaan angka antara sheet Form Penilaian dan
                  sheet Ekspose. Nilai yang tercantum di bawah ini otomatis memakai angka Form
                  Penilaian.
                </p>
              </div>
            </div>
            <Link
              href={`/kegiatan/${kegiatanId}/input-data`}
              className="inline-flex min-h-[36px] items-center rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
            >
              Kelola Impor Excel
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-700">
                <tr>
                  <th className="px-3.5 py-2.5 font-semibold">Nama Peserta</th>
                  <th className="px-3.5 py-2.5 font-semibold">Kriteria</th>
                  <th className="px-3.5 py-2.5 text-right font-semibold">
                    Form Penilaian (Dipakai)
                  </th>
                  <th className="px-3.5 py-2.5 text-right font-semibold">Sheet Ekspose</th>
                  <th className="px-3.5 py-2.5 font-semibold">Catatan</th>
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
                      {s.nilaiForm === null ? 'KOSONG' : s.nilaiForm}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-zinc-600">
                      {s.nilaiEkspose === null ? 'KOSONG' : s.nilaiEkspose}
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
              Tabel Jawaban 3 Item Perbandingan per Peserta (IT-09)
            </h2>
            <p className="mt-1 text-xs text-zinc-600">
              Membandingkan 3 item Survei Aksi Perubahan (skala 1-4) dengan 3 kriteria Wawancara
              (skala 0-100) yang membentuk Survei (L) dan Wawancara (M). Rata-rata 30 soal
              perubahan perilaku (Bab 6.7) tidak tampil pada inti ini dan tersedia di menu{' '}
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIP, instansi, tim..."
                className="min-h-[40px] w-full rounded-lg border border-zinc-500 bg-white pl-9 pr-3 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none sm:w-60"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              aria-label="Filter kelengkapan wawancara"
              className="min-h-[40px] rounded-lg border border-zinc-500 bg-white px-3 text-xs font-medium text-zinc-950 focus:border-zinc-950 focus:outline-none"
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
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-700">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">No</th>
                  <th className="px-3 py-2.5 font-semibold">Peserta &amp; Tim</th>
                  <th className="px-3 py-2.5 text-center font-semibold">
                    P1 / K2 (J. Panjang)
                  </th>
                  <th className="px-3 py-2.5 text-center font-semibold">
                    P2 / K3 (Tujuan)
                  </th>
                  <th className="px-3 py-2.5 text-center font-semibold">
                    P3 / K4 (Manfaat)
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold">Survei (L)</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Wawancara (M)</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Selisih (M-L)</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Total Form</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredPeserta.map((p, idx) => {
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

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="px-3 py-3 font-mono text-zinc-500">{idx + 1}</td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-zinc-950">{p.nama}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                          NIP {p.nip} · {p.tim?.namaTim || p.namaTimExcel || 'Belum Dibagi'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-mono">
                        <span className="font-semibold text-zinc-950">
                          {s1 ?? '-'}
                        </span>{' '}
                        <span className="text-zinc-400">/</span>{' '}
                        <span className={w2 === null ? 'text-zinc-400' : 'font-semibold text-zinc-950'}>
                          {w2 === null ? 'KOSONG' : w2}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-mono">
                        <span className="font-semibold text-zinc-950">
                          {s2 ?? '-'}
                        </span>{' '}
                        <span className="text-zinc-400">/</span>{' '}
                        <span className={w3 === null ? 'text-zinc-400' : 'font-semibold text-zinc-950'}>
                          {w3 === null ? 'KOSONG' : w3}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-mono">
                        <span className="font-semibold text-zinc-950">
                          {s3 ?? '-'}
                        </span>{' '}
                        <span className="text-zinc-400">/</span>{' '}
                        <span className={w4 === null ? 'text-zinc-400' : 'font-semibold text-zinc-950'}>
                          {w4 === null ? 'KOSONG' : w4}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-medium text-zinc-900">
                        {formatNum(l)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-zinc-950">
                        {m === null ? (
                          <span className="rounded border border-zinc-400 px-1.5 py-0.5 text-[10px]">
                            KOSONG
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
                        {totalForm === null ? '-' : totalForm.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/kegiatan/${kegiatanId}/wawancara/${p.id}`}
                          className="inline-flex min-h-[34px] items-center rounded-lg border border-zinc-500 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-950 transition hover:bg-zinc-950 hover:text-white"
                        >
                          Form
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
