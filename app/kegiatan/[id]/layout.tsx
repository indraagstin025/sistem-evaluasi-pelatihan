import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { canAccessKegiatan, getSessionUser } from '@/lib/auth';
import KegiatanHeaderNav from '@/components/KegiatanHeaderNav';

export const dynamic = 'force-dynamic';

export default async function KegiatanDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.mustChangePassword) redirect('/ganti-sandi');

  const allowed = await canAccessKegiatan(user, params.id);
  if (!allowed) redirect('/kegiatan');

  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id: params.id },
  });
  if (!kegiatan) notFound();

  return (
    <div className="space-y-6">
      <KegiatanHeaderNav
        kegiatan={{
          id: kegiatan.id,
          nama: kegiatan.nama,
          jenisPelatihan: kegiatan.jenisPelatihan,
          penyelenggara: kegiatan.penyelenggara,
          lokasi: kegiatan.lokasi,
          tanggalMulai: kegiatan.tanggalMulai.toISOString(),
          tanggalSelesai: kegiatan.tanggalSelesai.toISOString(),
        }}
        role={user.role}
      />
      {children}
    </div>
  );
}
