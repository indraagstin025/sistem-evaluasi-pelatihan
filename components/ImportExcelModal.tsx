'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  RefreshCw,
  FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

  if (!isOpen) return null;

  // Analisis tipe workbook dari sheet
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

    const analyzedPromises = addedFiles.map((f) => analyzeWorkbook(f));
    const analyzed = await Promise.all(analyzedPromises);

    // Gabungkan dengan file yang sudah ada (maksimal 2 berkas yang berbeda)
    setFiles((prev) => {
      const combined = [...prev];
      for (const item of analyzed) {
        // Cek duplikat nama & ukuran
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

  // Klasifikasi berkas saat ini
  const surveyFiles = files.filter((f) => f.type === 'olah_data');
  const interviewFiles = files.filter((f) => f.type === 'form_penilaian');
  const unknownFiles = files.filter((f) => f.type === 'unknown');

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
        }, 1200);
      } else {
        setErrorMessage(json.error || 'Gagal memproses file Excel.');
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage('Koneksi bermasalah saat mengunggah file. Coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Impor File Excel</h2>
              <p className="text-xs text-slate-500">Siapkan file Olah Data dan Form Penilaian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Unified Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/60 scale-[0.99]'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-400'
            }`}
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
            <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-emerald-600">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Tarik file Excel ke sini, atau <span className="text-emerald-600 underline">pilih file</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Boleh 1 atau 2 file (.xlsx, .xls) — jenis filenya dikenali otomatis
              </p>
            </div>
          </div>

          {/* Daftar Berkas yang Terdeteksi */}
          {files.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                File yang Dipilih ({files.length}/2)
              </p>
              <div className="space-y-2">
                {files.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          item.type === 'olah_data'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.type === 'form_penilaian'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[220px]">
                            {item.file.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.type === 'olah_data'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.type === 'form_penilaian'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.type === 'olah_data'
                              ? 'Survei (Olah Data)'
                              : item.type === 'form_penilaian'
                              ? 'Wawancara'
                              : 'Format Belum Dikenal'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {(item.file.size / 1024).toFixed(1)} KB • {item.sheetNames.length} sheet
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveFile(idx)}
                      disabled={isProcessing}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                      title="Hapus file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifikasi Cerdas Kasus Khusus */}
          {hasTwoSurveys && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Kedua file terdeteksi sebagai file survei.</strong> Pilih mana yang
                  mau dipakai sebagai data survei utama:
                </p>
              </div>
              <div className="pl-6 space-y-1">
                {surveyFiles.map((sf, sIdx) => (
                  <label key={sIdx} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="selectedSurvey"
                      checked={selectedSurveyIndex === sIdx}
                      onChange={() => setSelectedSurveyIndex(sIdx)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    {sf.file.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {hasTwoInterviews && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Kedua file adalah Form Penilaian Wawancara.</strong> Masih butuh file Olah Data
                Survei sebagai data utama peserta (nama, NIP, instansi). Silakan tambahkan file Olah Data Survei.
              </p>
            </div>
          )}

          {hasOnlyInterview && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Baru ada file wawancara.</strong> Tambahkan juga file Olah Data Survei
                supaya daftar peserta bisa dimuat.
              </p>
            </div>
          )}

          {hasOnlySurvey && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                <strong>File Form Penilaian Wawancara tidak disertakan.</strong> Nilai survei (L) tetap bisa diproses,
                tapi nilai wawancara (M) dan Total Form akan berstatus <strong>KOSONG</strong>.
              </p>
            </div>
          )}

          {surveyFiles.length === 1 && interviewFiles.length === 1 && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong>Kedua file lengkap!</strong> File Olah Data Survei dan Form Penilaian Wawancara siap
                diproses untuk membandingkan nilai L, M, dan Total Form.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>{successMessage}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-white transition"
          >
            Batal
          </button>

          <button
            onClick={handleStartImport}
            disabled={!isReady || hasOnlyInterview || isProcessing}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 ${
              isReady && !hasOnlyInterview && !isProcessing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Memproses file...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Mulai Impor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
