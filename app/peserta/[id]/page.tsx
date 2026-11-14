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
  UserCog,
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
  const [savingProfil, setSavingProfil] = useState(false);
  const [deletingPeserta, setDeletingPeserta] = useState(false);
  const [isEditingProfil, setIsEditingProfil] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
        setProfilForm({
          nama: p.nama || '',
          nip: p.nip || '',
          jabatanPelatihan: p.jabatanPelatihan || '',
          jabatanSaatIni: p.jabatanSaatIni || '',
          instansi: p.instansi || '',
        });

        // Load Survey L4 + Sumber + Ringkasan L3
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

        const l3List = (p.survey || []).filter((s: any) => typeof s.kode === 'string' && s.kode.startsWith('L3_'));
        setL3Summary({
          count: l3List.length,
          sumber: l3List[0]?.sumber || 'Jawaban',
        });

        // Load Wawancara + Sumber
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
      if (json.success) {
        setIsEditingProfil(false);
        setMessage({ text: 'Profil peserta berhasil diperbarui.', type: 'success' });
        fetchDetail();
      } else {
        setMessage({ text: json.error || 'Gagal memperbarui profil peserta.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Terjadi kesalahan saat menyimpan profil.', type: 'error' });
    } finally {
      setSavingProfil(false);
    }
  };

  const handleDeletePeserta = async () => {
    if (!confirm(`Hapus permanen peserta "${peserta?.nama}" beserta seluruh data nilainya?`)) {
      return;
    }
    try {
      setDeletingPeserta(true);
      const res = await fetch(`/api/peserta/${params.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        router.push('/peserta');
      } else {
        setMessage({ text: json.error || 'Gagal menghapus peserta.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Terjadi kesalahan saat menghapus peserta.', type: 'error' });
    } finally {
      setDeletingPeserta(false);
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/peserta"
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{peserta.nama}</h1>
            <p className="text-xs text-slate-500">
              {peserta.nip ? `NIP. ${peserta.nip}` : 'NIP Tidak Tercatat'} • {peserta.instansi || '-'}
            </p>
            {(peserta.jabatanSaatIni || peserta.jabatanPelatihan || l3Summary.count > 0) && (
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                {peserta.jabatanSaatIni && <span>Jabatan: {peserta.jabatanSaatIni}</span>}
                {l3Summary.count > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                    {l3Summary.count} butir Perubahan Perilaku (L3) tersimpan • Sumber: {l3Summary.sumber}
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
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserCog className="w-3.5 h-3.5" />
            {isEditingProfil ? 'Tutup Profil' : 'Edit Profil'}
          </button>

          <button
            type="button"
            onClick={handleClearWawancara}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-200 text-amber-800 hover:bg-amber-50 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Kosongkan Wawancara
          </button>

          <button
            type="button"
            onClick={handleDeletePeserta}
            disabled={deletingPeserta}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deletingPeserta ? 'Menghapus...' : 'Hapus Peserta'}
          </button>
        </div>
      </div>

      {/* Form Edit Profil Peserta (CRUD Manual Bab 4.2) */}
      {isEditingProfil && (
        <form
          onSubmit={handleSaveProfil}
          className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-5 space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCog className="w-4 h-4 text-emerald-600" />
              Ubah Profil Peserta
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Peserta *</label>
              <input
                type="text"
                required
                value={profilForm.nama}
                onChange={(e) => setProfilForm({ ...profilForm, nama: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">NIP</label>
              <input
                type="text"
                value={profilForm.nip}
                onChange={(e) => setProfilForm({ ...profilForm, nip: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Instansi</label>
              <input
                type="text"
                value={profilForm.instansi}
                onChange={(e) => setProfilForm({ ...profilForm, instansi: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Jabatan Saat Ini</label>
              <input
                type="text"
                value={profilForm.jabatanSaatIni}
                onChange={(e) => setProfilForm({ ...profilForm, jabatanSaatIni: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Jabatan Saat Pelatihan</label>
              <input
                type="text"
                value={profilForm.jabatanPelatihan}
                onChange={(e) => setProfilForm({ ...profilForm, jabatanPelatihan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingProfil(false)}
              className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingProfil}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {savingProfil ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      )}

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
            {[
              { key: 'L4_01' as const, label: 'L4_01: Target Jangka Panjang' },
              { key: 'L4_02' as const, label: 'L4_02: Seluruh Tujuan Tercapai' },
              { key: 'L4_03' as const, label: 'L4_03: Manfaat Aksi Perubahan' },
            ].map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-xs font-bold text-slate-700">{item.label}</label>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                    Sumber: {surveySumber[item.key]}
                  </span>
                </div>
                <input
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            ))}
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
                placeholder: 'Nilai 0 - 100 (dari sel H33 Form Penilaian)',
              },
            ].map((item) => (
              <div key={item.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700">{item.label}</label>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/70">
                    Sumber: {wawancaraSumber[item.key]}
                  </span>
                </div>
                <input
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <textarea
                  rows={2}
                  value={deskripsi[item.key]}
                  onChange={(e) => setDeskripsi({ ...deskripsi, [item.key]: e.target.value })}
                  placeholder="Catatan / deskripsi evaluator (opsional)"
                  className="w-full px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            ))}
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
