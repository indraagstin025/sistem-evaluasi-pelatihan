import { prisma } from '@/lib/prisma';
import { canAccessKegiatan, type SessionUser } from '@/lib/auth';
import { KRITERIA_LABEL_MAP } from '@/lib/wawancara-kriteria';

export interface KegiatanListItem {
  id: string;
  nama: string;
  jenisPelatihan: string;
  penyelenggara: string;
  lokasi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  totalPeserta: number;
  totalTim: number;
  totalProper: number;
  totalSelisih: number;
  wawancaraSelesaiCount: number;
  timSaya?: Array<{ id: string; namaTim: string; linkMeeting: string | null }>;
}

/**
 * Mengambil daftar kegiatan beserta statistik ringkas sesuai peran pengguna.
 * Dipakai bersama oleh GET /api/kegiatan dan Server Component app/kegiatan/page.tsx.
 */
export async function listKegiatanForUser(user: SessionUser): Promise<KegiatanListItem[]> {
  if (user.role === 'SUPER_ADMIN') {
    const [kegiatan, selesaiGroups] = await Promise.all([
      prisma.kegiatan.findMany({
        include: {
          _count: {
            select: {
              peserta: true,
              tim: true,
              inovasiProper: true,
              selisihImport: true,
            },
          },
        },
        orderBy: [{ tanggalMulai: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.peserta.groupBy({
        by: ['kegiatanId'],
        where: {
          wawancaraSelesaiAt: { not: null },
          inovasiProper: { isNot: null },
        },
        _count: { _all: true },
      }),
    ]);

    const selesaiMap = new Map<string, number>();
    for (const g of selesaiGroups) {
      selesaiMap.set(g.kegiatanId, g._count._all);
    }

    return kegiatan.map(({ _count, tanggalMulai, tanggalSelesai, createdAt, updatedAt, ...rest }) => ({
      ...rest,
      tanggalMulai: tanggalMulai.toISOString(),
      tanggalSelesai: tanggalSelesai.toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      totalPeserta: _count.peserta,
      totalTim: _count.tim,
      totalProper: _count.inovasiProper,
      totalSelisih: _count.selisihImport,
      wawancaraSelesaiCount: selesaiMap.get(rest.id) ?? 0,
    }));
  }

  // EVALUATOR: hanya melihat kegiatan tempat ia mengampu tim
  const kegiatan = await prisma.kegiatan.findMany({
    where: {
      tim: {
        some: { evaluatorId: user.id },
      },
    },
    include: {
      tim: {
        where: { evaluatorId: user.id },
        select: {
          id: true,
          namaTim: true,
          linkMeeting: true,
          peserta: {
            select: {
              id: true,
              wawancaraSelesaiAt: true,
              inovasiProper: { select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: [{ tanggalMulai: 'desc' }, { createdAt: 'desc' }],
  });

  return kegiatan.map(({ tim, tanggalMulai, tanggalSelesai, createdAt, updatedAt, ...rest }) => {
    const myPeserta = tim.flatMap((t) => t.peserta);
    return {
      ...rest,
      tanggalMulai: tanggalMulai.toISOString(),
      tanggalSelesai: tanggalSelesai.toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      totalPeserta: myPeserta.length,
      totalTim: tim.length,
      totalProper: myPeserta.filter((p) => p.inovasiProper !== null).length,
      totalSelisih: 0,
      wawancaraSelesaiCount: myPeserta.filter(
        (p) => p.wawancaraSelesaiAt !== null && p.inovasiProper !== null
      ).length,
      timSaya: tim.map((t) => ({ id: t.id, namaTim: t.namaTim, linkMeeting: t.linkMeeting })),
    };
  });
}

export type KegiatanDetailAccessResult =
  | { status: 'forbidden' }
  | { status: 'not_found' }
  | {
      status: 'ok';
      data: {
        viewerRole: SessionUser['role'];
        kegiatan: Record<string, any>;
        peserta: any[];
        pesertaTotal: number;
        tim: any[];
        selisihImport: any[];
      };
    };

/**
 * Mengambil detail ringkasan kegiatan untuk API GET /api/kegiatan/[id] dan RSC app/kegiatan/[id]/page.tsx.
 */
export async function getKegiatanDetailForUser(
  user: SessionUser,
  kegiatanId: string,
  options?: { includePeserta?: boolean }
): Promise<KegiatanDetailAccessResult> {
  const includePeserta = options?.includePeserta !== false;

  const allowed = await canAccessKegiatan(user, kegiatanId);
  if (!allowed) {
    return { status: 'forbidden' };
  }

  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id: kegiatanId },
  });
  if (!kegiatan) {
    return { status: 'not_found' };
  }

  const isAdmin = user.role === 'SUPER_ADMIN';
  const pesertaWhere = isAdmin
    ? { kegiatanId }
    : { kegiatanId, tim: { evaluatorId: user.id } };

  const [peserta, pesertaTotal, selisihRaw, timRaw] = await Promise.all([
    includePeserta
      ? prisma.peserta.findMany({
          where: pesertaWhere,
          include: {
            tim: {
              include: {
                evaluator: { select: { id: true, nama: true, nip: true } },
              },
            },
            survey: {
              where: { responden: 'alumni', kode: { in: ['L4_01', 'L4_02', 'L4_03'] } },
            },
            wawancara: true,
            hasil: true,
            inovasiProper: {
              select: {
                id: true,
                judulProper: true,
                jangkaMenengahStatus: true,
                jangkaPanjangStatus: true,
                dokumenNama: true,
                updatedAt: true,
              },
            },
          },
          orderBy: [{ nama: 'asc' }, { id: 'asc' }],
        })
      : Promise.resolve([]),
    prisma.peserta.count({ where: pesertaWhere }),
    isAdmin
      ? prisma.selisihImport.findMany({
          where: { kegiatanId },
          include: { peserta: { select: { nama: true, nip: true } } },
          orderBy: [{ peserta: { nama: 'asc' } }, { kriteria: 'asc' }],
        })
      : Promise.resolve([]),
    prisma.timEvaluator.findMany({
      where: isAdmin ? { kegiatanId } : { kegiatanId, evaluatorId: user.id },
      include: {
        evaluator: { select: { id: true, nama: true, nip: true } },
        _count: { select: { peserta: true } },
      },
      orderBy: { urutan: 'asc' },
    }),
  ]);

  const selisihImport = selisihRaw.map((s) => ({
    id: s.id,
    pesertaId: s.pesertaId,
    pesertaNama: s.peserta.nama,
    pesertaNip: s.peserta.nip,
    kriteria: s.kriteria,
    kriteriaLabel: KRITERIA_LABEL_MAP[s.kriteria] || s.kriteria,
    nilaiForm: s.nilaiForm,
    nilaiEkspose: s.nilaiEkspose,
    catatan: s.catatan,
  }));

  const serializedKegiatan = {
    ...kegiatan,
    tanggalMulai: kegiatan.tanggalMulai.toISOString(),
    tanggalSelesai: kegiatan.tanggalSelesai.toISOString(),
    createdAt: kegiatan.createdAt.toISOString(),
    updatedAt: kegiatan.updatedAt.toISOString(),
  };

  const serializedTim = timRaw.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const serializedPeserta = peserta.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    wawancaraSelesaiAt: p.wawancaraSelesaiAt ? p.wawancaraSelesaiAt.toISOString() : null,
    tim: p.tim
      ? {
          ...p.tim,
          createdAt: p.tim.createdAt.toISOString(),
          updatedAt: p.tim.updatedAt.toISOString(),
        }
      : null,
    wawancara: (p.wawancara || []).map((w) => ({
      ...w,
      updatedAt: w.updatedAt.toISOString(),
    })),
    hasil: p.hasil
      ? {
          ...p.hasil,
          updatedAt: p.hasil.updatedAt.toISOString(),
        }
      : null,
    inovasiProper: p.inovasiProper
      ? {
          ...p.inovasiProper,
          updatedAt: p.inovasiProper.updatedAt.toISOString(),
        }
      : null,
  }));

  return {
    status: 'ok',
    data: {
      viewerRole: user.role,
      kegiatan: serializedKegiatan,
      peserta: serializedPeserta,
      pesertaTotal,
      tim: serializedTim,
      selisihImport,
    },
  };
}
