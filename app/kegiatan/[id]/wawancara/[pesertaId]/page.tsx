'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  DownloadIcon,
  ExternalLinkIcon,
  ImageIcon,
  LockClosedIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import { WAWANCARA_KRITERIA } from '@/lib/wawancara-kriteria';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBanner } from '@/components/ui/status-banner';

interface DraftCriterion {
  nilai: string;
  deskripsi: string;
  lockedFromImport: boolean;
  sumber: string;
}

export default function FormWawancaraPesertaPage({
  params,
}: {
  params: { id: string; pesertaId: string };
}) {
  const [peserta, setPeserta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftCriterion>>({});
  const [evidencePreview, setEvidencePreview] = useState<{
    title: string;
    fileId: string;
    fileName: string;
  } | null>(null);

  const loadPeserta = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/peserta/${params.pesertaId}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Gagal memuat detail wawancara peserta.');
        return;
      }
      const p = json.data;
      setPeserta(p);

      const nextDrafts: Record<string, DraftCriterion> = {};
      for (const meta of WAWANCARA_KRITERIA) {
        const found = (p.wawancara || []).find((w: any) => w.kriteria === meta.key);
        nextDrafts[meta.key] = {
          nilai:
            found && typeof found.nilai === 'number' ? String(found.nilai) : '',
          deskripsi: found?.deskripsi || '',
          lockedFromImport: Boolean(found?.lockedFromImport),
          sumber: found?.sumber || 'KOSONG',
        };
      }
      setDrafts(nextDrafts);
    } catch {
      setError('Koneksi bermasalah saat memuat data peserta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeserta();
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
        const payload: any = {
          kriteria: meta.key,
          deskripsi: d.deskripsi,
        };
        if (!d.lockedFromImport) {
          payload.nilai = d.nilai.trim() === '' ? null : Number(d.nilai.trim());
        }
        return payload;
      });

      const res = await fetch(`/api/peserta/${params.pesertaId}/wawancara`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, markSelesai }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Gagal menyimpan hasil wawancara.');
        return;
      }

      setSuccessMsg(
        markSelesai
          ? 'Hasil wawancara disimpan dan ditandai Selesai.'
          : 'Draf hasil wawancara berhasil disimpan.'
      );
      await loadPeserta();
    } catch {
      setError('Koneksi bermasalah saat menyimpan wawancara.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8">
        <ReloadIcon className="h-5 w-5 animate-spin text-zinc-700" aria-hidden="true" />
        <p className="mt-2.5 text-sm font-medium text-zinc-700">
          Memuat formulir wawancara peserta...
        </p>
      </div>
    );
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
            <span>Buka Room Meeting ({peserta.tim.namaTim})</span>
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
                {peserta.tim?.namaTim || peserta.namaTimExcel || 'Tanpa Tim'}
              </span>
              {peserta.wawancaraSelesaiAt && (
                <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-white">
                  <CheckCircledIcon className="h-3 w-3" aria-hidden="true" />
                  Selesai Wawancara
                </span>
              )}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-zinc-950">{peserta.nama}</h2>
            <p className="mt-0.5 font-mono text-xs text-zinc-600">NIP {peserta.nip}</p>
            <p className="mt-2 text-xs text-zinc-700">
              <strong>Judul Aksi Perubahan:</strong>{' '}
              {proper?.judulProper || peserta.judulAksiPerubahan || 'Belum tercantum'}
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <p className="text-[10px] font-medium text-zinc-600">Survei (L)</p>
              <p className="mt-1 font-mono text-base font-semibold text-zinc-950">
                {typeof surveyL === 'number' ? surveyL.toFixed(2) : '-'}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <p className="text-[10px] font-medium text-zinc-600">Pratinjau (M)</p>
              <p className="mt-1 font-mono text-base font-semibold text-zinc-950">
                {previewScores.rataM !== null
                  ? previewScores.rataM.toFixed(2)
                  : 'KOSONG'}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <p className="text-[10px] font-medium text-zinc-600">Total Form</p>
              <p className="mt-1 font-mono text-base font-semibold text-zinc-950">
                {previewScores.totalForm !== null
                  ? previewScores.totalForm.toFixed(2)
                  : '-'}
              </p>
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

      {/* Data Jangka Menengah & Panjang + Evidence dari Unggahan Publik */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">
              Data Aksi Perubahan &amp; Evidence dari Peserta
            </h3>
            <p className="mt-0.5 text-xs text-zinc-600">
              Bahan konfirmasi evaluator sebelum mengisi wawancara (diunggah melalui tautan publik
              peserta).
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
              <span>Unduh Dokumen Proper ({proper.dokumenNama || 'File'})</span>
            </a>
          )}
        </div>

        {!proper ? (
          <p className="mt-3 text-xs text-zinc-600">
            Peserta belum mengunggah laporan Inovasi / Proper melalui tautan publik.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-950">
                  Target Jangka Menengah
                </span>
                <span className="rounded border border-zinc-400 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-900">
                  {proper.jangkaMenengahStatus === 'SUDAH_DILAKSANAKAN'
                    ? 'Sudah Dilaksanakan'
                    : 'Belum Dilaksanakan'}
                </span>
              </div>
              <p className="text-xs text-zinc-800 whitespace-pre-wrap">
                {proper.jangkaMenengahMilestone}
              </p>
              {proper.jangkaMenengahFotoId && (
                <button
                  type="button"
                  onClick={() =>
                    setEvidencePreview({
                      title: 'Foto Evidence Jangka Menengah',
                      fileId: proper.jangkaMenengahFotoId,
                      fileName: proper.jangkaMenengahFotoNama || 'evidence-menengah',
                    })
                  }
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
                >
                  <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Lihat foto evidence</span>
                </button>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-950">
                  Target Jangka Panjang
                </span>
                <span className="rounded border border-zinc-400 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-900">
                  {proper.jangkaPanjangStatus === 'SUDAH_DILAKSANAKAN'
                    ? 'Sudah Dilaksanakan'
                    : 'Belum Dilaksanakan'}
                </span>
              </div>
              <p className="text-xs text-zinc-800 whitespace-pre-wrap">
                {proper.jangkaPanjangMilestone}
              </p>
              {proper.jangkaPanjangFotoId && (
                <button
                  type="button"
                  onClick={() =>
                    setEvidencePreview({
                      title: 'Foto Evidence Jangka Panjang',
                      fileId: proper.jangkaPanjangFotoId,
                      fileName: proper.jangkaPanjangFotoNama || 'evidence-panjang',
                    })
                  }
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
                >
                  <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Lihat foto evidence</span>
                </button>
              )}
            </div>

            <div className="md:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold text-zinc-950">
                Kondisi Saat Ini / Ringkasan Implementasi
              </p>
              <p className="mt-1 text-xs text-zinc-800 whitespace-pre-wrap">
                {proper.kondisiSaatIni}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Form 5 Kriteria Wawancara (IT-07 Lock + Hasil & Bukti + Rentang Nilai) */}
      <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-50 px-5 py-3.5 text-xs text-zinc-800">
          <strong>Aturan IT-07:</strong> Angka wawancara yang sudah berasal dari impor Excel
          bersifat <strong>TERKUNCI</strong>. Evaluator hanya mengisi angka pada kriteria yang masih{' '}
          <strong>KOSONG</strong>, serta selalu mengisi atau melengkapi kolom{' '}
          <strong>Hasil wawancara &amp; bukti</strong>.
        </div>

        {WAWANCARA_KRITERIA.map((meta) => {
          const d = drafts[meta.key] || {
            nilai: '',
            deskripsi: '',
            lockedFromImport: false,
            sumber: 'KOSONG',
          };

          return (
            <section
              key={meta.key}
              className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4"
            >
              <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 pb-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-zinc-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                      Kriteria {meta.no} · Bobot {meta.bobot}%
                    </span>
                    {meta.masukRataM && (
                      <span className="rounded border border-zinc-400 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-800">
                        Pembentuk Rata-rata (M)
                      </span>
                    )}
                    {d.lockedFromImport && (
                      <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-950">
                        <LockClosedIcon className="h-3 w-3" aria-hidden="true" />
                        Terkunci dari Excel
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-zinc-950">{meta.judul}</h3>
                  <p className="mt-0.5 text-xs text-zinc-600">{meta.petunjukPertanyaan}</p>
                </div>

                <div className="w-full sm:w-44">
                  <label
                    htmlFor={`nilai-${meta.key}`}
                    className="mb-1 block text-xs font-medium text-zinc-800"
                  >
                    Nilai Wawancara (0-100)
                  </label>
                  <input
                    id={`nilai-${meta.key}`}
                    type="number"
                    min={0}
                    max={100}
                    disabled={d.lockedFromImport}
                    value={d.nilai}
                    placeholder="KOSONG"
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [meta.key]: { ...d, nilai: e.target.value },
                      }))
                    }
                    className="min-h-[44px] w-full rounded-lg border border-zinc-500 bg-white px-3 font-mono text-sm font-semibold text-zinc-950 focus:border-zinc-950 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-700"
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <label
                    htmlFor={`bukti-${meta.key}`}
                    className="mb-1.5 block text-xs font-medium text-zinc-800"
                  >
                    Hasil wawancara &amp; bukti (selalu dapat diisi evaluator)
                  </label>
                  <textarea
                    id={`bukti-${meta.key}`}
                    rows={4}
                    value={d.deskripsi}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [meta.key]: { ...d, deskripsi: e.target.value },
                      }))
                    }
                    placeholder="Catat hasil konfirmasi langsung dan bukti dukung dari alumni..."
                    className="w-full rounded-xl border border-zinc-500 bg-white p-3 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                  />
                </div>

                <div className="lg:col-span-5">
                  <div className="h-full rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
                    <p className="mb-2 text-[11px] font-semibold text-zinc-900">
                      Keterangan rentang nilai
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-zinc-700">
                      {meta.keteranganRentang.map((r) => (
                        <li key={r.rentang} className="flex gap-2">
                          <span className="w-24 shrink-0 font-mono font-semibold text-zinc-950">
                            {r.rentang}
                          </span>
                          <span>{r.arti}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

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
            type="submit"
            disabled={saving}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <CheckCircledIcon className="h-4 w-4" aria-hidden="true" />
            <span>{saving ? 'Menyimpan...' : 'Simpan & Tandai Selesai Wawancara'}</span>
          </button>
        </div>
      </form>

      {/* Dialog Pratinjau Foto Evidence */}
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
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${evidencePreview.fileId}`}
                  alt={evidencePreview.title}
                  className="max-h-[65vh] w-full object-contain"
                />
              </div>
              <div className="flex justify-end">
                <a
                  href={`/api/files/${evidencePreview.fileId}?download=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-zinc-100"
                >
                  <DownloadIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Unduh Gambar</span>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
