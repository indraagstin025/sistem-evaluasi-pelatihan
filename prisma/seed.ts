import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@bpsdm.jabarprov.go.id')
    .trim()
    .toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminBpsdm2026!';
  const adminNama = process.env.SEED_ADMIN_NAME || 'Super Admin BPSDM Jabar';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        nama: adminNama,
        email: adminEmail,
        role: 'SUPER_ADMIN',
        passwordHash: hashPassword(adminPassword),
        mustChangePassword: false,
        aktif: true,
      },
    });
    console.log(`Super Admin dibuat: ${adminEmail}`);
  } else {
    console.log(`Super Admin sudah terdaftar: ${adminEmail}`);
  }

  console.log('Seed selesai. Database bersih dan siap dipakai (buat kegiatan lalu impor 2 file Excel).');
}

main()
  .catch((e) => {
    console.error('Error seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
