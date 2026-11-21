import React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { listKegiatanForUser } from '@/lib/queries/kegiatan';
import KegiatanListClient from '@/components/kegiatan/KegiatanListClient';

export const dynamic = 'force-dynamic';

export default async function DaftarKegiatanPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.mustChangePassword) redirect('/ganti-sandi');

  const initialKegiatan = await listKegiatanForUser(user);

  return (
    <KegiatanListClient
      initialKegiatan={initialKegiatan}
      initialRole={user.role}
    />
  );
}
