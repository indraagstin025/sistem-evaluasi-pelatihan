# Sistem Evaluasi Pasca Pelatihan

Aplikasi web untuk membandingkan hasil survei pasca pelatihan dengan hasil
wawancara, lalu menampilkan ekspose 6 slide (5 grafik + kesimpulan) beserta
pembahasan yang bisa dibuat otomatis dengan AI (Gemini) atau template baku.

Data contoh yang dipakai: PKP Angkatan VII Tahun 2023, Kabupaten Bogor
(30 peserta).

## Cara menjalankan

1. Salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL` (PostgreSQL).
   Isi juga `GEMINI_API_KEY` kalau mau memakai tombol "Buat dengan AI"
   (kalau kosong, pembahasan memakai template — angkanya tetap benar).
2. `npm install`
3. `npx prisma generate`
4. `npx prisma db push` (membuat tabel di database)
5. `npm run dev` lalu buka http://localhost:3000

## Cara memakai

1. Di halaman **Dashboard**, klik **Impor File Excel**.
2. Pilih file **Olah Data** (survei). Kalau ada, pilih juga file **Form
   Penilaian** (wawancara) — nilai Teknik Komunikasi diambil dari sana.
   Kalau Form Penilaian tidak dilampirkan, nilai wawancara dan Total Form
   berstatus KOSONG (bukan nol).
3. Lihat hasilnya di **Daftar Peserta**, **Perbandingan**, dan **Ekspose**.

## Perhitungan (sesuai URD v1.2)

- **L (survei)** = rata-rata 3 butir hasil Aksi Perubahan (skala 1–4) × 25
- **M (wawancara)** = rata-rata 3 nilai wawancara (tanpa bobot)
- **Total Form** = jumlah berbobot 5 kriteria (20/20/20/30/10)
- Rentang: 76–100 optimal, 51–75 baik, 26–50 rendah, 1–25 sangat rendah.
  Skor 1 masuk rentang "1-25".
- Nilai yang kosong tetap **KOSONG** (null), tidak dianggap nol.

## Perintah lain

- `npm run build` — build produksi (`prisma generate` + `next build`)
- `npm run start` — jalankan hasil build
- `npm run seed` — **mengosongkan seluruh data** (dipakai sebelum impor ulang)
- `npm run list-models` — melihat daftar model Gemini yang tersedia
