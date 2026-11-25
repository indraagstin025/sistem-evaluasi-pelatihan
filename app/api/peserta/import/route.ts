import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { executeExcelImport } from '@/lib/excel-importer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  const guard = await requireSession(['SUPER_ADMIN']);
  if (!guard.ok) return guard.response;

  try {
    const formData = await request.formData();
    const kegiatanId = String(formData.get('kegiatanId') || '').trim();
    if (!kegiatanId) {
      return NextResponse.json(
        { success: false, error: 'Parameter kegiatanId wajib disertakan saat impor.' },
        { status: 400 }
      );
    }

    let file = formData.get('file') as File | null;
    let formFile = formData.get('formFile') as File | null;
    const mode = formData.get('mode') === 'append' ? 'append' : 'replace';

    if (!file && !formFile) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada file yang diunggah.' },
        { status: 400 }
      );
    }

    if (!file && formFile) {
      file = formFile;
      formFile = null;
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File utama tidak ditemukan.' },
        { status: 400 }
      );
    }

    const primaryBuffer = Buffer.from(await file.arrayBuffer());
    const secondaryBuffer = formFile ? Buffer.from(await formFile.arrayBuffer()) : null;

    const result = await executeExcelImport({
      kegiatanId,
      primaryBuffer,
      primaryFilename: file.name,
      secondaryBuffer,
      mode,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/peserta/import', 'Gagal memproses file Excel.');
  }
}
