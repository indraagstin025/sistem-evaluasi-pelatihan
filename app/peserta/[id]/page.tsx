'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart2,
  RefreshCw,
  Trash2,
  Calculator,
} from 'lucide-react';
import {
  hitungRataSurveiL,
  hitungRataWawancaraM,
  hitungTotalForm,
  tentukanRentang,
  formatAngka,
  isValidNumber,
} from '@/lib/hitung';

export default function InputNilaiDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [peserta, setPeserta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // State Survei (Skala 1-4)
  const [survey, setSurvey] = useState<{
    L4_01: number | '';
    L4_02: number | '';
    L4_03: number | '';
  }>({
    L4_01: '',
    L4_02: '',
    L4_03: '',
  });

  // State Wawancara (Skala 0-100) & Deskripsi
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
      const res = await fetch(`/api/peserta/${params.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        const p = json.data;
        setPeserta(p);

        // Load Survey
        const s1 = p.survey?.find((s: any) => s.kode === 'L4_01')?.skor;
        const s2 = p.survey?.find((s: any) => s.kode === 'L4_02')?.skor;
        const s3 = p.survey?.find((s: any) => s.kode === 'L4_03')?.skor;
        setSurvey({
          L4_01: s1 ?? '',
          L4_02: s2 ?? '',
          L4_03: s3 ?? '',
        });

        // Load Wawancara
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

        setDeskripsi({
          menengah: wMen?.deskripsi || '',
          jangkaPanjang: wPan?.deskripsi || '',
          seluruhTujuan: wTuj?.deskripsi || '',
          manfaat: wMan?.deskripsi || '',
          komunikasi: wKom?.deskripsi || '',
        });
      }
    } catch (err) {
      console.error('Error fetching detail peserta:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [params.id]);

  // Kalkulasi live preview
  const liveL = hitungRataSurveiL(survey.L4_01, survey.L4_02, survey.L4_03);
  const liveM = hitungRataWawancaraM(wawancara.jangkaPanjang, wawancara.seluruhTujuan, wawancara.manfaat);
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
      // 1. Simpan Survey
      const surveyPayload = [
        { kode: 'L4_01', skor: survey.L4_01 === '' ? null : Number(survey.L4_01) },
        { kode: 'L4_02', skor: survey.L4_02 === '' ? null : Number(survey.L4_02) },
        { kode: 'L4_03', skor: survey.L4_03 === '' ? null : Number(survey.L4_03) },
      ];

      await fetch(`/api/peserta/${params.id}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyPayload),
      });

      // 2. Simpan Wawancara
      const wawancaraPayload = [
        { kriteria: 'menengah', bobot: 20, nilai: wawancara.menengah === '' ? null : Number(wawancara.menengah), deskripsi: deskripsi.menengah },
        { kriteria: 'jangkaPanjang', bobot: 20, nilai: wawancara.jangkaPanjang === '' ? null : Number(wawancara.jangkaPanjang), deskripsi: deskripsi.jangkaPanjang },
        { kriteria: 'seluruhTujuan', bobot: 20, nilai: wawancara.seluruhTujuan === '' ? null : Number(wawancara.seluruhTujuan), deskripsi: deskripsi.seluruhTujuan },
        { kriteria: 'manfaat', bobot: 30, nilai: wawancara.manfaat === '' ? null : Number(wawancara.manfaat), deskripsi: deskripsi.manfaat },
        { kriteria: 'komunikasi', bobot: 10, nilai: wawancara.komunikasi === '' ? null : Number(wawancara.komunikasi), deskripsi: deskripsi.komunikasi },
      ];

      await fetch(`/api/peserta/${params.id}/wawancara`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wawancaraPayload),
      });

      setMessage({ text: 'Nilai dan evaluasi peserta berhasil disimpan ke database.', type: 'success' });
      fetchDetail();
    } catch (err: any) {
      console.error(err);
      setMessage({ text: 'Terjadi kesalahan saat menyimpan data.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleClearWawancara = () => {
    if (confirm('Kosongkan seluruh nilai wawancara untuk peserta ini? Statusnya akan menjadi KOSONG sesuai aturan URD.')) {
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
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Memuat profil dan data nilai peserta...</p>
      </div>
    );
  }

  if (!peserta) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-bold text-slate-700">Peserta tidak ditemukan.</p>
        <Link href="/peserta" className="text-xs text-emerald-600 font-bold underline mt-2 inline-block">
          Kembali ke Data Peserta
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/peserta"
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{peserta.nama}</h1>
            <p className="text-xs text-slate-500">
              {peserta.nip ? `NIP. ${peserta.nip}` : 'NIP Tidak Tercatat'} • {peserta.instansi || '-'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearWawancara}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 transition self-start sm:self-auto flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Kosongkan Wawancara (KOSONG)
        </button>
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

      {/* Live Calculation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nilai L (Survei)</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {liveL !== null ? liveL.toFixed(2) : <span className="text-amber-600 text-base">KOSONG</span>}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Rentang: {tentukanRentang(liveL)}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nilai M (Wawancara)</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {liveM !== null ? liveM.toFixed(2) : <span className="text-amber-600 text-base">KOSONG</span>}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Rentang: {tentukanRentang(liveM)}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Form</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {liveTotalForm !== null ? liveTotalForm.toFixed(2) : <span className="text-amber-600 text-base">KOSONG</span>}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">5 Kriteria Berbobot</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Selisih (M - L)</span>
          <div className="text-2xl font-black mt-1">
            {liveSelisih !== null ? (
              <span className={liveSelisih > 0 ? 'text-emerald-600' : liveSelisih < 0 ? 'text-rose-600' : 'text-slate-800'}>
                {liveSelisih > 0 ? `+${liveSelisih.toFixed(2)}` : liveSelisih.toFixed(2)}
              </span>
            ) : (
              <span className="text-slate-400 text-base">-</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Deviasi Persepsi</span>
        </div>
      </div>

      {/* Main Two-Column Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Survei Alumni (Skala 1-4) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                1
              </span>
              Survei Alumni (Skala 1–4)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Nilai survei mandiri alumni: 4 (Sangat Sesuai), 3 (Sesuai), 2 (Kurang Sesuai), 1 (Tidak Sesuai)
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                L4_01: Target Jangka Panjang
              </label>
              <input
                type="number"
                min="1"
                max="4"
                step="1"
                value={survey.L4_01}
                onChange={(e) => setSurvey({ ...survey, L4_01: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Skor 1 - 4"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                L4_02: Seluruh Tujuan Tercapai
              </label>
              <input
                type="number"
                min="1"
                max="4"
                step="1"
                value={survey.L4_02}
                onChange={(e) => setSurvey({ ...survey, L4_02: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Skor 1 - 4"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                L4_03: Manfaat Aksi Perubahan
              </label>
              <input
                type="number"
                min="1"
                max="4"
                step="1"
                value={survey.L4_03}
                onChange={(e) => setSurvey({ ...survey, L4_03: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Skor 1 - 4"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Wawancara Evaluator (Skala 0-100) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                2
              </span>
              Wawancara Evaluator (Skala 0–100)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Penilaian lapangan assessor terhadap 5 kriteria Aksi Perubahan
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">1. Target Jangka Menengah (Bobot 20%)</label>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={wawancara.menengah}
                onChange={(e) => setWawancara({ ...wawancara, menengah: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Nilai 0 - 100"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">2. Target Jangka Panjang (Bobot 20%)</label>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={wawancara.jangkaPanjang}
                onChange={(e) => setWawancara({ ...wawancara, jangkaPanjang: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Nilai 0 - 100"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">3. Seluruh Tujuan Tercapai (Bobot 20%)</label>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={wawancara.seluruhTujuan}
                onChange={(e) => setWawancara({ ...wawancara, seluruhTujuan: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Nilai 0 - 100"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">4. Manfaat Aksi Perubahan (Bobot 30%)</label>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={wawancara.manfaat}
                onChange={(e) => setWawancara({ ...wawancara, manfaat: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Nilai 0 - 100"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">5. Teknik Komunikasi (Bobot 10%)</label>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={wawancara.komunikasi}
                onChange={(e) => setWawancara({ ...wawancara, komunikasi: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Nilai 0 - 100 (dari sel H33 Form Penilaian)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="lg:col-span-2 flex items-center justify-end gap-3 pt-4">
          <Link
            href="/peserta"
            className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={saving}
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
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
