'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  DownloadIcon,
  ExternalLinkIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import { WAWANCARA_KRITERIA } from '@/lib/wawancara-kriteria';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBanner } from '@/components/ui/status-banner';
import { FormWawancaraSkeleton } from '@/components/ui/page-skeletons';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import {
  fetchJsonWithCache,
  getClientCache,
  invalidateClientCache,
  invalidateKegiatanCache,
} from '@/lib/client-cache';

interface DraftCriterion {
  nilai: string;
  deskripsi: string;
  lockedFromImport: boolean;
  sumber: string;
}

function buildInitialDrafts(p: any): Record<string, DraftCriterion> {
  const nextDrafts: Record<string, DraftCriterion> = {};
  for (const meta of WAWANCARA_KRITERIA) {
    const found = (p?.wawancara || []).find((w: any) => w.kriteria === meta.key);
    nextDrafts[meta.key] = {
      nilai: found && typeof found.nilai === 'number' ? String(found.nilai) : '',
      deskripsi: found?.deskripsi || '',
      lockedFromImport: Boolean(found?.lockedFromImport),
      sumber: found?.sumber || 'KOSONG',
    };
  }
  return nextDrafts;
}

export default function FormWawancaraPesertaPage({
  params,
}: {
  params: { id: string; pesertaId: string };
}) {
  const apiUrl = `/api/peserta/${params.pesertaId}`;
  const cached = getClientCache<{
    success: boolean;
    data?: any;
    canEditWawancara?: boolean;
  }>(apiUrl);

  const [peserta, setPeserta] = useState<any>(cached?.data?.data ?? null);
  const [canEditWawancara, setCanEditWawancara] = useState(
    Boolean(cached?.data?.canEditWawancara)
  );
  const [loading, setLoading] = useState(!cached?.data?.data);
  const [saving, setSaving] = useState(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftCriterion>>(() =>
    cached?.data?.data ? buildInitialDrafts(cached.data.data) : {}
  );
  const [evidencePreview, setEvidencePreview] = useState<{
    title: string;
    fileId: string;
    fileName: string;
  } | null>(null);

  const loadPeserta = async (options?: { force?: boolean; silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true);
      setError(null);
      const { data: json } = await fetchJsonWithCache<{
        success: boolean;
        data?: any;
        canEditWawancara?: boolean;
        error?: string;
      }>(apiUrl, { force: options?.force });
      if (!json.success) {
        if (!options?.silent) {
          setError(
            json.error || 'Gagal memuat detail wawancara peserta. Coba muat ulang halaman.'
          );
        }
        return;
      }
      const p = json.data;
      setPeserta(p);
      setCanEditWawancara(Boolean(json.canEditWawancara));
      if (!options?.silent) {
        setDrafts(buildInitialDrafts(p));
      }
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
    const existing = getClientCache<{ success: boolean; data?: any }>(apiUrl);
    if (existing?.data?.data) {
      void loadPeserta({ force: true, silent: true });
    } else {
      void loadPeserta();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.pesertaId]);

  const previewScores = useMemo(() => {
    const num = (key: string): number | null => {
      const raw = drafts[key]?.nilai?.trim() ?? '';
      if (!raw) return null;
      const parsed = Number(raw);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const k1 = num('menengah');
    const k2 = num('jangkaPanjang');
    const k3 = num('seluruhTujuan');
    const k4 = num('manfaat');
    const k5 = num('komunikasi');

    const rataM =
      k2 !== null && k3 !== null && k4 !== null ? (k2 + k3 + k4) / 3 : null;
    const totalForm =
      k1 !== null && k2 !== null && k3 !== null && k4 !== null && k5 !== null
        ? k1 * 0.2 + k2 * 0.2 + k3 * 0.2 + k4 * 0.3 + k5 * 0.1
        : null;

    return { rataM, totalForm };
  }, [drafts]);

  const handleSubmit = async (e: React.FormEvent, markSelesai: boolean) => {
    e.preventDefault();
    if (!canEditWawancara) return;

    for (const meta of WAWANCARA_KRITERIA) {
      const raw = (drafts[meta.key]?.nilai ?? '').trim();
      if (raw === '') continue;
      const parsed = Number(raw);
      if (!/^\d+$/.test(raw) || !Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
        setSuccessMsg(null);
        setError(
          `Nilai wawancara pada kriteria "${meta.judul}" harus berupa bilangan bulat antara 0 sampai 100 (contoh: 85).`
        );
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const items = WAWANCARA_KRITERIA.map((meta) => {
        const d = drafts[meta.key] || {
          nilai: '',
          deskripsi: '',
          lockedFromImport: false,
        };
        return {
          kriteria: meta.key,
          deskripsi: d.deskripsi,
          nilai: d.nilai.trim() === '' ? null : Number(d.nilai.trim()),
        };
      });

      const res = await fetch(`/api/peserta/${params.pesertaId}/wawancara`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, markSelesai }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(
          json.error || 'Gagal menyimpan hasil wawancara. Periksa isian nilai, lalu coba lagi.'
        );
        return;
      }

      invalidateClientCache(apiUrl);
      invalidateKegiatanCache(params.id);
      setSuccessMsg(
        json.message ||
          (markSelesai
            ? 'Hasil wawancara disimpan dan ditandai Selesai.'
            : 'Draf hasil wawancara berhasil disimpan.')
      );
      await loadPeserta({ force: true });
    } catch {
      setError('Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <FormWawancaraSkeleton />;
  }

  if (!peserta) {
    return (
      <StatusBanner
        tone="error"
        title="Peserta tidak dapat diakses"
        message={error || 'Data peserta tidak ditemukan.'}
      />
    );
  }

  const proper = peserta.inovasiProper;
  const surveyL = peserta.hasil?.rataSurveiL;
  const isSelesaiLengkap = Boolean(proper && peserta.wawancaraSelesaiAt);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/kegiatan/${params.id}/wawancara`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 transition hover:text-zinc-950"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Kembali ke Daftar Wawancara</span>
        </Link>

        {peserta.tim?.linkMeeting && (
          <a
            href={peserta.tim.linkMeeting}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-100"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Buka Ruang Meeting ({peserta.tim.namaTim})</span>
          </a>
        )}
      </div>

      {error && <StatusBanner tone="error" title="Gagal menyimpan" message={error} />}
      {successMsg && (
        <StatusBanner tone="success" title="Tersimpan" message={successMsg} />
      )}

      {/* Identitas Peserta & Info Mutasi Jabatan */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-zinc-400 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-800">
                {peserta.tim?.namaTim || peserta.namaTimExcel || 'Belum Dibagi ke Tim'}
              </span>
              {isSelesaiLengkap ? (
                <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-white">
                  <CheckCircledIcon className="h-3 w-3" aria-hidden="true" />
                  Selesai
                </span>
              ) : !proper ? (
                <span className="rounded border border-zinc-400 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-900">
                  Belum Unggah Proper
                </span>
              ) : (
                <span className="rounded border border-zinc-400 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-800">
                  Wawancara Belum Selesai
                </span>
              )}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-zinc-950">{peserta.nama}</h2>
            <p className="mt-0.5 font-mono text-xs text-zinc-600">
              NIP (Nomor Induk Pegawai): {peserta.nip || '-'}
            </p>
            <p className="mt-2 text-xs text-zinc-700">
              <strong>Judul Aksi Perubahan:</strong>{' '}
              {proper?.judulProper || peserta.judulAksiPerubahan || '-'}
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <p className="text-[10px] font-medium text-zinc-600">Survei (L)</p>
              <p className="mt-1 font-mono text-sm font-semibold text-zinc-950">
                {typeof surveyL === 'number' ? surveyL.toFixed(2) : 'Belum dinilai'}
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-500">Rata-rata 3 item</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <p className="text-[10px] font-medium text-zinc-600">Wawancara (M)</p>
              <p className="mt-1 font-mono text-sm font-semibold text-zinc-950">
                {previewScores.rataM !== null
                  ? previewScores.rataM.toFixed(2)
                  : 'Belum dinilai'}
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-500">Rata-rata 3 kriteria</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <p className="text-[10px] font-medium text-zinc-600">Nilai Akhir Berbobot</p>
              <p className="mt-1 font-mono text-sm font-semibold text-zinc-950">
                {previewScores.totalForm !== null
                  ? previewScores.totalForm.toFixed(2)
                  : 'Belum dinilai'}
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-500">5 kriteria (20/20/20/30/10)</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="font-semibold text-zinc-800">Jabatan &amp; Instansi Saat Pelatihan</p>
            <p className="mt-1 text-zinc-950">{peserta.jabatanPelatihan || '-'}</p>
            <p className="text-zinc-600">{peserta.instansiPelatihan || '-'}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="font-semibold text-zinc-800">Jabatan &amp; Instansi Saat Ini</p>
            <p className="mt-1 text-zinc-950">{peserta.jabatanSaatIni || '-'}</p>
            <p className="text-zinc-600">{peserta.instansi || '-'}</p>
          </div>
        </div>
      </section>

      {/* Dokumen Proper & Kondisi Saat Ini dari Unggahan Publik */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">
              Dokumen Proper (laporan Proyek Perubahan peserta) &amp; Kondisi Saat Ini (dari peserta)
            </h3>
            <p className="mt-0.5 text-xs text-zinc-600">
              Diunggah peserta melalui tautan publik. Data jangka menengah dan jangka panjang
              ditampilkan pada Kriteria 1 dan Kriteria 2 di bawah.
            </p>
          </div>
          {proper?.dokumenFileId && (
            <a
              href={`/api/files/${proper.dokumenFileId}?download=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
            >
              <DownloadIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {proper.dokumenNama
                  ? `Unduh Dokumen Proper (${proper.dokumenNama})`
                  : 'Unduh Dokumen Proper'}
              </span>
            </a>
          )}
        </div>

        {!proper ? (
          <p className="mt-3 text-xs text-zinc-600">
            Peserta belum mengunggah dokumen Proper melalui tautan publik.
          </p>
        ) : (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold text-zinc-950">
              Kondisi Saat Ini / Ringkasan Implementasi
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-zinc-800">
              {proper.kondisiSaatIni}
            </p>
          </div>
        )}
      </section>

      {/* Form 5 Kriteria Wawancara */}
      <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
        {!canEditWawancara ? (
          <StatusBanner
            tone="info"
            title="Mode Baca Saja (Super Admin)"
            message="Formulir ini hanya bisa diisi oleh evaluator tim peserta."
          />
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-zinc-900 bg-zinc-50 px-5 py-3.5 text-xs text-zinc-800">
              <strong>Panduan Pengisian:</strong> Isi <strong>Nilai wawancara</strong> (skala
              0–100; kosongkan bila belum dinilai) dan <strong>Hasil wawancara &amp; bukti</strong>{' '}
              untuk setiap kriteria, berdasarkan dokumen Proper dan konfirmasi langsung dengan
              peserta.
            </div>
            {!proper && (
              <StatusBanner
                tone="info"
                title="Proper Belum Diunggah"
                message="Peserta belum mengunggah dokumen Proper melalui tautan publik. Anda tetap bisa menyimpan draf, tetapi status belum bisa ditandai Selesai sebelum Proper diunggah."
              />
            )}
          </div>
        )}

        {WAWANCARA_KRITERIA.map((meta) => {
          const d = drafts[meta.key] || {
            nilai: '',
            deskripsi: '',
            lockedFromImport: false,
            sumber: 'KOSONG',
          };

          const properInline =
            meta.key === 'menengah'
              ? {
                  heading: 'Data Jangka Menengah dari Peserta',
                  milestone: proper?.jangkaMenengahMilestone,
                  status: proper?.jangkaMenengahStatus,
                  fotoId: proper?.jangkaMenengahFotoId,
                  fotoNama: proper?.jangkaMenengahFotoNama || 'bukti-menengah',
                  previewTitle: 'Foto Bukti Jangka Menengah',
                }
              : meta.key === 'jangkaPanjang'
                ? {
                    heading: 'Data Jangka Panjang dari Peserta',
                    milestone: proper?.jangkaPanjangMilestone,
                    status: proper?.jangkaPanjangStatus,
                    fotoId: proper?.jangkaPanjangFotoId,
                    fotoNama: proper?.jangkaPanjangFotoNama || 'bukti-panjang',
                    previewTitle: 'Foto Bukti Jangka Panjang',
                  }
                : null;

          return (
            <section
              key={meta.key}
              className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-zinc-950">
                    {meta.no}. {meta.judul}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-600">{meta.petunjukPertanyaan}</p>
                </div>

                <span className="shrink-0 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-900">
                  Bobot {meta.bobot}%
                </span>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="w-full shrink-0 sm:w-36">
                  <label
                    htmlFor={`nilai-${meta.key}`}
                    className="mb-1.5 block text-xs font-medium text-zinc-800"
                  >
                    Nilai wawancara
                  </label>
                  <input
                    id={`nilai-${meta.key}`}
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    inputMode="numeric"
                    disabled={!canEditWawancara}
                    value={d.nilai}
                    placeholder="-"
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [meta.key]: { ...d, nilai: e.target.value },
                      }))
                    }
                    className="min-h-[60px] w-full rounded-xl border border-zinc-500 bg-white px-3 text-center font-mono text-xl font-bold text-zinc-950 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-700"
                  />
                  <p className="mt-1.5 text-[11px] leading-snug text-zinc-600">
                    Skala 0–100 (bilangan bulat). Kosongkan bila belum dinilai.
                  </p>
                </div>

                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`bukti-${meta.key}`}
                    className="mb-1.5 block text-xs font-medium text-zinc-800"
                  >
                    Hasil wawancara &amp; bukti
                  </label>
                  <textarea
                    id={`bukti-${meta.key}`}
                    rows={4}
                    disabled={!canEditWawancara}
                    value={d.deskripsi}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [meta.key]: { ...d, deskripsi: e.target.value },
                      }))
                    }
                    placeholder={
                      canEditWawancara
                        ? 'Catat hasil konfirmasi langsung dan bukti dukung dari peserta...'
                        : 'Belum ada catatan bukti dari evaluator.'
                    }
                    className="min-h-[96px] w-full rounded-xl border border-zinc-500 bg-white p-3 text-xs leading-relaxed text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-700"
                  />
                </div>
              </div>

              {properInline && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                  <p className="text-xs font-semibold text-zinc-950">
                    {properInline.heading}
                  </p>
                  {!proper ? (
                    <p className="mt-2 text-xs text-zinc-600">
                      Peserta belum mengunggah dokumen Proper melalui tautan publik.
                    </p>
                  ) : (
                    <div className="mt-2 divide-y divide-zinc-200 text-xs">
                      <div className="grid gap-2 py-2.5 sm:grid-cols-[170px_1fr]">
                        <span className="text-zinc-600">Target / rencana</span>
                        <p className="whitespace-pre-wrap leading-relaxed text-zinc-950">
                          {properInline.milestone || '-'}
                        </p>
                      </div>
                      <div className="grid gap-2 pt-2.5 sm:grid-cols-[170px_1fr] sm:items-center">
                        <span className="text-zinc-600">Status bukti</span>
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={
                              properInline.status === 'SUDAH_DILAKSANAKAN'
                                ? 'rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-[11px] font-semibold text-white'
                                : 'rounded-md border border-zinc-400 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-zinc-900'
                            }
                          >
                            {properInline.status === 'SUDAH_DILAKSANAKAN'
                              ? 'Target sudah dilaksanakan'
                              : 'Target belum dilaksanakan'}
                          </span>

                          {properInline.fotoId && (
                            <button
                              type="button"
                              onClick={() =>
                                setEvidencePreview({
                                  title: properInline.previewTitle,
                                  fileId: properInline.fotoId,
                                  fileName: properInline.fotoNama,
                                })
                              }
                              className="inline-flex min-h-[32px] items-center gap-1 text-xs font-semibold text-zinc-950 underline underline-offset-4 transition hover:text-zinc-700"
                            >
                              <span>Lihat foto bukti</span>
                              <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                <p className="mb-1.5 text-xs font-semibold text-zinc-950">
                  Keterangan rentang nilai
                </p>
                <ul className="divide-y divide-zinc-200 text-xs">
                  {meta.keteranganRentang.map((r) => (
                    <li
                      key={r.rentang}
                      className="grid gap-1.5 py-2 last:pb-0 sm:grid-cols-[130px_1fr] sm:items-baseline"
                    >
                      <span className="font-mono text-[11px] font-semibold text-zinc-950">
                        {r.rentang}
                      </span>
                      <span className="text-zinc-700">{r.arti}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}

        {canEditWawancara && (
          <div className="space-y-1.5">
            <div className="flex flex-col-reverse justify-end gap-2.5 sm:flex-row">
              <button
                type="button"
                disabled={saving}
                onClick={(e) => handleSubmit(e, false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-500 bg-white px-5 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Draf'}
              </button>
              <button
                type="button"
                disabled={saving || !proper}
                onClick={() => setConfirmFinishOpen(true)}
                title={
                  !proper
                    ? 'Tombol aktif setelah peserta mengunggah dokumen Proper.'
                    : undefined
                }
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircledIcon className="h-4 w-4" aria-hidden="true" />
                <span>{saving ? 'Menyimpan...' : 'Simpan & Tandai Selesai'}</span>
              </button>
            </div>
            {!proper && (
              <p className="text-right text-[11px] text-zinc-600">
                Tombol &quot;Simpan &amp; Tandai Selesai&quot; aktif setelah peserta mengunggah
                Proper.
              </p>
            )}
          </div>
        )}
      </form>

      {/* Dialog Pratinjau Foto Bukti */}
      <Dialog
        open={Boolean(evidencePreview)}
        onOpenChange={(open) => {
          if (!open) setEvidencePreview(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{evidencePreview?.title}</DialogTitle>
            <DialogDescription>{evidencePreview?.fileName}</DialogDescription>
          </DialogHeader>
          {evidencePreview && (
            <>
              <DialogBody>
                <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/files/${evidencePreview.fileId}`}
                    alt={evidencePreview.title}
                    className="max-h-[65vh] w-full object-contain"
                  />
                </div>
              </DialogBody>
              <DialogFooter>
                <a
                  href={`/api/files/${evidencePreview.fileId}?download=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-zinc-100"
                >
                  <DownloadIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Unduh Gambar</span>
                </a>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmFinishOpen}
        onOpenChange={(open) => {
          if (!saving) setConfirmFinishOpen(open);
        }}
        title="Simpan & Tandai Wawancara Selesai?"
        description={(() => {
          const emptyCount = WAWANCARA_KRITERIA.filter(
            (meta) => (drafts[meta.key]?.nilai ?? '').trim() === ''
          ).length;
          return emptyCount > 0
            ? `Masih ada ${emptyCount} kriteria yang belum diisi nilainya. Kriteria kosong akan tercatat sebagai "Belum dinilai". Tetap simpan dan tandai wawancara selesai?`
            : 'Seluruh 5 kriteria nilai sudah terisi. Status wawancara peserta ini akan ditandai Selesai.';
        })()}
        confirmLabel="Ya, Simpan & Tandai Selesai"
        tone="primary"
        loading={saving}
        onConfirm={() => {
          setConfirmFinishOpen(false);
          void handleSubmit({ preventDefault: () => {} } as React.FormEvent, true);
        }}
      />
    </div>
  );
}
