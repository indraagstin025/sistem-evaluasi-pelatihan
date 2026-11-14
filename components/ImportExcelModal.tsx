'use client';

import React, { useState, useRef } from 'react';
import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
  FileTextIcon,
  InfoCircledIcon,
  ReloadIcon,
  TableIcon,
  TrashIcon,
  UploadIcon,
} from '@radix-ui/react-icons';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DetectedFile {
  file: File;
  type: 'olah_data' | 'form_penilaian' | 'unknown';
  sheetNames: string[];
}

export default function ImportExcelModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportExcelModalProps) {
  const [files, setFiles] = useState<DetectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSurveyIndex, setSelectedSurveyIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const analyzeWorkbook = async (file: File): Promise<DetectedFile> => {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const sheetNames = wb.SheetNames || [];
      const lowerNames = sheetNames.map((s) => s.trim().toLowerCase());

      const hasJawaban = lowerNames.includes('jawaban');
      const hasOlahData = lowerNames.includes('olahdata');
      const hasEkspose = lowerNames.includes('ekspose');

      if (hasJawaban || hasOlahData || hasEkspose) {
        return { file, type: 'olah_data', sheetNames };
      }

      const numberedSheets = sheetNames.filter((s) => /^\d+\.\s*(.+)$/.test(s.trim()));
      if (numberedSheets.length >= 3) {
        return { file, type: 'form_penilaian', sheetNames };
      }

      return { file, type: 'unknown', sheetNames };
    } catch (err) {
      console.error('Error analyzing file:', err);
      return { file, type: 'unknown', sheetNames: [] };
    }
  };

  const handleFilesAdded = async (newFileList: FileList | File[]) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const addedFiles: File[] = Array.from(newFileList);
    const analyzed = await Promise.all(addedFiles.map((f) => analyzeWorkbook(f)));

    setFiles((prev) => {
      const combined = [...prev];
      for (const item of analyzed) {
        const isDuplicate = combined.some(
          (c) => c.file.name === item.file.name && c.file.size === item.file.size
        );
        if (!isDuplicate && combined.length < 2) {
          combined.push(item);
        }
      }
      return combined;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setErrorMessage(null);
  };

  const surveyFiles = files.filter((f) => f.type === 'olah_data');
  const interviewFiles = files.filter((f) => f.type === 'form_penilaian');

  const hasTwoSurveys = surveyFiles.length >= 2;
  const hasTwoInterviews = interviewFiles.length >= 2;
  const hasOnlyInterview = interviewFiles.length > 0 && surveyFiles.length === 0;
  const hasOnlySurvey = surveyFiles.length === 1 && interviewFiles.length === 0;
  const isReady = surveyFiles.length >= 1;

  const handleStartImport = async () => {
    if (!isReady) {
      setErrorMessage('Minimal perlu 1 file survei (Olah Data) sebagai data utama peserta.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const activeSurveyFile = hasTwoSurveys
        ? surveyFiles[selectedSurveyIndex].file
        : surveyFiles[0].file;
      const activeInterviewFile = interviewFiles.length > 0 ? interviewFiles[0].file : null;

      const formData = new FormData();
      formData.append('file', activeSurveyFile);
      if (activeInterviewFile) {
        formData.append('formFile', activeInterviewFile);
      }
      formData.append('mode', 'replace');

      const res = await fetch('/api/peserta/import', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage(
          activeInterviewFile
            ? 'File survei dan Form Penilaian Wawancara berhasil diimpor.'
            : 'File survei berhasil diimpor. Nilai wawancara berstatus KOSONG.'
        );
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 900);
      } else {
        setErrorMessage(json.error || 'Gagal memproses file Excel.');
      }
    } catch (err) {
      console.error('Import error:', err);
      setErrorMessage('Koneksi bermasalah saat mengunggah file. Coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isProcessing) onClose();
      }}
    >
      <DialogContent
        closeDisabled={isProcessing}
        onEscapeKeyDown={(e) => {
          if (isProcessing) e.preventDefault();
        }}
        className="flex max-h-[90vh] max-w-xl flex-col overflow-hidden p-0"
      >
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <TableIcon className="h-4 w-4 text-zinc-950" aria-hidden="true" />
            <DialogTitle>Impor File Excel</DialogTitle>
          </div>
          <DialogDescription>
            Unggah file Olah Data Survei dan Form Penilaian Wawancara (.xlsx atau .xls).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          {/* Dropzone dengan button aksesibel penuh (zero clickable div) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                if (e.target.files) handleFilesAdded(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-6 text-center transition ${
                isDragging
                  ? 'border-zinc-950 bg-zinc-100'
                  : 'border-zinc-400 bg-zinc-50 hover:border-zinc-950 hover:bg-zinc-100/70'
              }`}
            >
              <UploadIcon className="h-5 w-5 text-zinc-950" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-zinc-950">
                  Tarik file Excel ke sini, atau <span className="font-semibold text-zinc-950 underline underline-offset-4">pilih file</span>
                </p>
                <p className="mt-1 text-xs font-normal text-zinc-600">
                  Boleh 1 atau 2 file (.xlsx, .xls), jenis filenya dikenali otomatis.
                </p>
              </div>
            </button>
          </div>

          {/* Daftar File yang Terdeteksi */}
          {files.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-zinc-700">
                File terpilih ({files.length}/2)
              </p>
              <div className="space-y-2">
                {files.map((item, idx) => (
                  <div
                    key={`${item.file.name}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FileTextIcon className="h-4 w-4 shrink-0 text-zinc-700" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="max-w-[240px] truncate text-xs font-medium text-zinc-950">
                            {item.file.name}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                              item.type === 'olah_data'
                                ? 'bg-zinc-950 text-white'
                                : item.type === 'form_penilaian'
                                ? 'border border-zinc-300 bg-zinc-100 text-zinc-900'
                                : 'border border-zinc-900 bg-white text-zinc-950'
                            }`}
                          >
                            {item.type === 'olah_data'
                              ? 'Survei (Olah Data)'
                              : item.type === 'form_penilaian'
                              ? 'Wawancara'
                              : 'Format belum dikenal'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-normal text-zinc-600">
                          {(item.file.size / 1024).toFixed(1)} KB, {item.sheetNames.length} sheet
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      disabled={isProcessing}
                      aria-label={`Hapus file ${item.file.name}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-40"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pilihan file survei jika mengunggah dua file survei (Radix RadioGroup) */}
          {hasTwoSurveys && (
            <div className="space-y-2.5 rounded-lg border border-zinc-900 bg-zinc-100 p-3.5 text-xs text-zinc-950">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950" aria-hidden="true" />
                <p className="font-normal">
                  <span className="font-semibold">Kedua file terdeteksi sebagai file survei.</span>{' '}
                  Pilih salah satu file sebagai data survei utama:
                </p>
              </div>
              <RadioGroup
                value={String(selectedSurveyIndex)}
                onValueChange={(v) => setSelectedSurveyIndex(Number(v))}
                className="pl-6"
              >
                {surveyFiles.map((sf, sIdx) => {
                  const id = `survey-choice-${sIdx}`;
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <RadioGroupItem value={String(sIdx)} id={id} />
                      <label htmlFor={id} className="font-medium text-zinc-950">
                        {sf.file.name}
                      </label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          {hasTwoInterviews && (
            <div className="flex items-start gap-2 rounded-lg border border-zinc-900 bg-zinc-100 p-3.5 text-xs text-zinc-950">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950" aria-hidden="true" />
              <p className="font-normal">
                <span className="font-semibold">Kedua file adalah Form Penilaian Wawancara.</span>{' '}
                Tambahkan file Olah Data Survei sebagai data utama peserta (nama, NIP, instansi).
              </p>
            </div>
          )}

          {hasOnlyInterview && (
            <div className="flex items-start gap-2 rounded-lg border border-zinc-900 bg-zinc-100 p-3.5 text-xs text-zinc-950">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950" aria-hidden="true" />
              <p className="font-normal">
                <span className="font-semibold">Baru ada file wawancara.</span>{' '}
                Tambahkan juga file Olah Data Survei agar daftar peserta dapat dimuat.
              </p>
            </div>
          )}

          {hasOnlySurvey && (
            <div className="flex items-start gap-2 rounded-lg border border-zinc-300 bg-zinc-50 p-3.5 text-xs text-zinc-800">
              <InfoCircledIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-800" aria-hidden="true" />
              <p className="font-normal">
                <span className="font-semibold text-zinc-950">Form Penilaian Wawancara tidak disertakan.</span>{' '}
                Nilai survei (L) tetap diproses, sementara nilai wawancara (M) dan Total Form berstatus KOSONG.
              </p>
            </div>
          )}

          {surveyFiles.length === 1 && interviewFiles.length === 1 && (
            <div className="flex items-start gap-2 rounded-lg border border-zinc-300 bg-white p-3.5 text-xs text-zinc-900">
              <CheckCircledIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950" aria-hidden="true" />
              <p className="font-normal">
                <span className="font-semibold text-zinc-950">Kedua file lengkap.</span>{' '}
                File Olah Data Survei dan Form Penilaian Wawancara siap diproses.
              </p>
            </div>
          )}

          {errorMessage && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-zinc-950 bg-zinc-950 p-3.5 text-xs text-white">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden="true" />
              <p>{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div role="status" className="flex items-start gap-2 rounded-lg border border-zinc-900 bg-zinc-100 p-3.5 text-xs text-zinc-950">
              <CheckCircledIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950" aria-hidden="true" />
              <p>{successMessage}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleStartImport}
            disabled={!isReady || hasOnlyInterview || isProcessing}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              isReady && !hasOnlyInterview && !isProcessing
                ? 'bg-zinc-950 text-white hover:bg-zinc-800'
                : 'cursor-not-allowed bg-zinc-200 text-zinc-600'
            }`}
          >
            {isProcessing ? (
              <>
                <ReloadIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Memproses file...
              </>
            ) : (
              <>
                <TableIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Mulai Impor
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
