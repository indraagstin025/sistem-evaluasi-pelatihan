-- CreateTable
CREATE TABLE "Peserta" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nip" TEXT,
    "jabatanPelatihan" TEXT,
    "jabatanSaatIni" TEXT,
    "instansi" TEXT,
    "pelatihan" TEXT NOT NULL DEFAULT 'PKP',
    "angkatan" TEXT NOT NULL DEFAULT 'VII',
    "tahun" INTEGER NOT NULL DEFAULT 2023,
    "metode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Peserta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "pesertaId" TEXT NOT NULL,
    "responden" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "jawabanTeks" TEXT,
    "skor" INTEGER,
    "sumber" TEXT NOT NULL DEFAULT 'Jawaban',

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wawancara" (
    "id" TEXT NOT NULL,
    "pesertaId" TEXT NOT NULL,
    "kriteria" TEXT NOT NULL,
    "bobot" INTEGER NOT NULL,
    "nilai" INTEGER,
    "deskripsi" TEXT,
    "sumber" TEXT NOT NULL DEFAULT 'Ekspose',

    CONSTRAINT "Wawancara_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HasilEkspose" (
    "id" TEXT NOT NULL,
    "pesertaId" TEXT NOT NULL,
    "rataSurveiL" DOUBLE PRECISION,
    "rataWawancaraM" DOUBLE PRECISION,
    "totalForm" DOUBLE PRECISION,
    "selisih" DOUBLE PRECISION,
    "rangeSurvei" TEXT,
    "rangeWawancara" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HasilEkspose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pembahasan" (
    "id" TEXT NOT NULL,
    "grafikKey" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "poin1" TEXT NOT NULL,
    "poin2" TEXT NOT NULL,
    "poin3" TEXT NOT NULL,
    "poin4" TEXT NOT NULL,
    "teksLengkap" TEXT NOT NULL,
    "sumber" TEXT NOT NULL DEFAULT 'template',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pembahasan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Survey_pesertaId_responden_kode_key" ON "Survey"("pesertaId", "responden", "kode");

-- CreateIndex
CREATE UNIQUE INDEX "Wawancara_pesertaId_kriteria_key" ON "Wawancara"("pesertaId", "kriteria");

-- CreateIndex
CREATE UNIQUE INDEX "HasilEkspose_pesertaId_key" ON "HasilEkspose"("pesertaId");

-- CreateIndex
CREATE UNIQUE INDEX "Pembahasan_grafikKey_key" ON "Pembahasan"("grafikKey");

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_pesertaId_fkey" FOREIGN KEY ("pesertaId") REFERENCES "Peserta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wawancara" ADD CONSTRAINT "Wawancara_pesertaId_fkey" FOREIGN KEY ("pesertaId") REFERENCES "Peserta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HasilEkspose" ADD CONSTRAINT "HasilEkspose_pesertaId_fkey" FOREIGN KEY ("pesertaId") REFERENCES "Peserta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

