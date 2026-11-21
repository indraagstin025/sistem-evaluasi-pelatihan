'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  CheckCircledIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  CheckIcon,
} from '@radix-ui/react-icons';

interface KegiatanWorkflowChecklistProps {
  kegiatanId: string;
  totalPeserta: number;
  teams: Array<{ id: string; evaluatorId?: string | null }>;
  totalWawancaraSelesai: number;
  totalProper: number;
}

export default function KegiatanWorkflowChecklist({
  kegiatanId,
  totalPeserta,
  teams,
  totalWawancaraSelesai,
  totalProper,
}: KegiatanWorkflowChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);

  const step1Done = totalPeserta > 0;
  const step2Done =
    teams.length > 0 && teams.every((t) => Boolean(t.evaluatorId));
  const step3Done =
    totalPeserta > 0 && totalWawancaraSelesai >= totalPeserta;
  const step4Ready = step1Done;

  const completedCount = [step1Done, step2Done, step3Done, false].filter(Boolean).length;

  const handleCopyPublicLink = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      await navigator.clipboard.writeText(`${origin}/unggah-inovasi`);
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 1800);
    } catch {
      // Abaikan jika browser membatasi clipboard
    }
  };

  const stages = [
    {
      num: 1,
      title: 'Impor Data Excel',
      done: step1Done,
      statusText: step1Done
        ? `${totalPeserta} peserta telah dimuat`
        : 'Belum ada data peserta',
      href: `/kegiatan/${kegiatanId}/input-data`,
      cta: step1Done ? 'Kelola Data' : 'Mulai Impor Excel',
    },
    {
      num: 2,
      title: 'Pembagian Tim & Evaluator',
      done: step2Done,
      statusText:
        teams.length === 0
          ? 'Belum ada tim terbentuk'
          : step2Done
          ? `${teams.length} tim siap (semua ada evaluator)`
          : `${teams.filter((t) => Boolean(t.evaluatorId)).length} dari ${teams.length} tim punya evaluator`,
      href: `/kegiatan/${kegiatanId}/pembagian-tim`,
      cta: step2Done ? 'Atur Tim' : 'Bagi Tim & Evaluator',
    },
    {
      num: 3,
      title: 'Unggah Proper & Wawancara',
      done: step3Done,
      statusText:
        totalPeserta === 0
          ? 'Menunggu data peserta'
          : `${totalProper}/${totalPeserta} unggah Proper · ${totalWawancaraSelesai}/${totalPeserta} wawancara selesai`,
      href: `/kegiatan/${kegiatanId}/pantau-wawancara`,
      cta: 'Pantau Progres',
    },
    {
      num: 4,
      title: 'Analisis & Slide Ekspose',
      done: false,
      statusText: step4Ready
        ? 'Siap dilihat & diunduh ke PPTX'
        : 'Tersedia setelah Tahap 1 selesai',
      href: `/kegiatan/${kegiatanId}/ekspose`,
      cta: 'Buka Ekspose',
    },
  ];

  return (
    <section
      aria-labelledby="workflow-checklist-title"
      className="rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="workflow-checklist-title"
              className="text-sm font-semibold text-zinc-950"
            >
              Panduan Alur Pengelolaan Kegiatan
            </h2>
            <span className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-700">
              {completedCount}/3 tahap awal selesai
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-600">
            Ikuti 4 tahap berurutan di bawah ini agar proses evaluasi hingga paparan Ekspose berjalan rapi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-400 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 transition hover:bg-zinc-50"
          >
            {copiedPublic ? (
              <CheckIcon className="h-3.5 w-3.5 text-zinc-950" aria-hidden="true" />
            ) : (
              <CopyIcon className="h-3.5 w-3.5 text-zinc-700" aria-hidden="true" />
            )}
            <span>
              {copiedPublic ? 'Tautan Peserta Disalin' : 'Salin Tautan Unggah Peserta'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-expanded={!collapsed}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            <span>{collapsed ? 'Tampilkan' : 'Sembunyikan'}</span>
            {collapsed ? (
              <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronUpIcon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stages.map((st) => (
            <div
              key={st.num}
              className={`flex flex-col justify-between rounded-xl border p-3.5 ${
                st.done
                  ? 'border-zinc-300 bg-zinc-50/70'
                  : 'border-zinc-200 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-zinc-950 font-mono text-[11px] font-semibold text-white">
                    {st.num}
                  </span>
                  {st.done && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-900">
                      <CheckCircledIcon className="h-3 w-3 text-zinc-950" aria-hidden="true" />
                      Selesai
                    </span>
                  )}
                </div>
                <h3 className="mt-2.5 text-xs font-semibold text-zinc-950">
                  {st.title}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
                  {st.statusText}
                </p>
              </div>

              <div className="mt-3">
                <Link
                  href={st.href}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-950 underline-offset-4 hover:underline"
                >
                  <span>{st.cta}</span>
                  <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
