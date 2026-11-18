'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarIcon,
  ExclamationTriangleIcon,
  ExternalLinkIcon,
  PlusIcon,
  ReloadIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import Topbar from '@/components/Topbar';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import {
  Dialog,
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

function formatDateRange(startIso: string, endIso: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  return `${fmt(startIso)} s.d. ${fmt(endIso)}`;
}

export default function DaftarKegiatanPage() {
  const [role, setRole] = useState<'SUPER_ADMIN' | 'EVALUATOR' | null>(null);
  const [kegiatan, setKegiatan] = useState<KegiatanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    nama: '',
    jenisPelatihan: 'PKP',
    penyelenggara: 'BPSDM Provinsi Jawa Barat',
    lokasi: '',
    tanggalMulai: '',
    tanggalSelesai: '',
  });

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
        setFetchError(kegJson.error || 'Gagal memuat daftar kegiatan.');
        return;
      }
      setKegiatan(kegJson.data || []);
    } catch {
      setFetchError('Koneksi bermasalah saat memuat daftar kegiatan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error || 'Gagal membuat kegiatan baru.');
        return;
      }
      setCreateOpen(false);
      setForm({
        nama: '',
        jenisPelatihan: 'PKP',
        penyelenggara: 'BPSDM Provinsi Jawa Barat',
        lokasi: '',
        tanggalMulai: '',
        tanggalSelesai: '',
      });
      await loadAll();
    } catch {
      setActionError('Koneksi gagal saat menyimpan kegiatan.');
    } finally {
      setCreating(false);
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
        setActionError(json.error || 'Gagal menghapus kegiatan.');
        return;
      }
      setDeleteTarget(null);
      await loadAll();
    } catch {
      setActionError('Koneksi bermasalah saat menghapus kegiatan.');
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
            ? 'Buat kegiatan baru, impor berkas Excel, atur tim evaluator, dan kelola Ekspose'
            : 'Pilih kegiatan di bawah ini untuk melihat daftar pegawai tim Anda dan mengisi wawancara'
        }
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/unggah-inovasi"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-zinc-500 bg-white px-3.5 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-100"
          >
            <span>Link Public Proper</span>
            <ExternalLinkIcon className="h-3.5 w-3.5 text-zinc-700" aria-hidden="true" />
          </Link>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
            >
              <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Buat Kegiatan</span>
            </button>
          )}
        </div>
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
              ? 'Klik "Buat Kegiatan" untuk membuat pelatihan PKA, PKP, atau PKN lalu impor dua berkas Excel.'
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {kegiatan.map((item) => {
            const targetHref = isAdmin
              ? `/kegiatan/${item.id}`
              : `/kegiatan/${item.id}/wawancara`;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-500"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex rounded border border-zinc-500 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-950">
                        {item.jenisPelatihan}
                      </span>
                      <h2 className="mt-2 text-lg font-semibold leading-snug text-zinc-950">
                        {item.nama}
                      </h2>
                      <p className="mt-1 text-xs text-zinc-600">
                        {item.penyelenggara} · {item.lokasi}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                        {formatDateRange(item.tanggalMulai, item.tanggalSelesai)}
                      </p>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        aria-label={`Hapus kegiatan ${item.nama}`}
                        onClick={() => setDeleteTarget(item)}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 hover:border-zinc-950 hover:text-zinc-950"
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-4 gap-2 border-t border-zinc-200 pt-4 text-center">
                    <div>
                      <p className="font-mono text-lg font-semibold text-zinc-950 tabular-nums">
                        {item.totalPeserta}
                      </p>
                      <p className="text-[11px] text-zinc-600">Peserta</p>
                    </div>
                    <div>
                      <p className="font-mono text-lg font-semibold text-zinc-950 tabular-nums">
                        {item.totalTim}
                      </p>
                      <p className="text-[11px] text-zinc-600">Tim</p>
                    </div>
                    <div>
                      <p className="font-mono text-lg font-semibold text-zinc-950 tabular-nums">
                        {item.totalProper}
                      </p>
                      <p className="text-[11px] text-zinc-600">Proper</p>
                    </div>
                    <div>
                      <p className="font-mono text-lg font-semibold text-zinc-950 tabular-nums">
                        {item.wawancaraSelesaiCount}
                      </p>
                      <p className="text-[11px] text-zinc-600">Selesai</p>
                    </div>
                  </div>

                  {isAdmin && item.totalSelisih > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-zinc-900 bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-950">
                      <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {item.totalSelisih} catatan selisih nilai Form Penilaian vs Ekspose (IT-01)
                      </span>
                    </div>
                  )}

                  {!isAdmin && item.timSaya && item.timSaya.length > 0 && (
                    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                      Tim Diampu:{' '}
                      <span className="font-semibold text-zinc-950">
                        {item.timSaya.map((t) => t.namaTim).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex justify-end">
                  <Link
                    href={targetHref}
                    className="inline-flex min-h-[38px] items-center rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
                  >
                    {isAdmin ? 'Kelola Kegiatan' : 'Buka Daftar Pegawai & Wawancara'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat Kegiatan (5 isian wajib UR-F-08) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Kegiatan Baru</DialogTitle>
            <DialogDescription>
              Lengkapi lima informasi dasar kegiatan evaluasi pasca pelatihan (PKA, PKP, atau PKN).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="mt-2 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="keg-nama" className="mb-1 block text-xs font-medium text-zinc-900">
                  Nama Kegiatan
                </label>
                <input
                  id="keg-nama"
                  type="text"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Contoh: PKP Angkatan VII Kabupaten Bogor"
                  className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="keg-jenis" className="mb-1 block text-xs font-medium text-zinc-900">
                  Pelatihan
                </label>
                <Select
                  value={form.jenisPelatihan}
                  onValueChange={(v) => setForm({ ...form, jenisPelatihan: v })}
                >
                  <SelectTrigger id="keg-jenis" className="h-[34px] border-zinc-500 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKP">PKP</SelectItem>
                    <SelectItem value="PKA">PKA</SelectItem>
                    <SelectItem value="PKN">PKN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label
                htmlFor="keg-penyelenggara"
                className="mb-1 block text-xs font-medium text-zinc-900"
              >
                Penyelenggara
              </label>
              <input
                id="keg-penyelenggara"
                type="text"
                required
                value={form.penyelenggara}
                onChange={(e) => setForm({ ...form, penyelenggara: e.target.value })}
                placeholder="Contoh: BPSDM Provinsi Jawa Barat"
                className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="keg-lokasi" className="mb-1 block text-xs font-medium text-zinc-900">
                Lokasi
              </label>
              <input
                id="keg-lokasi"
                type="text"
                required
                value={form.lokasi}
                onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                placeholder="Contoh: Kabupaten Bogor"
                className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="keg-mulai"
                  className="mb-1 block text-xs font-medium text-zinc-900"
                >
                  Tanggal Mulai
                </label>
                <input
                  id="keg-mulai"
                  type="date"
                  required
                  value={form.tanggalMulai}
                  onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
                  className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="keg-selesai"
                  className="mb-1 block text-xs font-medium text-zinc-900"
                >
                  Tanggal Selesai
                </label>
                <input
                  id="keg-selesai"
                  type="date"
                  required
                  value={form.tanggalSelesai}
                  onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })}
                  className="w-full rounded-lg border border-zinc-500 bg-white px-3 py-2 text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="min-h-[38px] rounded-lg border border-zinc-500 bg-white px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={creating}
                className="min-h-[38px] rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {creating ? 'Menyimpan...' : 'Simpan Kegiatan'}
              </button>
            </DialogFooter>
          </form>
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
            ? `Kegiatan "${deleteTarget.nama}" beserta seluruh peserta, tim, proper, nilai wawancara, dan pembahasannya akan dihapus permanen.`
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
