import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
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

  return <KegiatanRingkasanClient kegiatanId={params.id} />;
}
