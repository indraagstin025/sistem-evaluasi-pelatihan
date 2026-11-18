import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import KegiatanEksposeClient from '@/components/kegiatan/KegiatanEksposeClient';

export const dynamic = 'force-dynamic';

export default async function KegiatanEksposePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'SUPER_ADMIN') redirect(`/kegiatan/${params.id}/wawancara`);

  return <KegiatanEksposeClient kegiatanId={params.id} />;
}
