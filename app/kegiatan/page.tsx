'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarIcon,
  DotsVerticalIcon,
  ExclamationTriangleIcon,
  EyeOpenIcon,
  Pencil1Icon,
  PlusIcon,
  ReloadIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import Topbar from '@/components/Topbar';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBanner } from '@/components/ui/status-banner';

interface KegiatanItem {
  id: string;
  nama: string;
  jenisPelatihan: string;
  penyelenggara: string;
  lokasi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  totalPeserta: number;
  totalTim: number;
  totalProper: number;
  totalSelisih: number;
  wawancaraSelesaiCount: number;
  timSaya?: Array<{ id: string; namaTim: string; linkMeeting: string | null }>;
}

interface KegiatanFormState {
  nama: string;
  jenisPelatihan: string;
  penyelenggara: string;
  lokasi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
}

const EMPTY_FORM: KegiatanFormState = {
  nama: '',
  jenisPelatihan: 'PKP',
  penyelenggara: 'BPSDM Provinsi Jawa Barat',
  lokasi: '',
  tanggalMulai: '',
  tanggalSelesai: '',
};

function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = (d: Date) =>
    d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    const startDay = start.toLocaleDateString('id-ID', { day: '2-digit' });
    return `${startDay}–${fmt(end)}`;
  }
  return `${fmt(start)}–${fmt(end)}`;
}

function toDateInputValue(iso: string): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function KegiatanFormFields({
  idPrefix,
  form,
  onChange,
}: {
  idPrefix: string;
  form: KegiatanFormState;
  onChange: (next: KegiatanFormState) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label
            htmlFor={`${idPrefix}-nama`}
            className="mb-1.5 block text-xs font-semibold text-zinc-900"
          >
            Nama Kegiatan <span className="text-zinc-500">*</span>
          </label>
          <input
            id={`${idPrefix}-nama`}
            type="text"
            required
            value={form.nama}
            onChange={(e) => onChange({ ...form, nama: e.target.value })}
            placeholder="Contoh: PKP Angkatan VII Kabupaten Bogor"
            className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-jenis`}
            className="mb-1.5 block text-xs font-semibold text-zinc-900"
          >
            Jenis Pelatihan <span className="text-zinc-500">*</span>
          </label>
          <Select
            value={form.jenisPelatihan}
            onValueChange={(v) => onChange({ ...form, jenisPelatihan: v })}
          >
            <SelectTrigger
              id={`${idPrefix}-jenis`}
              className="h-[42px] rounded-lg border-zinc-500 px-3.5 text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PKP">PKP - Pelatihan Kepemimpinan Pengawas</SelectItem>
              <SelectItem value="PKA">PKA - Pelatihan Kepemimpinan Administrator</SelectItem>
              <SelectItem value="PKN">PKN - Pelatihan Kepemimpinan Nasional</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-1 text-[11px] text-zinc-500">
            PKA = Pelatihan Kepemimpinan Administrator, PKP = Pengawas, PKN = Nasional.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${idPrefix}-penyelenggara`}
            className="mb-1.5 block text-xs font-semibold text-zinc-900"
          >
            Penyelenggara <span className="text-zinc-500">*</span>
          </label>
          <input
            id={`${idPrefix}-penyelenggara`}
            type="text"
            required
            value={form.penyelenggara}
            onChange={(e) => onChange({ ...form, penyelenggara: e.target.value })}
            placeholder="Contoh: BPSDM Provinsi Jawa Barat"
            className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-lokasi`}
            className="mb-1.5 block text-xs font-semibold text-zinc-900"
          >
            Lokasi <span className="text-zinc-500">*</span>
          </label>
          <input
            id={`${idPrefix}-lokasi`}
            type="text"
            required
            value={form.lokasi}
            onChange={(e) => onChange({ ...form, lokasi: e.target.value })}
            placeholder="Contoh: Kabupaten Bogor"
            className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${idPrefix}-mulai`}
            className="mb-1.5 block text-xs font-semibold text-zinc-900"
          >
            Tanggal Mulai <span className="text-zinc-500">*</span>
          </label>
          <input
            id={`${idPrefix}-mulai`}
            type="date"
            required
            value={form.tanggalMulai}
            onChange={(e) => onChange({ ...form, tanggalMulai: e.target.value })}
            className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-selesai`}
            className="mb-1.5 block text-xs font-semibold text-zinc-900"
          >
            Tanggal Selesai <span className="text-zinc-500">*</span>
          </label>
          <input
            id={`${idPrefix}-selesai`}
            type="date"
            required
            value={form.tanggalSelesai}
            onChange={(e) => onChange({ ...form, tanggalSelesai: e.target.value })}
            className="min-h-[42px] w-full rounded-lg border border-zinc-500 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
          />
        </div>
      </div>
    </>
  );
}

export default function DaftarKegiatanPage() {
  const [role, setRole] = useState<'SUPER_ADMIN' | 'EVALUATOR' | null>(null);
  const [kegiatan, setKegiatan] = useState<KegiatanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState<KegiatanFormState>(EMPTY_FORM);

  const [detailTarget, setDetailTarget] = useState<KegiatanItem | null>(null);

  const [editTarget, setEditTarget] = useState<KegiatanItem | null>(null);
  const [editForm, setEditForm] = useState<KegiatanFormState>(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<KegiatanItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [meRes, kegRes] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/kegiatan', { cache: 'no-store' }),
      ]);
      const meJson = await meRes.json();
      const kegJson = await kegRes.json();

      if (meJson?.user?.role) {
        setRole(meJson.user.role);
      }
      if (!kegRes.ok || !kegJson.success) {
        setFetchError(
          kegJson.error || 'Gagal memuat daftar kegiatan. Coba muat ulang halaman.'
        );
        return;
      }
      setKegiatan(kegJson.data || []);
    } catch {
      setFetchError(
        'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!openMenuId) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-card-menu]')) {
        setOpenMenuId(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openMenuId]);

  const validateFormDates = (payload: KegiatanFormState): string | null => {
    if (
      payload.tanggalMulai &&
      payload.tanggalSelesai &&
      payload.tanggalSelesai < payload.tanggalMulai
    ) {
      return 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.';
    }
    return null;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const dateErr = validateFormDates(form);
    if (dateErr) {
      setCreateError(dateErr);
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setCreateError(
          json.error || 'Gagal membuat kegiatan baru. Periksa isian, lalu coba lagi.'
        );
        return;
      }
      setCreateOpen(false);
      setCreateError(null);
      setForm(EMPTY_FORM);
      await loadAll();
    } catch {
      setCreateError(
        'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.'
      );
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (item: KegiatanItem) => {
    setOpenMenuId(null);
    setEditError(null);
    setEditTarget(item);
    setEditForm({
      nama: item.nama,
      jenisPelatihan: item.jenisPelatihan,
      penyelenggara: item.penyelenggara,
      lokasi: item.lokasi,
      tanggalMulai: toDateInputValue(item.tanggalMulai),
      tanggalSelesai: toDateInputValue(item.tanggalSelesai),
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(null);
    const dateErr = validateFormDates(editForm);
    if (dateErr) {
      setEditError(dateErr);
      return;
    }
    setEditing(true);
    try {
      const res = await fetch(`/api/kegiatan/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setEditError(
          json.error || 'Gagal memperbarui kegiatan. Periksa isian, lalu coba lagi.'
        );
        return;
      }
      setEditTarget(null);
      setEditError(null);
      await loadAll();
    } catch {
      setEditError(
        'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.'
      );
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/kegiatan/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(
          json.error || 'Gagal menghapus kegiatan. Muat ulang halaman, lalu coba lagi.'
        );
        return;
      }
      setDeleteTarget(null);
      await loadAll();
    } catch {
      setActionError(
        'Tidak bisa terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const isAdmin = role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 pb-12">
      <Topbar
        title={isAdmin ? 'Daftar Kegiatan Evaluasi' : 'Kegiatan Evaluasi Saya'}
        subtitle={
          isAdmin
            ? 'Buat kegiatan baru, impor file Excel, atur tim evaluator, dan kelola Ekspose (paparan hasil evaluasi). Istilah: Proper (laporan Proyek Perubahan peserta).'
            : 'Pilih kegiatan di bawah ini untuk melihat peserta tim Anda, memeriksa laporan Proper (laporan Proyek Perubahan peserta), dan mengisi wawancara'
        }
      >
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
          >
            <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Buat Kegiatan</span>
          </button>
        )}
      </Topbar>

      {actionError && (
        <StatusBanner
          tone="error"
          message={actionError}
          onDismiss={() => setActionError(null)}
        />
      )}

      {loading ? (
        <div className="flex items-center gap-2.5 rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-600">
          <ReloadIcon className="h-4 w-4 animate-spin text-zinc-950" aria-hidden="true" />
          <span>Memuat daftar kegiatan...</span>
        </div>
      ) : fetchError ? (
        <StatusBanner
          tone="error"
          title="Gagal memuat kegiatan"
          message={fetchError}
          onRetry={loadAll}
        />
      ) : kegiatan.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
          <CalendarIcon className="mx-auto mb-3 h-7 w-7 text-zinc-600" aria-hidden="true" />
          <h2 className="text-base font-semibold text-zinc-950">
            {isAdmin
              ? 'Belum Ada Kegiatan Evaluasi'
              : 'Belum Ada Penugasan Tim Evaluator'}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-zinc-600">
            {isAdmin
              ? 'Klik "Buat Kegiatan" untuk membuat kegiatan Pelatihan Kepemimpinan (PKA = Pelatihan Kepemimpinan Administrator, PKP = Pengawas, PKN = Nasional), lalu impor dua file Excel.'
              : 'Anda belum ditautkan ke tim pada kegiatan apa pun. Hubungi Super Admin untuk penugasan tim.'}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-5 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Buat Kegiatan Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {kegiatan.map((item) => {
            const targetHref = isAdmin
              ? `/kegiatan/${item.id}`
              : `/kegiatan/${item.id}/wawancara`;
            const isMenuOpen = openMenuId === item.id;

            return (
              <div
                key={item.id}
                className="relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-500"
              >
                <div>
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex rounded border border-zinc-500 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-950">
                        {item.jenisPelatihan}
                      </span>
                      <h2 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-zinc-950">
                        {item.nama}
                      </h2>
                      <p className="mt-1 truncate text-[11px] text-zinc-600" title={`${item.penyelenggara} · ${item.lokasi}`}>
                        {item.penyelenggara} · {item.lokasi}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
                        {formatDateRange(item.tanggalMulai, item.tanggalSelesai)}
                      </p>
                    </div>

                    <div className="relative shrink-0" data-card-menu>
                      <button
                        type="button"
                        aria-label={`Opsi kegiatan ${item.nama}`}
                        aria-expanded={isMenuOpen}
                        aria-haspopup="menu"
                        onClick={() =>
                          setOpenMenuId((prev) => (prev === item.id ? null : item.id))
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-950 hover:bg-zinc-50 hover:text-zinc-950"
                      >
                        <DotsVerticalIcon className="h-4 w-4" aria-hidden="true" />
                      </button>

                      {isMenuOpen && (
                        <div
                          role="menu"
                          aria-label={`Menu aksi ${item.nama}`}
                          className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null);
                              setDetailTarget(item);
                            }}
                            className="flex min-h-[34px] w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-800 transition hover:bg-zinc-100 hover:text-zinc-950"
                          >
                            <EyeOpenIcon className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden="true" />
                            <span>Lihat Detail</span>
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => openEditModal(item)}
                                className="flex min-h-[34px] w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-800 transition hover:bg-zinc-100 hover:text-zinc-950"
                              >
                                <Pencil1Icon className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden="true" />
                                <span>Ubah</span>
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setDeleteTarget(item);
                                }}
                                className="flex min-h-[34px] w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-950 transition hover:bg-zinc-950 hover:text-white"
                              >
                                <TrashIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span>Hapus</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3.5 grid grid-cols-4 gap-1.5 border-t border-zinc-200 pt-3 text-center">
                    <div>
                      <p className="font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                        {item.totalPeserta}
                      </p>
                      <p className="text-[10px] text-zinc-600">Peserta</p>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                        {item.totalTim}
                      </p>
                      <p className="text-[10px] text-zinc-600">Tim</p>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                        {item.totalProper}
                      </p>
                      <p className="text-[10px] text-zinc-600" title="Peserta yang sudah unggah Proper">
                        Unggah Proper
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                        {item.wawancaraSelesaiCount}
                      </p>
                      <p className="text-[10px] text-zinc-600">Wawancara Selesai</p>
                    </div>
                  </div>

                  {isAdmin && item.totalSelisih > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-zinc-900 bg-zinc-100 px-2.5 py-1 text-[10px] font-medium text-zinc-950">
                      <ExclamationTriangleIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {item.totalSelisih} selisih nilai antara Form Penilaian dan Ekspose
                      </span>
                    </div>
                  )}

                  {!isAdmin && item.timSaya && item.timSaya.length > 0 && (
                    <div className="mt-2.5 truncate rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] text-zinc-700">
                      Tim:{' '}
                      <span className="font-semibold text-zinc-950">
                        {item.timSaya.map((t) => t.namaTim).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3.5 flex justify-end">
                  <Link
                    href={targetHref}
                    className="inline-flex min-h-[34px] items-center rounded-lg bg-zinc-950 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-zinc-800"
                  >
                    {isAdmin ? 'Kelola Kegiatan' : 'Buka Daftar Wawancara'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat Kegiatan */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateError(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Buat Kegiatan Baru</DialogTitle>
            <DialogDescription>
              Lengkapi informasi dasar kegiatan evaluasi pasca pelatihan (PKA, PKP, atau PKN).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              {createError && (
                <StatusBanner
                  tone="error"
                  message={createError}
                  onDismiss={() => setCreateError(null)}
                />
              )}
              <KegiatanFormFields idPrefix="keg" form={form} onChange={setForm} />
            </DialogBody>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="min-h-[40px] rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={creating}
                className="min-h-[40px] rounded-lg bg-zinc-950 px-5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {creating ? 'Menyimpan...' : 'Simpan Kegiatan'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Ubah Kegiatan */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open && !editing) {
            setEditTarget(null);
            setEditError(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Ubah Kegiatan Evaluasi</DialogTitle>
            <DialogDescription>
              Perbarui informasi kegiatan evaluasi pasca pelatihan yang dipilih.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              {editError && (
                <StatusBanner
                  tone="error"
                  message={editError}
                  onDismiss={() => setEditError(null)}
                />
              )}
              <KegiatanFormFields
                idPrefix="edit-keg"
                form={editForm}
                onChange={setEditForm}
              />
            </DialogBody>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                disabled={editing}
                className="min-h-[40px] rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editing}
                className="min-h-[40px] rounded-lg bg-zinc-950 px-5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {editing ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Detail Kegiatan */}
      <Dialog
        open={detailTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDetailTarget(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Kegiatan Evaluasi</DialogTitle>
            <DialogDescription>
              Ringkasan metadata kegiatan dan capaian evaluasi pasca pelatihan.
            </DialogDescription>
          </DialogHeader>

          {detailTarget && (
            <>
              <DialogBody className="space-y-4">
                <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-zinc-500 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-950">
                      {detailTarget.jenisPelatihan}
                    </span>
                    <span className="font-mono text-xs text-zinc-600">
                      {formatDateRange(detailTarget.tanggalMulai, detailTarget.tanggalSelesai)}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-950">
                    {detailTarget.nama}
                  </h3>
                </div>

                <dl className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white px-4 text-xs">
                  <div className="grid grid-cols-[120px_1fr] gap-2 py-2.5">
                    <dt className="text-zinc-600">Penyelenggara</dt>
                    <dd className="font-medium text-zinc-950">{detailTarget.penyelenggara}</dd>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 py-2.5">
                    <dt className="text-zinc-600">Lokasi</dt>
                    <dd className="font-medium text-zinc-950">{detailTarget.lokasi}</dd>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 py-2.5">
                    <dt className="text-zinc-600">Periode</dt>
                    <dd className="font-mono text-zinc-950">
                      {formatDateRange(detailTarget.tanggalMulai, detailTarget.tanggalSelesai)}
                    </dd>
                  </div>
                </dl>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="font-mono text-base font-semibold text-zinc-950 tabular-nums">
                      {detailTarget.totalPeserta}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">Peserta</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="font-mono text-base font-semibold text-zinc-950 tabular-nums">
                      {detailTarget.totalTim}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">Tim</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="font-mono text-base font-semibold text-zinc-950 tabular-nums">
                      {detailTarget.totalProper}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">Unggah Proper</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="font-mono text-base font-semibold text-zinc-950 tabular-nums">
                      {detailTarget.wawancaraSelesaiCount}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">Wawancara Selesai</p>
                  </div>
                </div>

                {isAdmin && detailTarget.totalSelisih > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-100 px-3.5 py-2.5 text-xs font-medium text-zinc-950">
                    <ExclamationTriangleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {detailTarget.totalSelisih} selisih nilai antara Form Penilaian dan Ekspose.
                    </span>
                  </div>
                )}
              </DialogBody>

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setDetailTarget(null)}
                  className="min-h-[40px] rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
                >
                  Tutup
                </button>
                <Link
                  href={
                    isAdmin
                      ? `/kegiatan/${detailTarget.id}`
                      : `/kegiatan/${detailTarget.id}/wawancara`
                  }
                  onClick={() => setDetailTarget(null)}
                  className="inline-flex min-h-[40px] items-center rounded-lg bg-zinc-950 px-5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
                >
                  {isAdmin ? 'Kelola Kegiatan' : 'Buka Daftar Wawancara'}
                </Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title="Hapus Kegiatan?"
        description={
          deleteTarget
            ? `Kegiatan "${deleteTarget.nama}" beserta seluruh peserta, tim, laporan Proper, nilai wawancara, dan pembahasannya akan dihapus permanen.`
            : ''
        }
        confirmLabel="Hapus Kegiatan"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
