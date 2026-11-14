'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckIcon,
  InfoCircledIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import {
  hitungRataSurveiL,
  hitungRataWawancaraM,
  hitungTotalForm,
} from '@/lib/hitung';
import Topbar from '@/components/Topbar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBanner } from '@/components/ui/status-banner';

export default function InputNilaiPage() {
  const [pesertaList, setPesertaList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const [b1, setB1] = useState<number | ''>('');
  const [b2, setB2] = useState<number | ''>('');
  const [b3, setB3] = useState<number | ''>('');

  const [k1, setK1] = useState<number | ''>('');
  const [k2, setK2] = useState<number | ''>('');
  const [k3, setK3] = useState<number | ''>('');
  const [k4, setK4] = useState<number | ''>('');
  const [k5, setK5] = useState<number | ''>('');

  const loadPesertaData = (p: any) => {
    const s1 = p.survey?.find((s: any) => s.kode === 'L4_01')?.skor;
    const s2 = p.survey?.find((s: any) => s.kode === 'L4_02')?.skor;
    const s3 = p.survey?.find((s: any) => s.kode === 'L4_03')?.skor;
    setB1(s1 ?? '');
    setB2(s2 ?? '');
    setB3(s3 ?? '');

    const wMen = p.wawancara?.find((w: any) => w.kriteria === 'menengah')?.nilai;
    const wPan = p.wawancara?.find((w: any) => w.kriteria === 'jangkaPanjang')?.nilai;
    const wTuj = p.wawancara?.find((w: any) => w.kriteria === 'seluruhTujuan')?.nilai;
    const wMan = p.wawancara?.find((w: any) => w.kriteria === 'manfaat')?.nilai;
    const wKom = p.wawancara?.find((w: any) => w.kriteria === 'komunikasi')?.nilai;

    setK1(wMen ?? '');
    setK2(wPan ?? '');
    setK3(wTuj ?? '');
    setK4(wMan ?? '');
    setK5(wKom ?? '');
  };

  const fetchPesertaList = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch('/api/peserta', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        setFetchError(json.error || 'Gagal memuat daftar peserta untuk input nilai.');
        return;
      }

      setPesertaList(json.data);
      if (json.data.length > 0) {
        const kosongP = json.data.find(
          (p: any) =>
            !p.wawancara ||
            p.wawancara.length === 0 ||
            p.wawancara.every((w: any) => w.nilai === null)
        );
        const defaultP = kosongP || json.data[0];
        setSelectedId(defaultP.id);
        loadPesertaData(defaultP);
      }
    } catch (err) {
      console.error(err);
      setFetchError('Koneksi bermasalah saat memuat daftar peserta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPesertaList();
  }, []);

  const handleSelectChange = (id: string) => {
    setSelectedId(id);
    const p = pesertaList.find((item) => item.id === id);
    if (p) {
      loadPesertaData(p);
      setMessage(null);
    }
  };

  const selectedPeserta = pesertaList.find((p) => p.id === selectedId);

  const liveL = hitungRataSurveiL(b1, b2, b3);
  const liveM = hitungRataWawancaraM(k2, k3, k4);
  const liveTotalForm = hitungTotalForm(k1, k2, k3, k4, k5);
  const liveSelisih = liveL !== null && liveM !== null ? liveM - liveL : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    setSaving(true);
    setMessage(null);

    try {
      const surveyPayload = [
        { kode: 'L4_01', skor: b1 === '' ? null : Number(b1) },
        { kode: 'L4_02', skor: b2 === '' ? null : Number(b2) },
        { kode: 'L4_03', skor: b3 === '' ? null : Number(b3) },
      ];
      const resSurvey = await fetch(`/api/peserta/${selectedId}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyPayload),
      });

      const wawancaraPayload = [
        { kriteria: 'menengah', bobot: 20, nilai: k1 === '' ? null : Number(k1) },
        { kriteria: 'jangkaPanjang', bobot: 20, nilai: k2 === '' ? null : Number(k2) },
        { kriteria: 'seluruhTujuan', bobot: 20, nilai: k3 === '' ? null : Number(k3) },
        { kriteria: 'manfaat', bobot: 30, nilai: k4 === '' ? null : Number(k4) },
        { kriteria: 'komunikasi', bobot: 10, nilai: k5 === '' ? null : Number(k5) },
      ];
      const resWawancara = await fetch(`/api/peserta/${selectedId}/wawancara`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wawancaraPayload),
      });

      if (!resSurvey.ok || !resWawancara.ok) {
        setMessage({
          text: 'Gagal menyimpan nilai peserta. Periksa rentang angka lalu coba lagi.',
          tone: 'error',
        });
        return;
      }

      setMessage({
        text: `Nilai untuk "${selectedPeserta?.nama}" sudah disimpan dan dihitung ulang.`,
        tone: 'success',
      });

      const res = await fetch('/api/peserta', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) setPesertaList(json.data);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Koneksi bermasalah saat menyimpan. Coba lagi.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <Topbar
        title="Isi Nilai Evaluasi"
        subtitle="Input nilai survei hasil Aksi Perubahan (L) dan lima kriteria wawancara evaluator (M & Total Form)"
      >
        <Link
          href="/peserta"
          className="text-xs font-medium text-zinc-950 underline underline-offset-4 hover:text-zinc-600"
        >
          Buka Daftar Peserta
        </Link>
      </Topbar>

      {/* Banner Rumus Perhitungan Faktual (URD Bab 6) */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-xs leading-relaxed text-zinc-800 sm:items-center">
        <InfoCircledIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950 sm:mt-0" aria-hidden="true" />
        <p className="font-normal">
          <span className="font-semibold text-zinc-950">Cara perhitungan:</span> Nilai L = rata-rata 3 butir survei x 25 · Nilai M = rata-rata 3 butir wawancara (tanpa bobot) · Total Form = jumlah 5 kriteria berbobot.
        </p>
      </div>

      {fetchError && (
        <StatusBanner
          tone="error"
          title="Gagal memuat daftar peserta"
          message={fetchError}
          onRetry={fetchPesertaList}
        />
      )}

      {/* Radix Select Pemilih Peserta */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:flex-row md:items-center">
        <div className="flex-1">
          <label
            id="peserta-select-label"
            className="mb-1.5 block text-xs font-medium text-zinc-700"
          >
            Pilih peserta
          </label>
          <Select
            value={selectedId}
            onValueChange={handleSelectChange}
            disabled={loading || pesertaList.length === 0}
          >
            <SelectTrigger aria-labelledby="peserta-select-label">
              <SelectValue
                placeholder={
                  loading
                    ? 'Memuat daftar peserta...'
                    : pesertaList.length === 0
                    ? 'Belum ada data peserta'
                    : 'Pilih peserta...'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {pesertaList.map((p, idx) => {
                const isKosong =
                  !p.wawancara ||
                  p.wawancara.length === 0 ||
                  p.wawancara.every((w: any) => w.nilai === null);
                return (
                  <SelectItem key={p.id} value={p.id}>
                    {String(idx + 1).padStart(2, '0')}. {p.nama}{' '}
                    {p.instansi ? `(${p.instansi})` : ''}{' '}
                    {isKosong ? '- KOSONG' : ''}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedPeserta && (
          <div className="shrink-0 md:border-l md:border-zinc-200 md:pl-5">
            <span className="block text-xs font-normal text-zinc-600">Status wawancara:</span>
            {liveM === null ? (
              <span className="mt-1 inline-block rounded-md bg-zinc-950 px-2.5 py-0.5 text-xs font-medium text-white">
                KOSONG
              </span>
            ) : (
              <span className="mt-1 inline-block rounded-md border border-zinc-300 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-900">
                Sudah Lengkap
              </span>
            )}
          </div>
        )}
      </div>

      {message && (
        <StatusBanner
          tone={message.tone}
          message={message.text}
          onDismiss={() => setMessage(null)}
        />
      )}

      {/* Dua Kolom Formulir */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          {/* Kolom Kiri: Survei Alumni */}
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="border-b border-zinc-100 pb-3">
              <h2 className="flex items-baseline gap-2 text-sm font-semibold text-zinc-950">
                <span className="font-mono text-xs font-medium text-zinc-600">01</span>
                <span>Survei Hasil Aksi Perubahan (Alumni)</span>
              </h2>
              <p className="mt-1 text-xs font-normal text-zinc-600">
                Skala 1 sampai 4: Sangat Sesuai = 4, Sesuai = 3, Kurang Sesuai = 2, Tidak Sesuai = 1
              </p>
            </div>

            <div className="space-y-3.5">
              {[
                {
                  id: 'input-b1',
                  label: 'Butir 1: Target Jangka Panjang',
                  val: b1,
                  setVal: setB1,
                },
                {
                  id: 'input-b2',
                  label: 'Butir 2: Seluruh Tujuan Tercapai',
                  val: b2,
                  setVal: setB2,
                },
                {
                  id: 'input-b3',
                  label: 'Butir 3: Manfaat Aksi Perubahan',
                  val: b3,
                  setVal: setB3,
                },
              ].map((item) => (
                <div key={item.id}>
                  <label htmlFor={item.id} className="mb-1 block text-xs font-medium text-zinc-900">
                    {item.label}
                  </label>
                  <input
                    id={item.id}
                    type="number"
                    min="1"
                    max="4"
                    step="1"
                    value={item.val}
                    onChange={(e) =>
                      item.setVal(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Skor 1 - 4"
                    className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-950 bg-zinc-50 p-3">
              <span className="text-xs font-medium text-zinc-950">
                Nilai L (rata-rata x 25):
              </span>
              <span className="font-mono text-base font-semibold text-zinc-950 tabular-nums">
                {liveL !== null ? liveL.toFixed(2) : 'KOSONG'}
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Wawancara Evaluator */}
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="border-b border-zinc-100 pb-3">
              <h2 className="flex items-baseline gap-2 text-sm font-semibold text-zinc-950">
                <span className="font-mono text-xs font-medium text-zinc-600">02</span>
                <span>Wawancara Evaluator (Skala 0-100)</span>
              </h2>
              <p className="mt-1 text-xs font-normal text-zinc-600">
                Penilaian evaluator terhadap 5 kriteria hasil Aksi Perubahan
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'input-k1',
                  label: 'Kriteria 1: Target Jangka Menengah (Bobot 20%)',
                  val: k1,
                  setVal: setK1,
                  placeholder: 'Nilai 0 - 100',
                },
                {
                  id: 'input-k2',
                  label: 'Kriteria 2: Target Jangka Panjang (Bobot 20%)',
                  val: k2,
                  setVal: setK2,
                  placeholder: 'Nilai 0 - 100',
                },
                {
                  id: 'input-k3',
                  label: 'Kriteria 3: Seluruh Tujuan Tercapai (Bobot 20%)',
                  val: k3,
                  setVal: setK3,
                  placeholder: 'Nilai 0 - 100',
                },
                {
                  id: 'input-k4',
                  label: 'Kriteria 4: Manfaat Aksi Perubahan (Bobot 30%)',
                  val: k4,
                  setVal: setK4,
                  placeholder: 'Nilai 0 - 100',
                },
                {
                  id: 'input-k5',
                  label: 'Kriteria 5: Teknik Komunikasi (Bobot 10%)',
                  val: k5,
                  setVal: setK5,
                  placeholder: 'Nilai 0 - 100 (dari Form Penilaian)',
                },
              ].map((item) => (
                <div key={item.id}>
                  <label htmlFor={item.id} className="mb-1 block text-xs font-medium text-zinc-900">
                    {item.label}
                  </label>
                  <input
                    id={item.id}
                    type="number"
                    min="0"
                    max="100"
                    value={item.val}
                    onChange={(e) =>
                      item.setVal(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder={item.placeholder}
                    className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5 border-t border-zinc-100 pt-3 text-xs">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <span className="block text-[11px] font-medium text-zinc-700">
                  Nilai M (Wawancara):
                </span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                  {liveM !== null ? liveM.toFixed(2) : 'KOSONG'}
                </span>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <span className="block text-[11px] font-medium text-zinc-700">
                  Total Form (Berbobot):
                </span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                  {liveTotalForm !== null ? liveTotalForm.toFixed(2) : 'KOSONG'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
          <div className="text-xs font-normal text-zinc-700">
            Selisih (M - L):{' '}
            <span className="font-mono font-semibold text-zinc-950 tabular-nums">
              {liveSelisih !== null
                ? liveSelisih > 0
                  ? `+${liveSelisih.toFixed(2)}`
                  : liveSelisih.toFixed(2)
                : '-'}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving || !selectedId}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-zinc-950 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <ReloadIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                Simpan Nilai
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
