'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLinkIcon, ReloadIcon } from '@radix-ui/react-icons';
import { StatusBanner } from '@/components/ui/status-banner';
import PesertaWawancaraTable, {
  type PesertaCounts,
  type PesertaPagination,
} from '@/components/kegiatan/PesertaWawancaraTable';

export default function DaftarWawancaraTimPage({
  params,
}: {
  params: { id: string };
}) {
  const [metaData, setMetaData] = useState<any>(null);
  const [initialPeserta, setInitialPeserta] = useState<any[]>([]);
  const [initialPagination, setInitialPagination] = useState<PesertaPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [initialCounts, setInitialCounts] = useState<PesertaCounts>({
    total: 0,
    selesai: 0,
    belumSelesai: 0,
    belumProper: 0,
    adaKosong: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [kegRes, pesRes] = await Promise.all([
          fetch(`/api/kegiatan/${params.id}?includePeserta=0`, { cache: 'no-store' }),
          fetch(`/api/peserta?kegiatanId=${encodeURIComponent(params.id)}&page=1&limit=10`, {
            cache: 'no-store',
          }),
        ]);
        const [kegJson, pesJson] = await Promise.all([kegRes.json(), pesRes.json()]);
        if (!active) return;

        if (!kegRes.ok || !kegJson.success) {
          setError(
            kegJson.error || 'Gagal memuat daftar peserta wawancara. Coba muat ulang halaman.'
          );
          return;
        }
        if (!pesRes.ok || !pesJson.success) {
          setError(
            pesJson.error || 'Gagal memuat daftar peserta wawancara. Coba muat ulang halaman.'
          );
          return;
        }

        setMetaData(kegJson.data);
        setInitialPeserta(pesJson.data || []);
        if (pesJson.pagination) setInitialPagination(pesJson.pagination);
        if (pesJson.counts) setInitialCounts(pesJson.counts);
      } catch {
        if (active) {
          setError('Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.');
        }
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
    metaData?.viewerRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'EVALUATOR';
  const isAdmin = viewerRole === 'SUPER_ADMIN';
  const teams: any[] = metaData?.tim || [];
  const meetingTeams = teams.filter((t) => Boolean(t.linkMeeting));

  const totalPeserta = initialCounts.total;
  const selesaiCount = initialCounts.selesai;
  const properCount = Math.max(0, totalPeserta - initialCounts.belumProper);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">
            {isAdmin ? 'Total peserta kegiatan' : 'Peserta tim Anda'}
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">{totalPeserta} peserta</p>
          <p className="mt-1 text-xs text-zinc-500">
            Tim: {teams.map((t) => t.namaTim).join(', ') || 'Belum tergabung ke tim'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Status wawancara selesai</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">
            {selesaiCount} dari {totalPeserta} selesai
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Selesai bila dokumen Proper (laporan Proyek Perubahan peserta) sudah diunggah dan
            wawancara sudah ditandai selesai
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium text-zinc-600">Unggahan dokumen Proper</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-950">
            {properCount} dari {totalPeserta} peserta sudah mengunggah
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Laporan dan bukti diunggah peserta melalui tautan publik.
          </p>
        </div>
      </div>

      {meetingTeams.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-300 bg-zinc-50 px-5 py-3.5">
          <div>
            <p className="text-xs font-semibold text-zinc-950">Tautan Meeting Daring</p>
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
        initialPeserta={initialPeserta}
        initialPagination={initialPagination}
        initialCounts={initialCounts}
        teams={teams}
        viewerRole={viewerRole}
      />
    </div>
  );
}
