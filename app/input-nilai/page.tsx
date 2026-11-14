'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calculator,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import {
  hitungRataSurveiL,
  hitungRataWawancaraM,
  hitungTotalForm,
  tentukanRentang,
  formatAngka,
} from '@/lib/hitung';

export default function InputNilaiPage() {
  const [pesertaList, setPesertaList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [b1, setB1] = useState<number | ''>('');
  const [b2, setB2] = useState<number | ''>('');
  const [b3, setB3] = useState<number | ''>('');

  const [k1, setK1] = useState<number | ''>('');
  const [k2, setK2] = useState<number | ''>('');
  const [k3, setK3] = useState<number | ''>('');
  const [k4, setK4] = useState<number | ''>('');
  const [k5, setK5] = useState<number | ''>('');

  // Fetch all participants
  const fetchPesertaList = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/peserta', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setPesertaList(json.data);
        if (json.data.length > 0) {
          // Cari peserta yang wawancaranya kosong terlebih dahulu (misal Timbul)
          const kosongP = json.data.find(
            (p: any) => !p.wawancara || p.wawancara.length === 0 || p.wawancara.every((w: any) => w.nilai === null)
          );
          const defaultP = kosongP || json.data[0];
          setSelectedId(defaultP.id);
          loadPesertaData(defaultP);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  // Live Calculations
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
      // 1. Simpan Survey
      const surveyPayload = [
        { kode: 'L4_01', skor: b1 === '' ? null : Number(b1) },
        { kode: 'L4_02', skor: b2 === '' ? null : Number(b2) },
        { kode: 'L4_03', skor: b3 === '' ? null : Number(b3) },
      ];
      await fetch(`/api/peserta/${selectedId}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyPayload),
      });

      // 2. Simpan Wawancara
      const wawancaraPayload = [
        { kriteria: 'menengah', bobot: 20, nilai: k1 === '' ? null : Number(k1) },
        { kriteria: 'jangkaPanjang', bobot: 20, nilai: k2 === '' ? null : Number(k2) },
        { kriteria: 'seluruhTujuan', bobot: 20, nilai: k3 === '' ? null : Number(k3) },
        { kriteria: 'manfaat', bobot: 30, nilai: k4 === '' ? null : Number(k4) },
        { kriteria: 'komunikasi', bobot: 10, nilai: k5 === '' ? null : Number(k5) },
      ];
      await fetch(`/api/peserta/${selectedId}/wawancara`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wawancaraPayload),
      });

      setMessage({
        text: `Nilai untuk "${selectedPeserta?.nama}" sudah disimpan dan dihitung ulang.`,
        type: 'success',
      });
      // Refresh list in background
      const res = await fetch('/api/peserta');
      const json = await res.json();
      if (json.success) setPesertaList(json.data);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: 'Koneksi bermasalah saat menyimpan. Coba lagi.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Isi Nilai Evaluasi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Isi nilai survei hasil Aksi Perubahan (L) dan lima kriteria wawancara evaluator (M dan Total Form)
          </p>
        </div>

        <Link
          href="/peserta"
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto"
        >
          Lihat Daftar Peserta <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Banner Aturan Perhitungan Faktual (URD Bab 6) */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-5 py-3 text-xs font-medium text-emerald-900 leading-relaxed flex items-center gap-2">
        <Calculator className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>
          <strong>Cara hitungnya:</strong> Nilai L = rata-rata 3 butir survei × 25 &nbsp;|&nbsp; Nilai M = rata-rata 3 butir wawancara (tanpa bobot) &nbsp;|&nbsp; Total Form = jumlah 5 kriteria berbobot
        </span>
      </div>

      {/* Dropdown Pemilih Peserta */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Pilih peserta:
          </label>
          <select
            value={selectedId}
            onChange={(e) => handleSelectChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
          >
            {pesertaList.map((p, idx) => {
              const isKosong = !p.wawancara || p.wawancara.length === 0 || p.wawancara.every((w: any) => w.nilai === null);
              return (
                <option key={p.id} value={p.id}>
                  {String(idx + 1).padStart(2, '0')}. {p.nama} {p.instansi ? `(${p.instansi})` : ''} {isKosong ? '— [KOSONG]' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {selectedPeserta && (
          <div className="shrink-0 text-right md:border-l md:border-slate-100 md:pl-4">
            <span className="text-[11px] font-bold text-slate-400 block">Status wawancara:</span>
            {liveM === null ? (
              <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                KOSONG
              </span>
            ) : (
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                Sudah Lengkap
              </span>
            )}
          </div>
        )}
      </div>

      {/* Alert message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Dua Kolom Formulir */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Kolom Kiri: Survei Alumni */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                Survei Hasil Aksi Perubahan (Alumni)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Skala 1 sampai 4: Sangat Sesuai = 4, Sesuai = 3, Kurang Sesuai = 2, Tidak Sesuai = 1
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Butir 1: Target Jangka Panjang
                </label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  step="1"
                  value={b1}
                  onChange={(e) => setB1(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Skor 1 - 4"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Butir 2: Seluruh Tujuan Tercapai
                </label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  step="1"
                  value={b2}
                  onChange={(e) => setB2(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Skor 1 - 4"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Butir 3: Manfaat Aksi Perubahan
                </label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  step="1"
                  value={b3}
                  onChange={(e) => setB3(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Skor 1 - 4"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Nilai L Card */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
              <span className="text-xs font-bold text-emerald-900">Nilai L (rata-rata × 25):</span>
              <span className="text-base font-black text-emerald-800 font-mono">
                {liveL !== null ? liveL.toFixed(2) : 'KOSONG'}
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Wawancara Assessor */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                Wawancara Evaluator (Skala 0–100)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Penilaian evaluator terhadap 5 kriteria hasil Aksi Perubahan
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kriteria 1: Target Jangka Menengah (Bobot 20%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={k1}
                  onChange={(e) => setK1(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Nilai 0 - 100"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kriteria 2: Target Jangka Panjang (Bobot 20%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={k2}
                  onChange={(e) => setK2(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Nilai 0 - 100"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kriteria 3: Seluruh Tujuan Tercapai (Bobot 20%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={k3}
                  onChange={(e) => setK3(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Nilai 0 - 100"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kriteria 4: Manfaat Aksi Perubahan (Bobot 30%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={k4}
                  onChange={(e) => setK4(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Nilai 0 - 100"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kriteria 5: Teknik Komunikasi (Bobot 10%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={k5}
                  onChange={(e) => setK5(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Nilai 0 - 100 (dari Form Penilaian)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Nilai M & Total Form */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                <span className="text-[10px] font-bold text-blue-900 block">Nilai M (Wawancara):</span>
                <span className="text-sm font-black text-blue-950 font-mono">
                  {liveM !== null ? liveM.toFixed(2) : 'KOSONG'}
                </span>
              </div>
              <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                <span className="text-[10px] font-bold text-blue-900 block">Total Form (Berbobot):</span>
                <span className="text-sm font-black text-blue-950 font-mono">
                  {liveTotalForm !== null ? liveTotalForm.toFixed(2) : 'KOSONG'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">
            Selisih (M - L):{' '}
            <strong className="text-slate-900 font-mono">
              {liveSelisih !== null ? (liveSelisih > 0 ? `+${liveSelisih.toFixed(2)}` : liveSelisih.toFixed(2)) : '-'}
            </strong>
          </div>

          <button
            type="submit"
            disabled={saving || !selectedId}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 transition flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Nilai
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
