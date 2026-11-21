import React, { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser, type SessionUser } from '@/lib/auth';
import { getKegiatanDetailForUser } from '@/lib/queries/kegiatan';
import KegiatanRingkasanClient from '@/components/kegiatan/KegiatanRingkasanClient';
import { KegiatanRingkasanSkeleton } from '@/components/ui/page-skeletons';

export const dynamic = 'force-dynamic';

async function KegiatanRingkasanLoader({
  user,
  kegiatanId,
}: {
  user: SessionUser;
  kegiatanId: string;
}) {
  const result = await getKegiatanDetailForUser(user, kegiatanId, {
    includePeserta: true,
  });
  if (result.status === 'forbidden') redirect('/kegiatan');
  if (result.status === 'not_found') notFound();

  return (
    <KegiatanRingkasanClient
      kegiatanId={kegiatanId}
      initialData={result.data}
    />
  );
}

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

  return (
    <Suspense fallback={<KegiatanRingkasanSkeleton />}>
      <KegiatanRingkasanLoader user={user} kegiatanId={params.id} />
    </Suspense>
  );
}
