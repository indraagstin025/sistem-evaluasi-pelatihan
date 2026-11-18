import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import KegiatanPerbandinganClient from '@/components/kegiatan/KegiatanPerbandinganClient';

export const dynamic = 'force-dynamic';

export default async function KegiatanPerbandinganPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'SUPER_ADMIN') redirect(`/kegiatan/${params.id}/wawancara`);

  return <KegiatanPerbandinganClient kegiatanId={params.id} />;
}
