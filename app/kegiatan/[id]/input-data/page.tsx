'use client';

import React, { useEffect, useState } from 'react';
import {
  ExclamationTriangleIcon,
  LockClosedIcon,
  ReloadIcon,
  TableIcon,
  UploadIcon,
} from '@radix-ui/react-icons';
import ImportExcelModal from '@/components/ImportExcelModal';
import { StatusBanner } from '@/components/ui/status-banner';

export default function InputDataKegiatanPage({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/kegiatan/${params.id}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Gagal memuat data impor kegiatan.');
        return;
      }
      setData(json.data);
    } catch {
      setError('Koneksi bermasalah saat memuat data impor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const peserta: any[] = data?.peserta || [];
  const selisihImport: any[] = data?.selisihImport || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <TableIcon className="h-4 w-4 text-zinc-950" aria-hidden="true" />
            <h2 className="text-base font-semibold text-zinc-950">
              Impor Berkas Excel Kegiatan
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            Unggah file <strong>Form Penilaian</strong> dan <strong>Olah Data Survei</strong>{' '}
            sekaligus. Nilai wawancara dari Excel otomatis terkunci sesuai sumber Form Penilaian
            (IT-01 &amp; IT-07).
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
        title="Data Profil & Survei Terkunci (UR-N-07)"
        message="Peserta hanya dapat ditambahkan atau diperbarui melalui impor ulang file Excel. Tidak tersedia tambah manual, ubah profil, ubah skor survei, atau hapus peserta di dalam sistem."
      />

      {error && <StatusBanner tone="error" title="Kesalahan" message={error} />}

      {selisihImport.length > 0 && (
        <section className="rounded-2xl border border-zinc-900 bg-zinc-50 p-5">
          <div className="flex items-start gap-2.5">
            <ExclamationTriangleIcon
              className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950"
              aria-hidden="true"
            />
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">
                Laporan Selisih Antarberkas ({selisihImport.length} temuan)
              </h3>
              <p className="mt-0.5 text-xs text-zinc-700">
                Daftar berikut membandingkan sheet Form Penilaian dengan sheet Ekspose. Seluruh
                perhitungan sistem memakai nilai pada kolom Form Penilaian.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-700">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Peserta</th>
                  <th className="px-3 py-2.5 font-semibold">NIP</th>
                  <th className="px-3 py-2.5 font-semibold">Kriteria</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Form Penilaian</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Sheet Ekspose</th>
                  <th className="px-3 py-2.5 font-semibold">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {selisihImport.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50">
                    <td className="px-3 py-2.5 font-medium text-zinc-950">{s.pesertaNama}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-zinc-600">
                      {s.pesertaNip}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-800">{s.kriteriaLabel}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-zinc-950">
                      {s.nilaiForm === null ? 'KOSONG' : s.nilaiForm}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-zinc-600">
                      {s.nilaiEkspose === null ? 'KOSONG' : s.nilaiEkspose}
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
              Pratinjau Data Terimpor (Baca Saja · {peserta.length} Peserta)
            </h3>
            <p className="mt-0.5 text-xs text-zinc-600">
              Menampilkan identitas resmi peserta, jabatan saat pelatihan vs saat ini, tim Excel,
              dan status penguncian nilai wawancara.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded border border-zinc-400 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-800">
            <LockClosedIcon className="h-3 w-3" aria-hidden="true" />
            Read Only
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-600">
            <ReloadIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Memuat data terimpor...</span>
          </div>
        ) : peserta.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-600">
            Belum ada peserta terimpor. Klik tombol Impor / Perbarui dari Excel di atas untuk
            memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-700">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">No</th>
                  <th className="px-3 py-2.5 font-semibold">Nama &amp; NIP</th>
                  <th className="px-3 py-2.5 font-semibold">Jabatan &amp; Instansi Saat Ini</th>
                  <th className="px-3 py-2.5 font-semibold">Tim Excel</th>
                  <th className="px-3 py-2.5 text-center font-semibold">Kriteria Terkunci</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Survei (L)</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Wawancara (M)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {peserta.map((p, idx) => {
                  const lockedCount = (p.wawancara || []).filter(
                    (w: any) => w.lockedFromImport
                  ).length;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="px-3 py-2.5 font-mono text-zinc-500">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-zinc-950">{p.nama}</div>
                        <div className="font-mono text-[11px] text-zinc-500">{p.nip}</div>
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
                        {lockedCount}/5
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {typeof p.hasil?.rataSurveiL === 'number'
                          ? p.hasil.rataSurveiL.toFixed(2)
                          : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-zinc-950">
                        {typeof p.hasil?.rataWawancaraM === 'number'
                          ? p.hasil.rataWawancaraM.toFixed(2)
                          : 'KOSONG'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ImportExcelModal
        kegiatanId={params.id}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
