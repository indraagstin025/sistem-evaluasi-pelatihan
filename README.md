# Sistem Evaluasi Pasca Pelatihan (BPSDM Jabar)

Aplikasi web multi-kegiatan dan multi-peran untuk mengelola evaluasi pasca pelatihan (PKP, PKA, dan PKN), menggabungkan impor data survei Alumni dan Atasan, pengumpulan Inovasi/Proper peserta melalui tautan publik, pembagian tim Evaluator, pengisian wawancara, perbandingan L vs M, serta Ekspose 6 slide lengkap dengan pembahasan AI (Google Gemini) dan ekspor PowerPoint (`.pptx`).

## Peran Pengguna

1. **Super Admin** (masuk via Email + Password):
   - Mengelola akun Evaluator (username NIP, sandi awal wajib ganti, reset sandi).
   - Membuat Kegiatan Evaluasi dan mengimpor dua berkas Excel (`Olah Data` & `Form Penilaian`) sekaligus dengan sumber nilai wawancara aktif dari **Form Penilaian** (`IT-01`) dan deteksi selisih antarberkas.
   - Mengelola pembagian tim (sinkron dari kolom tim Excel atau bagi otomatis 10 peserta/tim) serta mengatur tautan meeting tim.
   - Melihat Ringkasan Grafik, Tabel Jawaban 3 Item, Hasil Survei Keseluruhan (5 kelompok kuesioner Alumni vs Atasan), Perbandingan L vs M, dan Ekspose 6 slide (cetak PDF, CSV, unduh `.pptx`, serta pembahasan Gemini AI).
2. **Evaluator** (masuk via NIP + Password):
   - Wajib mengganti sandi awal atau sandi hasil reset di `/ganti-sandi` sebelum mengakses aplikasi.
   - Melihat dan mengisi wawancara khusus peserta pada timnya saja (`IT-07`: angka impor Excel terkunci, hanya kriteria `KOSONG` dan kolom `Hasil wawancara & bukti` yang dapat diisi), lengkap dengan dokumen Proper dan pratinjau foto evidence.
3. **Peserta / Alumni (Link Public tanpa login):**
   - Mengakses `/unggah-inovasi` (atau `/pasca-pelatihan/unggah-inovasi`) dengan alur 3 langkah: Pilih Kegiatan, Verifikasi NIP/NIK, dan Unggah informasi Aksi Perubahan/Proper, foto evidence jangka menengah & panjang, serta dokumen Proper (maks. 3 MB per berkas).

## Cara Menjalankan di Lokal

1. Salin [`.env.example`](.env.example) menjadi `.env`, lalu isi variabel berikut:
   - `DATABASE_URL` (PostgreSQL, misalnya Neon atau PostgreSQL lokal)
   - `AUTH_SECRET` (string acak minimal 32 karakter untuk token sesi cookie)
   - `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` (opsional, untuk akun awal Super Admin)
   - `GEMINI_API_KEY` (opsional, untuk tombol AI di halaman Ekspose; jika kosong, sistem memakai template terverifikasi)
2. Pasang dependensi dan buat skema database:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run seed
   ```
3. Jalankan mode pengembangan atau produksi:
   ```bash
   npm run dev
   # atau build produksi:
   npm run build
   npm run start
   ```

## Rumus Perhitungan Inti (URD Bab 6)

- **L (Survei)** = rata-rata 3 butir Aksi Perubahan Alumni (skala 1 sampai 4) x 25
- **M (Wawancara)** = rata-rata 3 nilai wawancara (Jangka Panjang, Seluruh Tujuan, Manfaat Aksi; tanpa bobot)
- **Total Form** = nilai berbobot 5 kriteria wawancara (20% Jangka Menengah, 20% Jangka Panjang, 20% Seluruh Tujuan, 30% Manfaat, 10% Teknik Komunikasi)
- **Rentang Nilai:** `76-100` (Optimal), `51-75` (Baik), `26-50` (Rendah), `1-25` (Sangat Rendah), `0`.
- Nilai yang belum terisi dicatat jujur sebagai **KOSONG** (`null`), tidak dianggap nol.

## Perintah Tersedia

- `npm run dev` : menjalankan server pengembangan Next.js
- `npm run build` : menghasilkan Prisma Client dan build produksi Next.js
- `npm run start` : menjalankan hasil build produksi
- `npm run seed` : membuat akun awal Super Admin secara idempoten (aman dijalankan ulang)
- `npm run list-models` : menampilkan daftar model Google Gemini yang tersedia
