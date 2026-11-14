'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckIcon,
  Pencil1Icon,
  PersonIcon,
  ReloadIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import {
  hitungRataSurveiL,
  hitungRataWawancaraM,
  hitungTotalForm,
  tentukanRentang,
} from '@/lib/hitung';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { StatusBanner } from '@/components/ui/status-banner';

export default function InputNilaiDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [peserta, setPeserta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingProfil, setSavingProfil] = useState(false);
  const [deletingPeserta, setDeletingPeserta] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'delete' | 'clear' | null>(null);
  const [isEditingProfil, setIsEditingProfil] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const [profilForm, setProfilForm] = useState({
    nama: '',
    nip: '',
    jabatanPelatihan: '',
    jabatanSaatIni: '',
    instansi: '',
  });

  // Keterlacakan sumber per nilai (UR-N-05: Form | Ekspose | Jawaban)
  const [surveySumber, setSurveySumber] = useState({
    L4_01: 'Form',
    L4_02: 'Form',
    L4_03: 'Form',
  });
  const [wawancaraSumber, setWawancaraSumber] = useState({
    menengah: 'Form',
    jangkaPanjang: 'Form',
    seluruhTujuan: 'Form',
    manfaat: 'Form',
    komunikasi: 'Form',
  });
  const [l3Summary, setL3Summary] = useState<{ count: number; sumber: string }>({
    count: 0,
    sumber: 'Jawaban',
  });

  const [survey, setSurvey] = useState<{
    L4_01: number | '';
    L4_02: number | '';
    L4_03: number | '';
  }>({
    L4_01: '',
    L4_02: '',
    L4_03: '',
  });

  const [wawancara, setWawancara] = useState<{
    menengah: number | '';
    jangkaPanjang: number | '';
    seluruhTujuan: number | '';
    manfaat: number | '';
    komunikasi: number | '';
  }>({
    menengah: '',
    jangkaPanjang: '',
    seluruhTujuan: '',
    manfaat: '',
    komunikasi: '',
  });

  const [deskripsi, setDeskripsi] = useState<{
    menengah: string;
    jangkaPanjang: string;
    seluruhTujuan: string;
    manfaat: string;
    komunikasi: string;
  }>({
    menengah: '',
    jangkaPanjang: '',
    seluruhTujuan: '',
    manfaat: '',
    komunikasi: '',
  });

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch(`/api/peserta/${params.id}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        if (res.status === 404) {
          setPeserta(null);
          return;
        }
        setFetchError(json.error || 'Gagal memuat detail peserta.');
        return;
      }

      const p = json.data;
      setPeserta(p);
      setProfilForm({
        nama: p.nama || '',
        nip: p.nip || '',
        jabatanPelatihan: p.jabatanPelatihan || '',
        jabatanSaatIni: p.jabatanSaatIni || '',
        instansi: p.instansi || '',
      });

      const s1Obj = p.survey?.find((s: any) => s.kode === 'L4_01');
      const s2Obj = p.survey?.find((s: any) => s.kode === 'L4_02');
      const s3Obj = p.survey?.find((s: any) => s.kode === 'L4_03');
      setSurvey({
        L4_01: s1Obj?.skor ?? '',
        L4_02: s2Obj?.skor ?? '',
        L4_03: s3Obj?.skor ?? '',
      });
      setSurveySumber({
        L4_01: s1Obj?.sumber || 'Form',
        L4_02: s2Obj?.sumber || 'Form',
        L4_03: s3Obj?.sumber || 'Form',
      });

      const l3List = (p.survey || []).filter(
        (s: any) => typeof s.kode === 'string' && s.kode.startsWith('L3_')
      );
      setL3Summary({
        count: l3List.length,
        sumber: l3List[0]?.sumber || 'Jawaban',
      });

      const wMen = p.wawancara?.find((w: any) => w.kriteria === 'menengah');
      const wPan = p.wawancara?.find((w: any) => w.kriteria === 'jangkaPanjang');
      const wTuj = p.wawancara?.find((w: any) => w.kriteria === 'seluruhTujuan');
      const wMan = p.wawancara?.find((w: any) => w.kriteria === 'manfaat');
      const wKom = p.wawancara?.find((w: any) => w.kriteria === 'komunikasi');

      setWawancara({
        menengah: wMen?.nilai ?? '',
        jangkaPanjang: wPan?.nilai ?? '',
        seluruhTujuan: wTuj?.nilai ?? '',
        manfaat: wMan?.nilai ?? '',
        komunikasi: wKom?.nilai ?? '',
      });

      setWawancaraSumber({
        menengah: wMen?.sumber || 'Form',
        jangkaPanjang: wPan?.sumber || 'Form',
        seluruhTujuan: wTuj?.sumber || 'Form',
        manfaat: wMan?.sumber || 'Form',
        komunikasi: wKom?.sumber || 'Form',
      });

      setDeskripsi({
        menengah: wMen?.deskripsi || '',
        jangkaPanjang: wPan?.deskripsi || '',
        seluruhTujuan: wTuj?.deskripsi || '',
        manfaat: wMan?.deskripsi || '',
        komunikasi: wKom?.deskripsi || '',
      });
    } catch (err) {
      console.error('Error fetching detail peserta:', err);
      setFetchError('Koneksi bermasalah saat memuat detail peserta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [params.id]);

  const liveL = hitungRataSurveiL(survey.L4_01, survey.L4_02, survey.L4_03);
  const liveM = hitungRataWawancaraM(
    wawancara.jangkaPanjang,
    wawancara.seluruhTujuan,
    wawancara.manfaat
  );
  const liveTotalForm = hitungTotalForm(
    wawancara.menengah,
    wawancara.jangkaPanjang,
    wawancara.seluruhTujuan,
    wawancara.manfaat,
    wawancara.komunikasi
  );
  const liveSelisih = liveL !== null && liveM !== null ? liveM - liveL : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const surveyPayload = [
        { kode: 'L4_01', skor: survey.L4_01 === '' ? null : Number(survey.L4_01) },
        { kode: 'L4_02', skor: survey.L4_02 === '' ? null : Number(survey.L4_02) },
        { kode: 'L4_03', skor: survey.L4_03 === '' ? null : Number(survey.L4_03) },
      ];

      const resSurvey = await fetch(`/api/peserta/${params.id}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyPayload),
      });

      const wawancaraPayload = [
        {
          kriteria: 'menengah',
          bobot: 20,
          nilai: wawancara.menengah === '' ? null : Number(wawancara.menengah),
          deskripsi: deskripsi.menengah,
        },
        {
          kriteria: 'jangkaPanjang',
          bobot: 20,
          nilai: wawancara.jangkaPanjang === '' ? null : Number(wawancara.jangkaPanjang),
          deskripsi: deskripsi.jangkaPanjang,
        },
        {
          kriteria: 'seluruhTujuan',
          bobot: 20,
          nilai: wawancara.seluruhTujuan === '' ? null : Number(wawancara.seluruhTujuan),
          deskripsi: deskripsi.seluruhTujuan,
        },
        {
          kriteria: 'manfaat',
          bobot: 30,
          nilai: wawancara.manfaat === '' ? null : Number(wawancara.manfaat),
          deskripsi: deskripsi.manfaat,
        },
        {
          kriteria: 'komunikasi',
          bobot: 10,
          nilai: wawancara.komunikasi === '' ? null : Number(wawancara.komunikasi),
          deskripsi: deskripsi.komunikasi,
        },
      ];

      const resWawancara = await fetch(`/api/peserta/${params.id}/wawancara`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wawancaraPayload),
      });

      if (!resSurvey.ok || !resWawancara.ok) {
        setMessage({
          text: 'Sebagian nilai gagal disimpan. Periksa input lalu coba lagi.',
          tone: 'error',
        });
        return;
      }

      setMessage({ text: 'Nilai peserta sudah disimpan.', tone: 'success' });
      fetchDetail();
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Koneksi bermasalah saat menyimpan. Coba lagi.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilForm.nama.trim()) return;
    try {
      setSavingProfil(true);
      setMessage(null);
      const res = await fetch(`/api/peserta/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilForm),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsEditingProfil(false);
        setMessage({ text: 'Profil peserta sudah diperbarui.', tone: 'success' });
        fetchDetail();
      } else {
        setMessage({
          text: json.error || 'Gagal memperbarui profil. Coba lagi.',
          tone: 'error',
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({
        text: 'Koneksi bermasalah saat menyimpan profil. Coba lagi.',
        tone: 'error',
      });
    } finally {
      setSavingProfil(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmMode === 'clear') {
      setWawancara({
        menengah: '',
        jangkaPanjang: '',
        seluruhTujuan: '',
        manfaat: '',
        komunikasi: '',
      });
      setDeskripsi({
        menengah: '',
        jangkaPanjang: '',
        seluruhTujuan: '',
        manfaat: '',
        komunikasi: '',
      });
      setConfirmMode(null);
      setMessage({
        text: 'Kolom nilai wawancara dikosongkan. Klik Simpan Perubahan untuk menerapkan ke database.',
        tone: 'success',
      });
      return;
    }

    if (confirmMode === 'delete') {
      try {
        setDeletingPeserta(true);
        const res = await fetch(`/api/peserta/${params.id}`, { method: 'DELETE' });
        const json = await res.json();
        setConfirmMode(null);
        if (res.ok && json.success) {
          router.push('/peserta');
        } else {
          setMessage({ text: json.error || 'Gagal menghapus peserta.', tone: 'error' });
        }
      } catch (err) {
        console.error(err);
        setConfirmMode(null);
        setMessage({
          text: 'Koneksi bermasalah saat menghapus peserta. Coba lagi.',
          tone: 'error',
        });
      } finally {
        setDeletingPeserta(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center" aria-busy="true">
        <ReloadIcon className="mx-auto mb-3 h-6 w-6 animate-spin text-zinc-950" aria-hidden="true" />
        <p className="text-xs font-medium text-zinc-600">Memuat data peserta...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-5xl py-12">
        <StatusBanner
          tone="error"
          title="Gagal memuat detail peserta"
          message={fetchError}
          onRetry={fetchDetail}
        />
      </div>
    );
  }

  if (!peserta) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium text-zinc-800">Peserta tidak ditemukan.</p>
        <Link
          href="/peserta"
          className="mt-2 inline-block text-xs font-medium text-zinc-950 underline underline-offset-4 hover:text-zinc-600"
        >
          Kembali ke Daftar Peserta
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3 sm:items-center">
          <Link
            href="/peserta"
            aria-label="Kembali ke Daftar Peserta"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-500 bg-white text-zinc-800 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
              {peserta.nama}
            </h1>
            <p className="mt-0.5 text-xs font-normal text-zinc-600">
              {peserta.nip ? `NIP. ${peserta.nip}` : 'NIP belum tercatat'} · {peserta.instansi || '-'}
            </p>
            {(peserta.jabatanSaatIni || peserta.jabatanPelatihan || l3Summary.count > 0) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-normal text-zinc-600">
                {peserta.jabatanSaatIni && <span>Jabatan: {peserta.jabatanSaatIni}</span>}
                {l3Summary.count > 0 && (
                  <span className="rounded-md border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-800">
                    {l3Summary.count} jawaban perubahan perilaku tersimpan · Sumber: {l3Summary.sumber}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setIsEditingProfil((prev) => !prev)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
          >
            <Pencil1Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {isEditingProfil ? 'Tutup Profil' : 'Edit Profil'}
          </button>

          <button
            type="button"
            onClick={() => setConfirmMode('clear')}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
          >
            <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Kosongkan Nilai Wawancara
          </button>

          <button
            type="button"
            onClick={() => setConfirmMode('delete')}
            disabled={deletingPeserta}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-950 bg-zinc-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {deletingPeserta ? 'Menghapus...' : 'Hapus Peserta'}
          </button>
        </div>
      </div>

      {/* Form Edit Profil Peserta */}
      {isEditingProfil && (
        <form
          onSubmit={handleSaveProfil}
          className="space-y-4 rounded-2xl border border-zinc-950 bg-white p-5 text-xs"
        >
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-2.5">
            <PersonIcon className="h-4 w-4 text-zinc-950" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-zinc-950">Ubah Profil Peserta</h2>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div>
              <label htmlFor="profil-nama" className="mb-1 block font-medium text-zinc-900">
                Nama Peserta <span className="font-semibold text-zinc-950">*</span>
              </label>
              <input
                id="profil-nama"
                type="text"
                required
                value={profilForm.nama}
                onChange={(e) => setProfilForm({ ...profilForm, nama: e.target.value })}
                className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="profil-nip" className="mb-1 block font-medium text-zinc-900">
                NIP
              </label>
              <input
                id="profil-nip"
                type="text"
                value={profilForm.nip}
                onChange={(e) => setProfilForm({ ...profilForm, nip: e.target.value })}
                className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 font-mono text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="profil-instansi" className="mb-1 block font-medium text-zinc-900">
                Instansi
              </label>
              <input
                id="profil-instansi"
                type="text"
                value={profilForm.instansi}
                onChange={(e) => setProfilForm({ ...profilForm, instansi: e.target.value })}
                className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="profil-jabatan-sekarang" className="mb-1 block font-medium text-zinc-900">
                Jabatan Saat Ini
              </label>
              <input
                id="profil-jabatan-sekarang"
                type="text"
                value={profilForm.jabatanSaatIni}
                onChange={(e) =>
                  setProfilForm({ ...profilForm, jabatanSaatIni: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="profil-jabatan-pelatihan" className="mb-1 block font-medium text-zinc-900">
                Jabatan Saat Pelatihan
              </label>
              <input
                id="profil-jabatan-pelatihan"
                type="text"
                value={profilForm.jabatanPelatihan}
                onChange={(e) =>
                  setProfilForm({ ...profilForm, jabatanPelatihan: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingProfil(false)}
              className="rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-900 transition hover:bg-zinc-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingProfil}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {savingProfil ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      )}

      {message && (
        <StatusBanner
          tone={message.tone}
          message={message.text}
          onDismiss={() => setMessage(null)}
        />
      )}

      {/* Live Calculation Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <span className="block text-xs font-medium text-zinc-600">Nilai L (Survei)</span>
          <div className="mt-1 font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
            {liveL !== null ? (
              liveL.toFixed(2)
            ) : (
              <span className="inline-block rounded bg-zinc-950 px-2 py-0.5 text-xs font-medium text-white">KOSONG</span>
            )}
          </div>
          <span className="mt-1 block text-[11px] font-normal text-zinc-600">
            Rentang: {tentukanRentang(liveL)}
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <span className="block text-xs font-medium text-zinc-600">Nilai M (Wawancara)</span>
          <div className="mt-1 font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
            {liveM !== null ? (
              liveM.toFixed(2)
            ) : (
              <span className="inline-block rounded bg-zinc-950 px-2 py-0.5 text-xs font-medium text-white">KOSONG</span>
            )}
          </div>
          <span className="mt-1 block text-[11px] font-normal text-zinc-600">
            Rentang: {tentukanRentang(liveM)}
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <span className="block text-xs font-medium text-zinc-600">Total Form</span>
          <div className="mt-1 font-mono text-2xl font-semibold text-zinc-950 tabular-nums">
            {liveTotalForm !== null ? (
              liveTotalForm.toFixed(2)
            ) : (
              <span className="inline-block rounded bg-zinc-950 px-2 py-0.5 text-xs font-medium text-white">KOSONG</span>
            )}
          </div>
          <span className="mt-1 block text-[11px] font-normal text-zinc-600">
            5 kriteria berbobot
          </span>
        </div>

        <div className="rounded-2xl bg-zinc-950 p-4 text-white">
          <span className="block text-xs font-medium text-zinc-300">Selisih (M - L)</span>
          <div className="mt-1 font-mono text-2xl font-semibold text-white tabular-nums">
            {liveSelisih !== null ? (
              <span>
                {liveSelisih > 0 ? `+${liveSelisih.toFixed(2)}` : liveSelisih.toFixed(2)}
              </span>
            ) : (
              <span className="text-base font-normal text-zinc-400">-</span>
            )}
          </div>
          <span className="mt-1 block text-[11px] font-normal text-zinc-300">
            Selisih penilaian
          </span>
        </div>
      </div>

      {/* Main Two-Column Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Kolom Kiri: Survei Alumni (Skala 1-4) */}
        <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="flex items-baseline gap-2 text-sm font-semibold text-zinc-950">
              <span className="font-mono text-xs font-medium text-zinc-600">01</span>
              <span>Survei Alumni (Skala 1-4)</span>
            </h2>
            <p className="mt-1 text-xs font-normal text-zinc-600">
              4 = Sangat Sesuai, 3 = Sesuai, 2 = Kurang Sesuai, 1 = Tidak Sesuai
            </p>
          </div>

          <div className="space-y-4">
            {[
              { key: 'L4_01' as const, label: 'Butir 1: Target Jangka Panjang' },
              { key: 'L4_02' as const, label: 'Butir 2: Seluruh Tujuan Tercapai' },
              { key: 'L4_03' as const, label: 'Butir 3: Manfaat Aksi Perubahan' },
            ].map((item) => {
              const inputId = `survey-${item.key}`;
              return (
                <div key={item.key}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label htmlFor={inputId} className="text-xs font-medium text-zinc-900">
                      {item.label}
                    </label>
                    <span className="rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[11px] font-normal text-zinc-700">
                      Sumber: {surveySumber[item.key]}
                    </span>
                  </div>
                  <input
                    id={inputId}
                    type="number"
                    min="1"
                    max="4"
                    step="1"
                    value={survey[item.key]}
                    onChange={(e) =>
                      setSurvey({
                        ...survey,
                        [item.key]: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    placeholder="Skor 1 - 4"
                    className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Wawancara Evaluator (Skala 0-100) */}
        <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="flex items-baseline gap-2 text-sm font-semibold text-zinc-950">
              <span className="font-mono text-xs font-medium text-zinc-600">02</span>
              <span>Wawancara Evaluator (Skala 0-100)</span>
            </h2>
            <p className="mt-1 text-xs font-normal text-zinc-600">
              Penilaian evaluator terhadap 5 kriteria hasil Aksi Perubahan
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                key: 'menengah' as const,
                label: '1. Target Jangka Menengah (Bobot 20%)',
                placeholder: 'Nilai 0 - 100',
              },
              {
                key: 'jangkaPanjang' as const,
                label: '2. Target Jangka Panjang (Bobot 20%)',
                placeholder: 'Nilai 0 - 100',
              },
              {
                key: 'seluruhTujuan' as const,
                label: '3. Seluruh Tujuan Tercapai (Bobot 20%)',
                placeholder: 'Nilai 0 - 100',
              },
              {
                key: 'manfaat' as const,
                label: '4. Manfaat Aksi Perubahan (Bobot 30%)',
                placeholder: 'Nilai 0 - 100',
              },
              {
                key: 'komunikasi' as const,
                label: '5. Teknik Komunikasi (Bobot 10%)',
                placeholder: 'Nilai 0 - 100 (dari Form Penilaian)',
              },
            ].map((item) => {
              const scoreId = `wawancara-score-${item.key}`;
              const noteId = `wawancara-note-${item.key}`;
              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={scoreId} className="text-xs font-medium text-zinc-900">
                      {item.label}
                    </label>
                    <span className="rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[11px] font-normal text-zinc-700">
                      Sumber: {wawancaraSumber[item.key]}
                    </span>
                  </div>
                  <input
                    id={scoreId}
                    type="number"
                    min="0"
                    max="100"
                    value={wawancara[item.key]}
                    onChange={(e) =>
                      setWawancara({
                        ...wawancara,
                        [item.key]: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    placeholder={item.placeholder}
                    className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus:outline-none"
                  />
                  <label htmlFor={noteId} className="sr-only">
                    Catatan evaluator untuk {item.label}
                  </label>
                  <textarea
                    id={noteId}
                    rows={2}
                    value={deskripsi[item.key]}
                    onChange={(e) => setDeskripsi({ ...deskripsi, [item.key]: e.target.value })}
                    placeholder="Catatan evaluator (boleh dikosongkan)"
                    className="w-full rounded-lg border border-zinc-400 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-950 focus:bg-white focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2 lg:col-span-2">
          <Link
            href="/peserta"
            className="rounded-lg border border-zinc-500 bg-white px-5 py-2.5 text-xs font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-zinc-950 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? (
              <>
                <ReloadIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmMode !== null}
        onOpenChange={(open) => {
          if (!open && !deletingPeserta) setConfirmMode(null);
        }}
        title={
          confirmMode === 'delete'
            ? 'Hapus peserta ini secara permanen?'
            : 'Kosongkan semua nilai wawancara?'
        }
        description={
          confirmMode === 'delete'
            ? `Peserta "${peserta.nama}" beserta seluruh nilai survei dan wawancaranya akan dihapus dari database.`
            : 'Semua kolom nilai dan catatan wawancara pada formulir ini akan dikosongkan dan statusnya menjadi KOSONG saat disimpan.'
        }
        confirmLabel={confirmMode === 'delete' ? 'Ya, Hapus Peserta' : 'Ya, Kosongkan'}
        tone={confirmMode === 'delete' ? 'danger' : 'warning'}
        loading={deletingPeserta}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
