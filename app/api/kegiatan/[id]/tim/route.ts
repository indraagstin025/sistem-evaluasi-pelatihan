import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessKegiatan, requireSession } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { bagiTimDariExcelAtauAuto, bagiTimOtomatis10 } from '@/lib/pembagian-tim';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const allowed = await canAccessKegiatan(guard.user, params.id);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Anda tidak terdaftar pada kegiatan ini.' },
      { status: 403 }
    );
  }

  const isAdmin = guard.user.role === 'SUPER_ADMIN';
  const [teams, evaluators, totalPeserta, excelTeamCount] = await Promise.all([
    prisma.timEvaluator.findMany({
      where: isAdmin
        ? { kegiatanId: params.id }
        : { kegiatanId: params.id, evaluatorId: guard.user.id },
      include: {
        evaluator: {
          select: { id: true, nama: true, nip: true, email: true, aktif: true },
        },
        peserta: {
          orderBy: { nama: 'asc' },
          select: {
            id: true,
            nama: true,
            nip: true,
            instansi: true,
            jabatanSaatIni: true,
            wawancaraSelesaiAt: true,
            inovasiProper: { select: { id: true } },
          },
        },
      },
      orderBy: { urutan: 'asc' },
    }),
    isAdmin
      ? prisma.user.findMany({
          where: { role: 'EVALUATOR', aktif: true },
          select: { id: true, nama: true, nip: true, email: true },
          orderBy: { nama: 'asc' },
        })
      : Promise.resolve([]),
    prisma.peserta.count({ where: { kegiatanId: params.id } }),
    prisma.peserta.count({
      where: { kegiatanId: params.id, namaTimExcel: { not: null } },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      teams,
      evaluators,
      totalPeserta,
      hasExcelTeams: excelTeamCount > 0,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    const mode = body?.mode === 'from_excel' ? 'from_excel' : 'auto_10';
    const result =
      mode === 'from_excel'
        ? await bagiTimDariExcelAtauAuto(params.id)
        : await bagiTimOtomatis10(params.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Pembagian tim selesai (${result.teamCount} tim untuk ${result.totalPeserta} peserta).`,
    });
  } catch (error: any) {
    console.error('POST /api/kegiatan/[id]/tim error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal melakukan pembagian tim.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    const timId = String(body?.timId || '');
    if (!timId) {
      return NextResponse.json({ success: false, error: 'timId wajib diisi.' }, { status: 400 });
    }

    const tim = await prisma.timEvaluator.findFirst({
      where: { id: timId, kegiatanId: params.id },
    });
    if (!tim) {
      return NextResponse.json({ success: false, error: 'Tim tidak ditemukan.' }, { status: 404 });
    }

    let evaluatorId: string | null | undefined =
      body?.evaluatorId !== undefined ? (body.evaluatorId || null) : undefined;

    // Opsional: buat akun Evaluator langsung saat tim dibentuk (IT-10)
    if (body?.newEvaluator) {
      const nama = String(body.newEvaluator.nama || '').trim();
      const nip = String(body.newEvaluator.nip || '').trim();
      const emailRaw = String(body.newEvaluator.email || '').trim().toLowerCase();
      const password = String(body.newEvaluator.password || '');

      if (!nama || !nip || password.length < 6) {
        return NextResponse.json(
          {
            success: false,
            error: 'Akun Evaluator baru memerlukan Nama, NIP, dan sandi awal minimal 6 karakter.',
          },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findUnique({ where: { nip } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `NIP ${nip} sudah terdaftar sebagai pengguna.` },
          { status: 400 }
        );
      }

      const createdUser = await prisma.user.create({
        data: {
          nama,
          nip,
          email: emailRaw || null,
          role: 'EVALUATOR',
          passwordHash: hashPassword(password),
          mustChangePassword: true,
          aktif: true,
        },
      });
      evaluatorId = createdUser.id;
    }

    const updated = await prisma.timEvaluator.update({
      where: { id: timId },
      data: {
        ...(body?.namaTim !== undefined ? { namaTim: String(body.namaTim).trim() } : {}),
        ...(evaluatorId !== undefined ? { evaluatorId } : {}),
        ...(body?.linkMeeting !== undefined
          ? { linkMeeting: String(body.linkMeeting || '').trim() || null }
          : {}),
      },
      include: {
        evaluator: { select: { id: true, nama: true, nip: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('PATCH /api/kegiatan/[id]/tim error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal memperbarui tim evaluator.' },
      { status: 500 }
    );
  }
}
