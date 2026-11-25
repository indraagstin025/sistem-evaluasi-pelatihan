'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircledIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  FileTextIcon,
  ImageIcon,
  ReloadIcon,
  UploadIcon,
} from '@radix-ui/react-icons';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBanner } from '@/components/ui/status-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import {
  fetchFormDataWithRetry,
  formatUploadNetworkError,
  readFileIntoMemoryBlob,
} from '@/lib/upload-client';
import {
  apiFetchJson,
  formatClientErrorMessage,
  isNetworkErrorLike,
  parseApiErrorFromResponse,
} from '@/lib/client-error';

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB batas upload Vercel

interface PublicKegiatanItem {
  id: string;
  nama: string;
  jenisPelatihan: string;
  penyelenggara: string;
  lokasi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
}

interface VerifiedPeserta {
  pesertaId: string;
  nama: string;
  nip: string | null;
  instansi: string | null;
  jabatanSaatIni: string | null;
  judulAksiPerubahanAwal: string | null;
  properSebelumnya: {
    judulProper: string;
    jangkaMenengahMilestone: string;
    jangkaMenengahStatus: 'SUDAH_DILAKSANAKAN' | 'BELUM_DILAKSANAKAN';
    jangkaMenengahFotoId: string | null;
    jangkaMenengahFotoNama: string | null;
    jangkaPanjangMilestone: string;
    jangkaPanjangStatus: 'SUDAH_DILAKSANAKAN' | 'BELUM_DILAKSANAKAN';
    jangkaPanjangFotoId: string | null;
    jangkaPanjangFotoNama: string | null;
    kondisiSaatIni: string;
    dokumenFileId: string | null;
    dokumenNama: string | null;
    dokumenSizeBytes: number | null;
    updatedAt: string;
  } | null;
}

function formatTanggalID(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UnggahInovasiWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [kegiatanList, setKegiatanList] = useState<PublicKegiatanItem[]>([]);
  const [loadingKegiatan, setLoadingKegiatan] = useState(true);
  const [selectedKegiatanId, setSelectedKegiatanId] = useState('');

  const [nip, setNip] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedPeserta, setVerifiedPeserta] = useState<VerifiedPeserta | null>(null);

  const [judulProper, setJudulProper] = useState('');
  const [menMilestone, setMenMilestone] = useState('');
  const [menStatus, setMenStatus] = useState<'BELUM_DILAKSANAKAN' | 'SUDAH_DILAKSANAKAN'>(
    'BELUM_DILAKSANAKAN'
  );
  const [menFotoId, setMenFotoId] = useState<string | null>(null);
  const [menFotoNama, setMenFotoNama] = useState<string | null>(null);

  const [panMilestone, setPanMilestone] = useState('');
  const [panStatus, setPanStatus] = useState<'BELUM_DILAKSANAKAN' | 'SUDAH_DILAKSANAKAN'>(
    'BELUM_DILAKSANAKAN'
  );
  const [panFotoId, setPanFotoId] = useState<string | null>(null);
  const [panFotoNama, setPanFotoNama] = useState<string | null>(null);

  const [kondisiSaatIni, setKondisiSaatIni] = useState('');
  const [dokumenFileId, setDokumenFileId] = useState<string | null>(null);
  const [dokumenNama, setDokumenNama] = useState<string | null>(null);
  const [dokumenSizeBytes, setDokumenSizeBytes] = useState<number | null>(null);

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadKegiatan = async () => {
      try {
        const json = await apiFetchJson<{ success: boolean; data?: PublicKegiatanItem[] }>(
          '/api/public/kegiatan'
        );
        if (json.success && Array.isArray(json.data)) {
          setKegiatanList(json.data);
          if (json.data.length === 1) {
            setSelectedKegiatanId(json.data[0].id);
          }
        }
      } catch (err: unknown) {
        setErrorMsg(
          formatClientErrorMessage(
            err,
            'Gagal memuat daftar kegiatan pelatihan. Coba muat ulang halaman.'
          )
        );
      } finally {
        setLoadingKegiatan(false);
      }
    };
    loadKegiatan();
  }, []);

  const selectedKegiatan = kegiatanList.find((k) => k.id === selectedKegiatanId);

  const handleVerifikasiNip = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setVerifying(true);
    try {
      const json = await apiFetchJson<{
        success: boolean;
        data?: VerifiedPeserta;
        error?: string;
      }>('/api/public/verifikasi-peserta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kegiatanId: selectedKegiatanId, nip }),
        fallbackError:
          'NIP atau NIK tidak ditemukan pada kegiatan ini. Periksa kembali angka yang dimasukkan.',
      });
      if (!json.success || !json.data) {
        setErrorMsg(json.error || 'NIP atau NIK tidak ditemukan pada kegiatan ini. Periksa kembali angka yang dimasukkan.');
        return;
      }

      const d: VerifiedPeserta = json.data;
      setVerifiedPeserta(d);
      const prev = d.properSebelumnya;
      setJudulProper(prev?.judulProper || d.judulAksiPerubahanAwal || '');
      setMenMilestone(prev?.jangkaMenengahMilestone || '');
      setMenStatus(prev?.jangkaMenengahStatus || 'BELUM_DILAKSANAKAN');
      setMenFotoId(prev?.jangkaMenengahFotoId || null);
      setMenFotoNama(prev?.jangkaMenengahFotoNama || null);
      setPanMilestone(prev?.jangkaPanjangMilestone || '');
      setPanStatus(prev?.jangkaPanjangStatus || 'BELUM_DILAKSANAKAN');
      setPanFotoId(prev?.jangkaPanjangFotoId || null);
      setPanFotoNama(prev?.jangkaPanjangFotoNama || null);
      setKondisiSaatIni(prev?.kondisiSaatIni || '');
      setDokumenFileId(prev?.dokumenFileId || null);
      setDokumenNama(prev?.dokumenNama || null);
      setDokumenSizeBytes(prev?.dokumenSizeBytes || null);
      setStep(3);
    } catch (err: unknown) {
      setErrorMsg(formatClientErrorMessage(err, 'Gagal memverifikasi NIP peserta.'));
    } finally {
      setVerifying(false);
    }
  };

  const handleFileUpload = async (
    kind: 'dokumen' | 'foto_menengah' | 'foto_panjang',
    file: File | undefined
  ) => {
    if (!file) return;
    setErrorMsg(null);

    if (file.size > MAX_BYTES) {
      setErrorMsg(
        `Ukuran file "${file.name}" (${formatBytes(file.size)}) melebihi batas maksimal 3 MB.`
      );
      return;
    }

    setUploadingField(kind);
    try {
      const memoryBlob = await readFileIntoMemoryBlob(file);
      const res = await fetchFormDataWithRetry('/api/public/upload-file', () => {
        const fd = new FormData();
        fd.append('kegiatanId', selectedKegiatanId);
        fd.append('nip', nip);
        fd.append('kind', kind);
        fd.append('file', memoryBlob, file.name);
        return fd;
      });
      if (!res.ok) {
        const parsed = await parseApiErrorFromResponse(res, 'Gagal mengunggah file. Silakan coba lagi.');
        setErrorMsg(parsed.message);
        return;
      }
      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.error || 'Gagal mengunggah file. Silakan coba lagi.');
        return;
      }

      if (kind === 'dokumen') {
        setDokumenFileId(json.data.id);
        setDokumenNama(json.data.filename);
        setDokumenSizeBytes(json.data.sizeBytes);
      } else if (kind === 'foto_menengah') {
        setMenFotoId(json.data.id);
        setMenFotoNama(json.data.filename);
      } else {
        setPanFotoId(json.data.id);
        setPanFotoNama(json.data.filename);
      }
    } catch (err: any) {
      setErrorMsg(
        isNetworkErrorLike(err)
          ? formatUploadNetworkError()
          : formatClientErrorMessage(err, formatUploadNetworkError())
      );
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmSubmitOpen(true);
  };

  const executeSubmitFinal = async () => {
    setConfirmSubmitOpen(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const json = await apiFetchJson<{
        success: boolean;
        message?: string;
        error?: string;
      }>('/api/public/unggah-inovasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kegiatanId: selectedKegiatanId,
          nip,
          judulProper,
          jangkaMenengahMilestone: menMilestone,
          jangkaMenengahStatus: menStatus,
          jangkaMenengahFotoId: menStatus === 'SUDAH_DILAKSANAKAN' ? menFotoId : null,
          jangkaPanjangMilestone: panMilestone,
          jangkaPanjangStatus: panStatus,
          jangkaPanjangFotoId: panStatus === 'SUDAH_DILAKSANAKAN' ? panFotoId : null,
          kondisiSaatIni,
          dokumenFileId,
        }),
        fallbackError: 'Gagal menyimpan unggahan Proper. Silakan coba lagi.',
      });

      if (!json.success) {
        setErrorMsg(json.error || 'Gagal menyimpan unggahan Proper. Silakan coba lagi.');
        return;
      }

      setSuccessMsg(json.message || 'Dokumen Proper berhasil disimpan.');
    } catch (err: unknown) {
      setErrorMsg(formatClientErrorMessage(err, 'Gagal menyimpan unggahan Proper.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-xs font-medium text-zinc-600">
          Evaluasi Pasca Pelatihan · Badan Pengembangan Sumber Daya Manusia (BPSDM) Provinsi Jawa Barat
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
          Unggah Dokumen Proper (Tautan Publik)
        </h1>
        <p className="mt-1.5 text-sm font-normal text-zinc-600">
          Ikuti 3 langkah berikut untuk mengunggah Proper (laporan Proyek Perubahan peserta) tanpa perlu masuk akun. Batas maksimal ukuran per file adalah 3 MB.
        </p>

        {/* Indikator 3 Langkah */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { num: 1, label: 'Pilih Kegiatan' },
            { num: 2, label: 'Verifikasi NIP' },
            { num: 3, label: 'Unggah Dokumen' },
          ].map((item) => {
            const active = step === item.num;
            const done = step > item.num;
            return (
              <div
                key={item.num}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                  active
                    ? 'border-zinc-950 bg-zinc-950 text-white'
                    : done
                      ? 'border-zinc-400 bg-zinc-100 text-zinc-950'
                      : 'border-zinc-200 bg-white text-zinc-500'
                }`}
              >
                <span className="font-mono font-semibold">{item.num}.</span>
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <StatusBanner tone="error" message={errorMsg} onDismiss={() => setErrorMsg(null)} />
      )}

      {successMsg && (
        <div className="rounded-2xl border border-zinc-950 bg-zinc-950 p-6 text-white">
          <div className="flex items-start gap-3">
            <CheckCircledIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold">{successMsg}</h2>
              <p className="mt-1 text-xs text-zinc-300">
                Peserta: {verifiedPeserta?.nama} ({verifiedPeserta?.nip}) · Dokumen: {dokumenNama}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessMsg(null);
                  }}
                  className="rounded-lg border border-white/40 px-3.5 py-2 text-xs font-medium text-white hover:bg-white/10"
                >
                  Ubah Isian
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessMsg(null);
                    setVerifiedPeserta(null);
                    setNip('');
                    setStep(1);
                  }}
                  className="rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-200"
                >
                  Unggah untuk Peserta Lain
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LANGKAH 1: PILIH KEGIATAN */}
      {step === 1 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-950">
            Langkah 1: Pilih Kegiatan Pelatihan
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Pilih nama pelatihan / kegiatan evaluasi pasca pelatihan Anda.
          </p>

          {loadingKegiatan ? (
            <div className="mt-4 space-y-2" aria-busy="true" aria-label="Memuat daftar kegiatan">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-9 w-36" />
            </div>
          ) : kegiatanList.length === 0 ? (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600">
              Belum ada kegiatan aktif yang tersedia untuk unggahan publik.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="public-kegiatan-select"
                  className="mb-1.5 block text-xs font-medium text-zinc-900"
                >
                  Nama Pelatihan / Kegiatan
                </label>
                <Select value={selectedKegiatanId} onValueChange={setSelectedKegiatanId}>
                  <SelectTrigger id="public-kegiatan-select" className="border-zinc-500">
                    <SelectValue placeholder="Pilih kegiatan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {kegiatanList.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.jenisPelatihan} · {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedKegiatan && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700">
                  <p className="font-semibold text-zinc-950">{selectedKegiatan.nama}</p>
                  <p className="mt-1">
                    {selectedKegiatan.penyelenggara} · {selectedKegiatan.lokasi}
                  </p>
                  <p className="mt-0.5 text-zinc-600">
                    Periode: {formatTanggalID(selectedKegiatan.tanggalMulai)} sampai dengan{' '}
                    {formatTanggalID(selectedKegiatan.tanggalSelesai)}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!selectedKegiatanId}
                  onClick={() => {
                    setErrorMsg(null);
                    setStep(2);
                  }}
                  className="min-h-[40px] rounded-lg bg-zinc-950 px-5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  Lanjut ke Verifikasi NIP
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LANGKAH 2: VERIFIKASI NIP/NIK */}
      {step === 2 && (
        <form
          onSubmit={handleVerifikasiNip}
          className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4"
        >
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              Langkah 2: Verifikasi Identitas Peserta (NIP / NIK)
            </h2>
            <p className="mt-1 text-xs text-zinc-600">
              Nomor Induk Pegawai (NIP) atau Nomor Induk Kependudukan (NIK) hanya digunakan untuk mencocokkan peserta pada kegiatan{' '}
              <span className="font-semibold text-zinc-950">{selectedKegiatan?.nama}</span>.
            </p>
          </div>

          <div>
            <label htmlFor="public-nip" className="mb-1.5 block text-xs font-medium text-zinc-900">
              NIP atau NIK
            </label>
              <input
              id="public-nip"
              name="nip"
              type="text"
              autoComplete="off"
              inputMode="numeric"
              required
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              placeholder="Contoh: 197601042008011003"
              className="w-full rounded-lg border border-zinc-500 bg-white px-3.5 py-2.5 font-mono text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setStep(1);
              }}
              className="min-h-[40px] rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-zinc-100"
            >
              Kembali Pilih Kegiatan
            </button>
            <button
              type="submit"
              disabled={verifying || !nip.trim()}
              className="min-h-[40px] rounded-lg bg-zinc-950 px-5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {verifying ? 'Memverifikasi...' : 'Verifikasi NIP'}
            </button>
          </div>
        </form>
      )}

      {/* LANGKAH 3: INFORMASI PROPER & UNGGAH DOKUMEN */}
      {step === 3 && verifiedPeserta && !successMsg && (
        <form onSubmit={handleSubmitFinal} className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-zinc-600">Peserta Terverifikasi</p>
                <h2 className="text-lg font-semibold text-zinc-950">{verifiedPeserta.nama}</h2>
                <p className="mt-0.5 font-mono text-xs text-zinc-600">
                  NIP {verifiedPeserta.nip || '-'} · {verifiedPeserta.instansi || '-'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  setVerifiedPeserta(null);
                }}
                className="rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-zinc-100"
              >
                Ganti Peserta
              </button>
            </div>

            {verifiedPeserta.properSebelumnya && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-zinc-400 bg-zinc-50 p-3 text-xs text-zinc-800">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950" aria-hidden="true" />
                <p>
                  Anda sudah pernah mengunggah dokumen Proper (
                  <span className="font-semibold">{verifiedPeserta.properSebelumnya.dokumenNama}</span>
                  ). Dokumen lama akan diganti setelah dokumen baru berhasil diunggah dan disimpan.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
            <h3 className="text-base font-semibold text-zinc-950">
              Informasi Proper (Laporan Proyek Perubahan)
            </h3>

            <div>
              <label
                htmlFor="proper-judul"
                className="mb-1.5 block text-xs font-medium text-zinc-900"
              >
                Judul Proper
              </label>
              <input
                id="proper-judul"
                type="text"
                required
                value={judulProper}
                onChange={(e) => setJudulProper(e.target.value)}
                placeholder="Tuliskan judul lengkap Proper Anda"
                className="w-full rounded-lg border border-zinc-500 bg-white px-3.5 py-2 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
              />
            </div>

            {/* Jangka Menengah */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-zinc-950">Jangka Menengah</p>
              <div>
                <label
                  htmlFor="menengah-milestone"
                  className="mb-1 block text-xs font-medium text-zinc-800"
                >
                  Tahapan Kerja (Milestone) / Rencana Jangka Menengah
                </label>
                <textarea
                  id="menengah-milestone"
                  rows={2}
                  required
                  value={menMilestone}
                  onChange={(e) => setMenMilestone(e.target.value)}
                  placeholder="Contoh: Tahapan ke-5 - Penerapan aplikasi & penyusunan SOP"
                  className="w-full rounded-lg border border-zinc-500 bg-white p-2.5 text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-zinc-800">
                  Status Bukti Pelaksanaan (Evidence) Jangka Menengah
                </span>
                <RadioGroup
                  value={menStatus}
                  onValueChange={(v) =>
                    setMenStatus(
                      v === 'SUDAH_DILAKSANAKAN' ? 'SUDAH_DILAKSANAKAN' : 'BELUM_DILAKSANAKAN'
                    )
                  }
                  className="flex flex-wrap gap-4"
                >
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-900">
                    <RadioGroupItem value="BELUM_DILAKSANAKAN" id="men-belum" />
                    <span>Belum Dilaksanakan</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-900">
                    <RadioGroupItem value="SUDAH_DILAKSANAKAN" id="men-sudah" />
                    <span>Sudah Dilaksanakan (wajib unggah foto)</span>
                  </label>
                </RadioGroup>
              </div>

              {menStatus === 'SUDAH_DILAKSANAKAN' && (
                <div className="pt-1">
                  <label
                    htmlFor="foto-menengah"
                    className="mb-1 block text-xs font-medium text-zinc-800"
                  >
                    Foto Bukti Pelaksanaan Jangka Menengah (JPG/PNG/WEBP, maks. 3 MB)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="foto-menengah"
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-zinc-100"
                    >
                      <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {uploadingField === 'foto_menengah'
                          ? 'Mengunggah...'
                          : menFotoNama
                            ? 'Ganti Foto'
                            : 'Pilih Foto Bukti'}
                      </span>
                    </label>
                    <input
                      id="foto-menengah"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/*"
                      onChange={(e) => handleFileUpload('foto_menengah', e.target.files?.[0])}
                      className="sr-only"
                    />
                    {menFotoNama && (
                      <span className="text-xs font-medium text-zinc-800">
                        File tersimpan: {menFotoNama}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Jangka Panjang */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-zinc-950">Jangka Panjang</p>
              <div>
                <label
                  htmlFor="panjang-milestone"
                  className="mb-1 block text-xs font-medium text-zinc-800"
                >
                  Tahapan Kerja (Milestone) / Rencana Jangka Panjang
                </label>
                <textarea
                  id="panjang-milestone"
                  rows={2}
                  required
                  value={panMilestone}
                  onChange={(e) => setPanMilestone(e.target.value)}
                  placeholder="Tuliskan target dan rencana jangka panjang"
                  className="w-full rounded-lg border border-zinc-500 bg-white p-2.5 text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
                />
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-zinc-800">
                  Status Bukti Pelaksanaan (Evidence) Jangka Panjang
                </span>
                <RadioGroup
                  value={panStatus}
                  onValueChange={(v) =>
                    setPanStatus(
                      v === 'SUDAH_DILAKSANAKAN' ? 'SUDAH_DILAKSANAKAN' : 'BELUM_DILAKSANAKAN'
                    )
                  }
                  className="flex flex-wrap gap-4"
                >
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-900">
                    <RadioGroupItem value="BELUM_DILAKSANAKAN" id="pan-belum" />
                    <span>Belum Dilaksanakan</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-900">
                    <RadioGroupItem value="SUDAH_DILAKSANAKAN" id="pan-sudah" />
                    <span>Sudah Dilaksanakan (wajib unggah foto)</span>
                  </label>
                </RadioGroup>
              </div>

              {panStatus === 'SUDAH_DILAKSANAKAN' && (
                <div className="pt-1">
                  <label
                    htmlFor="foto-panjang"
                    className="mb-1 block text-xs font-medium text-zinc-800"
                  >
                    Foto Bukti Pelaksanaan Jangka Panjang (JPG/PNG/WEBP, maks. 3 MB)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="foto-panjang"
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-zinc-100"
                    >
                      <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {uploadingField === 'foto_panjang'
                          ? 'Mengunggah...'
                          : panFotoNama
                            ? 'Ganti Foto'
                            : 'Pilih Foto Bukti'}
                      </span>
                    </label>
                    <input
                      id="foto-panjang"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/*"
                      onChange={(e) => handleFileUpload('foto_panjang', e.target.files?.[0])}
                      className="sr-only"
                    />
                    {panFotoNama && (
                      <span className="text-xs font-medium text-zinc-800">
                        File tersimpan: {panFotoNama}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="kondisi-saat-ini"
                className="mb-1.5 block text-xs font-medium text-zinc-900"
              >
                Kondisi Proper Saat Ini
              </label>
              <textarea
                id="kondisi-saat-ini"
                rows={3}
                required
                value={kondisiSaatIni}
                onChange={(e) => setKondisiSaatIni(e.target.value)}
                placeholder="Jelaskan kondisi terkini pelaksanaan Proper di unit kerja Anda"
                className="w-full rounded-lg border border-zinc-500 bg-white p-2.5 text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
              />
            </div>

            <div className="rounded-xl border border-dashed border-zinc-500 bg-zinc-50 p-4">
              <label
                htmlFor="dokumen-proper"
                className="block text-xs font-semibold text-zinc-950"
              >
                Unggah Dokumen Proper (PDF, Word, PowerPoint, Excel, ZIP, RAR · Maks. 3 MB)
              </label>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <label
                  htmlFor="dokumen-proper"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-zinc-100"
                >
                  <UploadIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {uploadingField === 'dokumen'
                      ? 'Mengunggah...'
                      : dokumenNama
                        ? 'Ganti Dokumen Proper'
                        : 'Pilih Dokumen Proper'}
                  </span>
                </label>
                <input
                  id="dokumen-proper"
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                  onChange={(e) => handleFileUpload('dokumen', e.target.files?.[0])}
                  className="sr-only"
                />
                {dokumenNama && (
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-400 bg-white px-2.5 py-1 text-xs text-zinc-900">
                    <FileTextIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="font-medium">{dokumenNama}</span>
                    {dokumenSizeBytes ? (
                      <span className="font-mono text-[11px] text-zinc-600">
                        ({formatBytes(dokumenSizeBytes)})
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || uploadingField !== null}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                <span>{submitting ? 'Menyimpan...' : 'Simpan & Kirim Dokumen Proper'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={confirmSubmitOpen}
        onOpenChange={(open) => {
          if (!submitting) setConfirmSubmitOpen(open);
        }}
        title="Kirim Laporan Inovasi Proper?"
        description="Pastikan judul Proper, status jangka menengah & panjang, kondisi saat ini, serta dokumen/foto pendukung sudah benar sebelum dikirim ke tim Evaluator."
        confirmLabel="Ya, Kirim Sekarang"
        tone="primary"
        loading={submitting}
        onConfirm={() => {
          void executeSubmitFinal();
        }}
      />
    </div>
  );
}
