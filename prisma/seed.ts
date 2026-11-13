import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Menjalankan reset data database...');

  // Kosongkan seluruh data tabel
  await prisma.pembahasan.deleteMany({});
  await prisma.hasilEkspose.deleteMany({});
  await prisma.wawancara.deleteMany({});
  await prisma.survey.deleteMany({});
  await prisma.peserta.deleteMany({});

  console.log('Database telah bersih dan dikosongkan.');
  console.log('Silakan gunakan tombol "Impor Excel / CSV" di menu Data Peserta untuk memasukkan data evaluasi Anda.');
}

main()
  .catch((e) => {
    console.error('Error reset seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
