'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLinkIcon, ReloadIcon } from '@radix-ui/react-icons';
import { StatusBanner } from '@/components/ui/status-banner';
import PesertaWawancaraTable from '@/components/kegiatan/PesertaWawancaraTable';

export default function DaftarWawancaraTimPage({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/kegiatan/${params.id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!active) return;
        if (!res.ok || !json.success) {
          setError(json.error || 'Gagal memuat daftar peserta wawancara.');
          return;
        }
        setData(json.data);
      } catch {
        if (active) setError('Terjadi gangguan koneksi saat memuat peserta wawancara.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8">
        <ReloadIcon className="h-5 w-5 animate-spin text-zinc-700" aria-hidden="true" />
        <p className="mt-2.5 text-sm font-medium text-zinc-700">
          Memuat daftar peserta wawancara...
        </p>
      </div>
    );
  }

  if (error) {
    return <StatusBanner tone="error" title="Gagal memuat peserta" message={error} />;
  }

  const viewerRole: 'SUPER_ADMIN' | 'EVALUATOR' =
    data?.viewerRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'EVALUATOR';
  const isAdmin = viewerRole === 'SUPER_ADMIN';
  const peserta: any[] = data?.peserta || [];
  const teams: any[] = data?.tim || [];
  const meetingTeams = teams.filter((t) => Boolean(t.linkMeeting));

  const selesaiCount = peserta.filter((p) =>
    Boolean(p.inovasiProper && p.wawancaraSelesaiAt)
  ).length;
  const properCount = peserta.filter((p) => Boolean(p.inovasiProper)).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">
            {isAdmin ? 'Total Peserta Kegiatan' : 'Peserta Tim Anda'}
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">{peserta.length}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {teams.map((t) => t.namaTim).join(', ') || 'Belum tergabung tim'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Status Selesai</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">
            {selesaiCount} / {peserta.length} Selesai
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Selesai bila Proper telah diunggah dan wawancara dikonfirmasi
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Unggahan Dokumen Proper</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">
            {properCount} / {peserta.length} Unggah
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Laporan dan evidence diunggah peserta melalui Link Public
          </p>
        </div>
      </div>

      {meetingTeams.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-300 bg-zinc-50 px-5 py-3.5">
          <div>
            <p className="text-xs font-semibold text-zinc-950">Tautan Meeting Daring Tim</p>
            <p className="text-xs text-zinc-600">
              Gunakan ruang meeting berikut apabila wawancara berlangsung secara daring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {meetingTeams.map((t) => (
              <a
                key={t.id}
                href={t.linkMeeting}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Meeting {t.namaTim}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <PesertaWawancaraTable
        kegiatanId={params.id}
        peserta={peserta}
        teams={teams}
        viewerRole={viewerRole}
      />
    </div>
  );
}
