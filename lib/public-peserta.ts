import { prisma } from './prisma';

export const MAX_PUBLIC_UPLOAD_BYTES = 3 * 1024 * 1024; // 3 MB batas aman serverless Vercel

export const ALLOWED_DOC_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'zip',
  'rar',
]);

export const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

/**
 * Mencocokkan tepat 1 peserta dalam suatu kegiatan berdasarkan NIP/NIK tanpa membuka daftar peserta lain.
 */
export async function findPesertaByKegiatanAndNip(kegiatanId: string, rawNip: string) {
  const trimmed = rawNip.trim();
  const cleanDigits = trimmed.replace(/[^0-9]/g, '');
  if (!kegiatanId || (!trimmed && !cleanDigits) || cleanDigits.length < 6) {
    return null;
  }

  const candidates = await prisma.peserta.findMany({
    where: {
      kegiatanId,
      nip: { not: null },
    },
    include: {
      inovasiProper: true,
    },
  });

  return (
    candidates.find((p) => {
      const pNip = (p.nip || '').trim();
      const pDigits = pNip.replace(/[^0-9]/g, '');
      return pNip === trimmed || (pDigits !== '' && pDigits === cleanDigits);
    }) || null
  );
}
