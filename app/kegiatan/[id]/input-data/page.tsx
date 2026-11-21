'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ReloadIcon,
  TableIcon,
  UploadIcon,
} from '@radix-ui/react-icons';
import ImportExcelModal, {
  type ImportedEvaluatorAccount,
} from '@/components/ImportExcelModal';
import { StatusBanner } from '@/components/ui/status-banner';
import { TablePagination } from '@/components/ui/table-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchJsonWithCache,
  getClientCache,
  invalidateKegiatanCache,
} from '@/lib/client-cache';

export default function InputDataKegiatanPage({
  params,
}: {
  params: { id: string };
}) {
  const pageSize = 10;
  const headerUrl = `/api/kegiatan/${params.id}?includePeserta=0`;
  const buildPesertaUrl = useCallback(
    (targetPage: number) =>
      `/api/peserta?kegiatanId=${encodeURIComponent(params.id)}&page=${targetPage}&limit=${pageSize}&includeCounts=0`,
    [params.id]
  );

  const initialHeaderCache = getClientCache<{ success: boolean; data: any }>(headerUrl);
  const initialPesertaCache = getClientCache<{
    success: boolean;
    data: any[];
    pagination?: { total?: number };
  }>(buildPesertaUrl(1));

  const [data, setData] = useState<any>(initialHeaderCache?.data?.data ?? null);
  const [peserta, setPeserta] = useState<any[]>(initialPesertaCache?.data?.data ?? []);
  const [totalPeserta, setTotalPeserta] = useState(
    initialPesertaCache?.data?.pagination?.total ?? 0
  );
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(
    !initialHeaderCache?.data?.data || !initialPesertaCache?.data?.data
  );
  const [loadingPeserta, setLoadingPeserta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    message: string;
    accounts: ImportedEvaluatorAccount[];
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCopyAllCredentials = async () => {
    if (!importSummary?.accounts?.length) return;
    const lines = importSummary.accounts.map(
      (acc) =>
        `${acc.namaTim} | ${acc.nama} | Username: ${acc.username} | Sandi Awal: ${
          acc.sandiAwal || '(sudah ada)'
        }`
    );
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 1800);
    } catch {
      // Abaikan bila clipboard dibatasi
    }
  };

  const loadHeader = useCallback(
    async (force = false) => {
      const { data: json } = await fetchJsonWithCache<{
        success: boolean;
        data?: any;
        error?: string;
      }>(headerUrl, { force });
      if (!json.success) {
        throw new Error(
          json.error || 'Gagal memuat data impor kegiatan. Coba muat ulang halaman.'
        );
      }
      setData(json.data);
    },
    [headerUrl]
  );

  const loadPesertaPage = useCallback(
    async (targetPage: number, force = false) => {
      const { data: json } = await fetchJsonWithCache<{
        success: boolean;
        data?: any[];
        pagination?: { total?: number };
        error?: string;
      }>(buildPesertaUrl(targetPage), { force });
      if (!json.success) {
        throw new Error(
          json.error || 'Gagal memuat data peserta yang sudah diimpor. Coba muat ulang halaman.'
        );
      }
      setPeserta(json.data || []);
      setTotalPeserta(json.pagination?.total ?? 0);
    },
    [buildPesertaUrl]
  );

  const loadAll = useCallback(
    async (options?: { force?: boolean; silent?: boolean; targetPage?: number }) => {
      const targetPage = options?.targetPage ?? 1;
      try {
        if (!options?.silent) setLoading(true);
        setError(null);
        await Promise.all([
          loadHeader(Boolean(options?.force)),
          loadPesertaPage(targetPage, Boolean(options?.force)),
        ]);
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
    },
    [loadHeader, loadPesertaPage]
  );

  useEffect(() => {
    const cachedHeader = getClientCache<{ success: boolean; data: any }>(headerUrl);
    const cachedPeserta = getClientCache<{
      success: boolean;
      data: any[];
      pagination?: { total?: number };
    }>(buildPesertaUrl(1));

    if (cachedHeader?.data?.data && cachedPeserta?.data?.data) {
      setData(cachedHeader.data.data);
      setPeserta(cachedPeserta.data.data);
      setTotalPeserta(cachedPeserta.data.pagination?.total ?? 0);
      setLoading(false);
      void loadAll({ force: true, silent: true, targetPage: 1 });
      return;
    }

    void loadAll({ targetPage: 1 });
  }, [headerUrl, buildPesertaUrl, loadAll]);

  const handlePageChange = async (nextPage: number) => {
    setPage(nextPage);
    try {
      setLoadingPeserta(true);
      await loadPesertaPage(nextPage);
    } catch (err: any) {
      setError(
        err?.message ||
          'Gagal memuat halaman daftar peserta. Coba pilih ulang halaman atau muat ulang.'
      );
    } finally {
      setLoadingPeserta(false);
    }
  };

  const selisihImport: any[] = data?.selisihImport || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <TableIcon className="h-4 w-4 text-zinc-950" aria-hidden="true" />
            <h2 className="text-base font-semibold text-zinc-950">
              Impor File Excel Kegiatan
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            Unggah file <strong>Form Penilaian</strong> dan <strong>Olah Data Survei</strong>{' '}
            sekaligus. Nilai wawancara dari Excel bisa dilihat dan diubah lagi oleh evaluator saat
            wawancara.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
        >
          <UploadIcon className="h-4 w-4" aria-hidden="true" />
          <span>Impor / Perbarui dari Excel</span>
        </button>
      </div>

      <StatusBanner
        tone="info"
        title="Data Profil & Survei Terkunci"
        message="Peserta hanya bisa ditambah atau diubah lewat impor ulang file Excel. Di sistem ini tidak bisa tambah peserta manual, ubah profil, ubah skor survei, atau hapus peserta."
      />

      {error && <StatusBanner tone="error" title="Kesalahan" message={error} />}

      {importSummary && (
        <section className="rounded-2xl border border-zinc-900 bg-white p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">
                Hasil Impor &amp; Akun Evaluator Otomatis
              </h3>
              <p className="mt-0.5 text-xs text-zinc-700">{importSummary.message}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {importSummary.accounts.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyAllCredentials}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-400 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-900 hover:bg-zinc-100"
                >
                  {copiedCreds ? (
                    <CheckIcon className="h-3 w-3 text-zinc-950" aria-hidden="true" />
                  ) : (
                    <CopyIcon className="h-3 w-3 text-zinc-700" aria-hidden="true" />
                  )}
                  <span>{copiedCreds ? 'Kredensial Disalin' : 'Salin Semua Kredensial'}</span>
                </button>
              )}
              <Link
                href={`/kegiatan/${params.id}/pembagian-tim`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-1 text-[11px] font-semibold text-white hover:bg-zinc-800"
              >
                <span>Lanjut ke 3. Pembagian Tim</span>
                <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => setImportSummary(null)}
                className="rounded-lg border border-zinc-500 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-900 hover:bg-zinc-100"
              >
                Tutup
              </button>
            </div>
          </div>

          {importSummary.accounts.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
                <caption className="sr-only">
                  Daftar akun evaluator yang dibuat atau ditautkan otomatis saat impor Excel
                </caption>
                <thead className="bg-zinc-50 text-zinc-700">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">Tim</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Nama Akun</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Username / NIP Login</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Kata Sandi Awal</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {importSummary.accounts.map((acc) => (
                    <tr key={acc.timId}>
                      <td className="px-3 py-2 font-medium text-zinc-950">{acc.namaTim}</td>
                      <td className="px-3 py-2 text-zinc-800">{acc.nama}</td>
                      <td className="px-3 py-2 font-mono text-zinc-950">{acc.username}</td>
                      <td className="px-3 py-2 font-mono font-semibold text-zinc-950">
                        {acc.sandiAwal || 'Sudah ada / lihat di Akun Evaluator'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded border border-zinc-400 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-800">
                          {acc.status === 'created'
                            ? 'Akun baru (wajib ganti sandi)'
                            : 'Ditautkan ke akun aktif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {selisihImport.length > 0 && (
        <section className="rounded-2xl border border-zinc-900 bg-zinc-50 p-5">
          <div className="flex items-start gap-2.5">
            <ExclamationTriangleIcon
              className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950"
              aria-hidden="true"
            />
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">
                Selisih Nilai Antarfile Excel ({selisihImport.length} temuan)
              </h3>
              <p className="mt-0.5 text-xs text-zinc-700">
                Daftar ini membandingkan file Form Penilaian dengan sheet Ekspose (lembar paparan).
                Semua perhitungan memakai nilai dari Form Penilaian.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
              <caption className="sr-only">
                Daftar selisih nilai antara file Form Penilaian dan sheet Ekspose
              </caption>
              <thead className="bg-zinc-50 text-zinc-700">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Peserta</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">NIP (Nomor Induk Pegawai)</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Kriteria</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Form Penilaian</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-semibold">Ekspose</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {selisihImport.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50">
                    <td className="px-3 py-2.5 font-medium text-zinc-950">{s.pesertaNama}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-zinc-600">
                      {s.pesertaNip || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-800">{s.kriteriaLabel}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-zinc-950">
                      {s.nilaiForm === null ? 'Belum dinilai' : s.nilaiForm}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-zinc-600">
                      {s.nilaiEkspose === null ? 'Belum dinilai' : s.nilaiEkspose}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-600">{s.catatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-zinc-200 pb-3.5">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">
              Pratinjau Data yang Sudah Diimpor (Baca Saja · {totalPeserta} peserta)
            </h3>
            <p className="mt-0.5 text-xs text-zinc-600">
              Menampilkan identitas resmi peserta, jabatan saat pelatihan dibandingkan saat ini,
              nama tim dari Excel, dan kelengkapan nilai wawancara (10 peserta per halaman).
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded border border-zinc-400 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-800">
            <LockClosedIcon className="h-3 w-3" aria-hidden="true" />
            Profil &amp; Survei Terkunci
          </span>
        </div>

        {loading ? (
          <div className="space-y-2.5 py-2" aria-busy="true" aria-label="Memuat data peserta">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-11 w-full" />
            ))}
          </div>
        ) : totalPeserta === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-600">
            Belum ada peserta yang diimpor. Klik tombol Impor / Perbarui dari Excel di atas untuk
            memulai.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
                <caption className="sr-only">
                  Pratinjau daftar peserta terimpor beserta jabatan, tim, dan ringkasan skor survei serta wawancara
                </caption>
                <thead className="bg-zinc-50 text-zinc-700">
                  <tr>
                    <th scope="col" className="px-3 py-2.5 font-semibold">No</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Nama &amp; NIP</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Jabatan &amp; Instansi Saat Ini</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Tim (dari Excel)</th>
                    <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                      Nilai Terisi (dari 5 kriteria)
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Survei</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Wawancara</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {peserta.map((p, idx) => {
                    const filledCount = (p.wawancara || []).filter(
                      (w: any) => typeof w.nilai === 'number'
                    ).length;
                    const rowNumber = (page - 1) * pageSize + idx + 1;
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50">
                        <td className="px-3 py-2.5 font-mono text-zinc-500">{rowNumber}</td>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-zinc-950">{p.nama}</div>
                          <div className="font-mono text-[11px] text-zinc-500">{p.nip || '-'}</div>
                        </td>
                        <td className="px-3 py-2.5 text-zinc-700">
                          <div>{p.jabatanSaatIni || p.jabatanPelatihan || '-'}</div>
                          <div className="text-[11px] text-zinc-500">
                            {p.instansi || p.instansiPelatihan || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-zinc-800">
                          {p.tim?.namaTim || p.namaTimExcel || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-zinc-800">
                          {filledCount} dari 5
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          {typeof p.hasil?.rataSurveiL === 'number'
                            ? p.hasil.rataSurveiL.toFixed(2)
                            : 'Belum dinilai'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-zinc-950">
                          {typeof p.hasil?.rataWawancaraM === 'number'
                            ? p.hasil.rataWawancaraM.toFixed(2)
                            : 'Belum dinilai'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalPeserta}
              onPageChange={handlePageChange}
              loading={loadingPeserta}
              itemLabel="peserta"
            />
          </>
        )}
      </section>

      <ImportExcelModal
        kegiatanId={params.id}
        isOpen={modalOpen}
        hasExistingData={totalPeserta > 0}
        onClose={() => setModalOpen(false)}
        onSuccess={(payload) => {
          setModalOpen(false);
          setPage(1);
          invalidateKegiatanCache(params.id);
          if (payload?.message) {
            setImportSummary({
              message: payload.message,
              accounts: payload.evaluatorAccounts || [],
            });
          }
          void Promise.all([loadHeader(true), loadPesertaPage(1, true)]);
        }}
      />
    </div>
  );
}
