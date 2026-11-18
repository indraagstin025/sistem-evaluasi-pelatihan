import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const file = await prisma.uploadedFile.findUnique({
    where: { id: params.id },
  });

  if (!file) {
    return NextResponse.json(
      { success: false, error: 'Berkas tidak ditemukan.' },
      { status: 404 }
    );
  }

  // EVALUATOR hanya boleh mengakses berkas milik peserta di tim pengampuannya
  if (guard.user.role === 'EVALUATOR') {
    const owner = await prisma.inovasiProper.findFirst({
      where: {
        OR: [
          { dokumenFileId: file.id },
          { jangkaMenengahFotoId: file.id },
          { jangkaPanjangFotoId: file.id },
        ],
      },
      select: {
        peserta: {
          select: {
            tim: { select: { evaluatorId: true } },
          },
        },
      },
    });

    if (!owner || owner.peserta.tim?.evaluatorId !== guard.user.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses ke berkas peserta ini.' },
        { status: 403 }
      );
    }
  }

  const url = new URL(request.url);
  const forceDownload = url.searchParams.get('download') === '1';
  const isInlineSafe =
    !forceDownload &&
    (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf');

  const safeFilename = file.filename.replace(/["\r\n]/g, '_');

  return new NextResponse(new Uint8Array(file.data), {
    status: 200,
    headers: {
      'Content-Type': file.mimeType || 'application/octet-stream',
      'Content-Disposition': `${isInlineSafe ? 'inline' : 'attachment'}; filename="${safeFilename}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
