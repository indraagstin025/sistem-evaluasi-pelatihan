import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getKegiatanDetailForUser } from '@/lib/queries/kegiatan';
import KegiatanRingkasanClient from '@/components/kegiatan/KegiatanRingkasanClient';

export const dynamic = 'force-dynamic';

export default async function KegiatanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.mustChangePassword) redirect('/ganti-sandi');

  if (user.role === 'EVALUATOR') {
    redirect(`/kegiatan/${params.id}/wawancara`);
  }

  const result = await getKegiatanDetailForUser(user, params.id, {
    includePeserta: true,
  });
  if (result.status === 'forbidden') redirect('/kegiatan');
  if (result.status === 'not_found') notFound();

  return (
    <KegiatanRingkasanClient
      kegiatanId={params.id}
      initialData={result.data}
    />
  );
}
