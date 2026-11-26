'use client';

import React, { useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import { Cross2Icon, ExclamationTriangleIcon } from '@radix-ui/react-icons';

export type PendingFinalAction =
  | { kind: 'pptx' }
  | { kind: 'pdf' }
  | { kind: 'csv' }
  | { kind: 'ai_all' }
  | { kind: 'ai_slide'; slideKey: string; slideLabel: string };

export interface IncompletePesertaItem {
  id: string;
  nama: string;
  instansi: string | null;
  timNama: string | null;
  surveiKosong?: boolean;
  wawancaraKosong?: boolean;
  keteranganKosong?: string;
}

interface IncompleteEksposeModalProps {
  open: boolean;
  action: PendingFinalAction | null;
  kegiatanId: string;
  totalPeserta: number;
  validSurvei: number;
  validWawancara: number;
  incompleteList: IncompletePesertaItem[];
  onCancel: () => void;
  onConfirm: (action: PendingFinalAction) => void;
}

function getActionCopy(action: PendingFinalAction | null): {
  targetLabel: string;
  confirmLabel: string;
  extraNote: string | null;
} {
  if (!action) {
    return {
      targetLabel: 'data akhir ekspose',
      confirmLabel: 'Ya, Hasilkan Data',
      extraNote: null,
    };
  }

  switch (action.kind) {
    case 'pptx':
      return {
        targetLabel: 'file presentasi PowerPoint (PPTX)',
        confirmLabel: 'Ya, Unduh PPTX',
        extraNote: null,
      };
    case 'pdf':
      return {
        targetLabel: 'cetakan PDF slide ekspose',
        confirmLabel: 'Ya, Cetak Slide PDF',
        extraNote: null,
      };
    case 'csv':
      return {
        targetLabel: 'file rekapitulasi CSV',
        confirmLabel: 'Ya, Unduh Rekap CSV',
        extraNote: null,
      };
    case 'ai_all':
      return {
        targetLabel: 'pembahasan AI untuk seluruh 6 slide',
        confirmLabel: 'Ya, Buat Semua dengan AI',
        extraNote:
          'Seluruh poin pembahasan pada ke-6 slide (termasuk yang pernah diubah manual) akan diperbarui.',
      };
    case 'ai_slide':
      return {
        targetLabel: `pembahasan AI untuk ${action.slideLabel}`,
        confirmLabel: 'Ya, Buat Pembahasan Slide',
        extraNote: null,
      };
  }
}

export default function IncompleteEksposeModal({
  open,
  action,
  kegiatanId,
  totalPeserta,
  validSurvei,
  validWawancara,
  incompleteList,
  onCancel,
  onConfirm,
}: IncompleteEksposeModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && action) {
      if (!dialog.open) {
        dialog.showModal();
      }
      cancelBtnRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, action]);

  const handleNativeClose = () => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.returnValue = '';
    }
    if (open) {
      onCancel();
    }
  };

  const handleBackdropPointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const clickedOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (clickedOutside) {
      dialog.dataset.pressedOutside = '1';
    } else {
      delete dialog.dataset.pressedOutside;
    }
  };

  const handleBackdropPointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const wasPressedOutside = dialog.dataset.pressedOutside === '1';
    delete dialog.dataset.pressedOutside;
    if (!wasPressedOutside) return;

    const rect = dialog.getBoundingClientRect();
    const releasedOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (releasedOutside) {
      dialog.close();
    }
  };

  const incompleteCount = incompleteList.length;
  const completeCount = Math.max(0, totalPeserta - incompleteCount);
  const visibleItems = incompleteList.slice(0, 5);
  const remainingCount = Math.max(0, incompleteCount - visibleItems.length);
  const copy = getActionCopy(action);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClose={handleNativeClose}
      onPointerDown={handleBackdropPointerDown}
      onPointerUp={handleBackdropPointerUp}
      className="no-print m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-zinc-500 bg-white p-0 text-zinc-950 shadow-2xl"
    >
      <div className="flex max-h-[88vh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="dialog-control-border mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-500 bg-zinc-100 text-zinc-950">
              <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1
                id={titleId}
                className="text-base font-semibold leading-snug tracking-tight text-zinc-950"
              >
                Ada <span className="font-mono tabular-nums">{incompleteCount}</span> Peserta yang
                Masih Kosong
              </h1>
              <p className="mt-0.5 text-xs text-zinc-600">
                Konfirmasi kelengkapan data sebelum menghasilkan berkas akhir
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Tutup dialog konfirmasi"
            className="dialog-control-border inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-transparent text-zinc-700 transition hover:border-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 sm:min-h-[34px] sm:min-w-[34px]"
          >
            <Cross2Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-xs sm:px-6 sm:py-5">
          <p id={descId} className="leading-relaxed text-zinc-800">
            Saat ini{' '}
            <strong className="font-mono font-semibold text-zinc-950 tabular-nums">
              {completeCount} dari {totalPeserta}
            </strong>{' '}
            peserta sudah memiliki data lengkap, sedangkan{' '}
            <strong className="font-mono font-semibold text-zinc-950 tabular-nums">
              {incompleteCount}
            </strong>{' '}
            peserta masih kosong. Apakah Anda yakin ingin langsung menghasilkan{' '}
            <strong className="font-semibold text-zinc-950">{copy.targetLabel}</strong> sekarang?
          </p>

          {visibleItems.length > 0 && (
            <div className="dialog-control-border rounded-xl border border-zinc-500 bg-zinc-50 p-3.5">
              <p className="text-[11px] font-semibold text-zinc-950">
                Rincian peserta dengan data kosong:
              </p>
              <ul className="mt-2 divide-y divide-zinc-200">
                {visibleItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-1.5 py-2 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-zinc-950">{item.nama}</p>
                      <p className="mt-0.5 break-words text-[11px] text-zinc-700">
                        {[item.instansi, item.timNama].filter(Boolean).join(' · ') ||
                          'Instansi belum tercatat'}
                      </p>
                    </div>
                    <span className="dialog-control-border inline-flex w-fit shrink-0 items-center rounded border border-zinc-500 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-950">
                      {item.keteranganKosong || 'Nilai wawancara kosong'}
                    </span>
                  </li>
                ))}
              </ul>
              {remainingCount > 0 && (
                <p className="mt-2 border-t border-zinc-200 pt-2 text-[11px] text-zinc-700">
                  Beserta <span className="font-mono font-semibold">{remainingCount}</span> peserta
                  lainnya.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-[11px] leading-relaxed text-zinc-700">
            <p>
              <strong className="font-semibold text-zinc-950">Dampak pada rekapitulasi:</strong>{' '}
              Data yang belum diisi tetap tercatat <strong className="font-mono">KOSONG</strong>{' '}
              (tidak dianggap nilai nol). Rekap survei dihitung dari{' '}
              <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                {validSurvei}
              </span>{' '}
              peserta dan rekap wawancara dari{' '}
              <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                {validWawancara}
              </span>{' '}
              peserta.
            </p>
            {copy.extraNote && <p className="text-zinc-800">{copy.extraNote}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
          <Link
            href={`/kegiatan/${kegiatanId}/wawancara?status=ada_kosong`}
            onClick={() => dialogRef.current?.close()}
            className="dialog-control-border inline-flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-500 bg-white px-3.5 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100 sm:min-h-[38px]"
          >
            Periksa Daftar Wawancara
          </Link>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <button
              ref={cancelBtnRef}
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="dialog-control-border inline-flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100 sm:min-h-[38px]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (!action) return;
                const selected = action;
                dialogRef.current?.close();
                onConfirm(selected);
              }}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 sm:min-h-[38px]"
            >
              {copy.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
