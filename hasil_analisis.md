Laporan Analisis + Perbaikan Bahasa — Sistem Evaluasi Pasca Pelatihan
Tanggal: 14 November 2026
Kode yang dianalisis: perbandingan-survey/ (zip baru dari Indra, ~/workspace/user/files/perbandingan-survey.zip)
Pembanding: versi v2 sebelumnya (perbandingan_survey_wawancara-app/, zip sistem-evaluasi-pasca-pelatihan-v2-pembahasan-ai.zip)
Yang dikerjakan: (1) analisis jujur berbasis kode, (2) perbaikan bahasa tampilan (copy) di app/ dan components/, (3) verifikasi build.
Ringkasan satu kalimat: rumus inti benar dan perbaikan komunikasi v2 masih ada; yang baru adalah antrean AI, halaman Input Nilai, dan dashboard baru — semuanya bekerja, dengan 8 temuan yang perlu diperhatikan (tidak ada yang fatal). Copy sudah dilunakkan: 192 string diubah (200 kemunculan). Build produksi berhasil.

1. Struktur proyek
   perbandingan-survey/
   ├── app/
   │   ├── page.tsx                  Dashboard (ringkasan + impor + reset)
   │   ├── layout.tsx                Layout + Sidebar + Topbar
   │   ├── peserta/page.tsx          Daftar peserta + tambah manual + template Excel
   │   ├── peserta/[id]/page.tsx     Detail peserta + edit nilai + edit profil
   │   ├── input-nilai/page.tsx      Isi nilai survei & wawancara per peserta (BARU)
   │   ├── perbandingan/page.tsx     Grafik selisih M−L + tabel perbandingan
   │   └── ekspose/page.tsx          6 slide (5 grafik + kesimpulan) + pembahasan AI
   ├── app/api/
   │   ├── peserta/route.ts          GET daftar + ringkasan, POST tambah, DELETE hapus semua
   │   ├── peserta/[id]/route.ts     GET/PUT/DELETE peserta
   │   ├── peserta/[id]/survey/route.ts
   │   ├── peserta/[id]/wawancara/route.ts
   │   ├── peserta/import/route.ts   Impor Excel (Olah Data + Form Penilaian opsional)
   │   ├── ekspose/route.ts          Rekap 5 grafik + data peserta
   │   ├── ai/pembahasan/route.ts    GET/POST pembahasan per grafik (BARU)
   │   ├── ai/queue/route.ts         GET status antrean, POST enqueue/cancel (BARU)
   │   └── ai/queue/process/route.ts POST proses 1 job antrean (BARU)
   ├── components/
   │   ├── Sidebar.tsx, Topbar.tsx   (BARU — dulu navigasi ada di layout)
   │   ├── ImportExcelModal.tsx      Modal impor 2 file
   │   └── dashboard/
   │       ├── StatCards.tsx         4 kartu statistik (BARU)
   │       ├── WarningBanner.tsx     Banner data kosong / belum lengkap (BARU)
   │       ├── ChartEksposeOverview.tsx  Ringkasan 5 grafik di dashboard (BARU)
   │       └── BottomCards.tsx       Kelengkapan data + rata-rata + selisih (BARU)
   ├── lib/
   │   ├── hitung.ts                 Rumus L, M, TotalForm, rentang, konversi Likert
   │   ├── ai.ts                     Template pembahasan + Gemini + verifikasi (BARU)
   │   ├── ai-queue.ts               Antrean AiJob: klaim atomik, retry, backoff (BARU)
   │   ├── pembahasan-server.ts      Rekap grafik dari DB + label slide (BARU)
   │   ├── peserta-db.ts             Simpan/hapus batch peserta (BARU)
   │   └── prisma.ts
   ├── prisma/
   │   ├── schema.prisma             Peserta, Survey, Wawancara, HasilEkspose, Pembahasan, AiJob
   │   ├── seed.ts                   Mengosongkan data (permintaan user, bukan bug)
   │   └── migrations/
   │       ├── 0001_init_postgres/   Skema awal PostgreSQL
   │       └── 0002_add_ai_job_queue/ Tabel AiJob
   ├── scripts/
   │   ├── list-gemini-models.ts     Daftar model Gemini yang tersedia (BARU)
   │   └── test-generate.ts          Uji generate pembahasan (BARU)
   ├── public/logo-jabar.png
   ├── urd-sistem-evaluasi-pasca-pelatihan.md   (dokumen URD v1.2, ikut dalam zip)
   ├── package.json                  next 14.2.15, react 18.3.1, prisma 5.21.1, chart.js, xlsx
   └── .env.example, README.md       (DITAMBAHKAN dalam pekerjaan ini — sebelumnya tidak ada)

2. Yang BARU dibanding v2 — dan penilaiannya
   2.1 Antrean AI (lib/ai-queue.ts, app/api/ai/queue/, app/api/ai/queue/process/)
   Fungsi: menggantikan pemanggilan Gemini langsung dari halaman Ekspose. Tombol "Buat Semua dengan AI" memasukkan 6 job (grafik1–5 + kesimpulan) ke tabel AiJob; worker memproses satu per satu.
   Cara kerja (sudah benar):
   Dedup: enqueueAiJobs hanya membuat job bila belum ada job aktif untuk grafik yang sama (lib/ai-queue.ts, fungsi enqueueAiJobs).
   Klaim atomik: claimNextJob memakai updateMany dengan syarat status='queued' dan nextRunAt <= now, maks 3 percobaan klaim — dua worker paralel tidak bisa mengambil job yang sama.
   Job macet: recoverStaleJobs mengembalikan job processing > 90 detik ke queued (maks 3 percobaan).
   Retry: maks 3 percobaan; bila Gemini melempar rate-limit, job dijadwalkan ulang dengan backoff 4 detik × percobaan; cooldown 1,2 detik antar pemanggilan.
   Catatan penting (bukan bug, tapi perlu diketahui): worker-nya digerakkan dari browser — halaman Ekspose mem-poll POST /api/ai/queue/process lewat setTimeout (app/ekspose/page.tsx baris ~104–150). Kalau tab ditutup, pemrosesan berhenti; job yang tersisa tetap queued dan lanjut saat halaman dibuka lagi. Tidak ada worker server/cron.
   2.2 lib/ai.ts — pembahasan AI + template (pengganti lib/pembahasan.ts v2)
   Template deterministik 5 grafik + kesimpulan, gaya persis slide PPT (4 poin: konsentrasi, rentang optimal 76–100, rentang dominan 51–75, rentang rendah 26–50). Angka diambil langsung dari rekap — selalu benar.
   Gemini: model default deep-research-preview-04-2026 (lib/ai.ts:329), fallback gemini-2.5-flash dan gemini-3.5-flash-lite (lib/ai.ts:202–205), timeout 25 detik. Bila tidak ada API key, atau semua model gagal, atau verifikasi gagal → dipakai template.
   Yang dikirim ke Gemini: hanya judul grafik + angka agregat rekap (dataA/dataB = jumlah orang per rentang, survei vs wawancara). Tidak ada nama, NIP, jabatan, atau instansi yang terkirim — dicek di lib/ai.ts (requestAiPembahasan, prompt hanya berisi judul + angka). Sesuai izin data.
   Verifikasi hasil AI: verifikasiHasilAI (lib/ai.ts:152) memeriksa 4 angka kunci (jumlah orang 76–100 dan 51–75, survei & wawancara) harus muncul di teks AI. Bila tidak lolos → template. Pengecualian: untuk kesimpulan verifikasi ini TIDAK dipakai (lib/ai.ts:345 — kesimpulan hanya diformat, tidak dicek angkanya). Lihat temuan R-7.
   GEMINI_API_KEY dibaca dari environment (process.env), tidak ada secret hardcode di kode, tidak ada file .env di dalam zip. .gitignore sudah mengabaikan .env.
   2.3 lib/pembahasan-server.ts
   getRekapGrafikMap() menghitung 5 grafik dari database (bukan dari Excel lagi), dipakai bersama oleh API pembahasan dan worker antrean. Konsisten dengan GET /api/ekspose.
   PEMBAHASAN_KEYS = grafik1–5 + kesimpulan.
   2.4 Halaman Input Nilai (app/input-nilai/)
   Form untuk mengisi nilai survei (3 butir hasil Aksi Perubahan, skor 1–4) dan wawancara (5 kriteria 0–100) per peserta, tanpa impor Excel. Menghitung L, M, TotalForm secara langsung lewat hitungRingkasanNilai (lib/hitung.ts) dan menyimpannya lewat PUT /api/peserta/[id]/wawancara + survey.
   Sudah benar: nilai kosong disimpan sebagai null (bukan 0); komunikasi diambil dari Form Penilaian bila ada.
   2.5 Dashboard baru (components/dashboard/, components/Sidebar.tsx, components/Topbar.tsx)
   Sidebar/Topbar memisahkan navigasi dari layout; StatCards (4 kartu), WarningBanner (peringatan data kosong/belum lengkap), ChartEksposeOverview (ringkasan 5 grafik), BottomCards (kelengkapan, rata-rata, selisih terbesar).
   Statistik dihitung dari /api/peserta + /api/ekspose, konsisten dengan halaman lain.
   2.6 Migrasi 0002_add_ai_job_queue + skema baru
   Tabel AiJob (status, attempts, maxAttempts, modelUsed, lastError, nextRunAt, batchId) dengan index [status, nextRunAt, createdAt] dan [grafikKey, status].
   Model Pembahasan diubah dari v2: dulu grafik + poin (JSON string); sekarang grafikKey + judul + poin1..poin4 + teksLengkap + sumber (template | ai | manual).
   Provider database berubah: v2 SQLite → sekarang PostgreSQL (prisma/schema.prisma). Migrasi 0001_init_postgres adalah skema awal penuh (bukan alter dari v2). Lihat temuan R-9.
   2.7 scripts/list-gemini-models.ts & test-generate.ts
   list-gemini-models.ts: memanggil models.list untuk melihat model Gemini apa saja yang tersedia dengan API key — berguna karena nama model di kode belum tentu benar (lihat R-6).
   test-generate.ts: menguji generate 1 pembahasan lewat testJsonGeneration; fungsi test() (baris 19) tidak pernah dipanggil — kode mati (lihat R-10).
   2.8 Perubahan lain vs v2
   lib/hitung.ts: tambah konversiSkorLikert (teks "Sangat Sesuai"→4 dst, sudah benar) dan hitungRingkasanNilai (fungsi murni untuk dipakai ulang impor + input manual). Tipe parameter dilonggarkan dari number | null menjadi any — kemunduran kecil keamanan tipe (lihat R-8).
   Route impor ditulis ulang ke lib/peserta-db.ts (simpanBatchPesertaDenganDetail): tambah auto-deteksi jenis berkas (getWorkbookType), auto-swap bila file tertukar, dan jalur format tabular (Cari Data / Format Tabel). Perbaikan komunikasi v2 tetap ada (lihat §4).
   Route pembahasan lama (app/api/pembahasan/) diganti app/api/ai/pembahasan/; lib/pembahasan.ts v2 dihapus.

3. Verifikasi rumus (lib/hitung.ts) — 18/18 TES LULUS
   Diuji langsung dengan npx tsx memakai angka nyata dari file (Ade, Sri, Timbul):
   Tes
   Dapat
   Harapan
   Hasil
   Ade L = rata-rata 3,3,3 × 25
   75
   75
   PASS
   Ade M = rata-rata 88,93,94
   91,67
   91,67
   PASS
   Ade TotalForm = 92×20% + 88×20% + 93×20% + 94×30% + 90×10%
   91,8
   91,8
   PASS
   Ade selisih M−L
   16,67
   16,67
   PASS
   Sri L = rata-rata 4,4,4 × 25
   100
   100
   PASS
   Sri M = rata-rata 60,60,60
   60
   60
   PASS
   Rentang 25
   "1-25"
   "1-25"
   PASS
   Rentang 75
   "51-75"
   "51-75"
   PASS
   Rentang 100
   "76-100"
   "76-100"
   PASS
   Rentang null
   "KOSONG"
   "KOSONG"
   PASS
   Timbul M (wawancara kosong)
   null
   null
   PASS
   Timbul TotalForm
   null
   null
   PASS
   Timbul L tetap ada
   83,33
   83,33
   PASS
   Tanpa komunikasi TotalForm
   null
   null
   PASS
   Tanpa komunikasi M tetap ada
   91,67
   91,67
   PASS
   Likert "Sangat Sesuai"
   4
   4
   PASS
   Likert "Tidak Sesuai"
   1
   1
   PASS
   Likert kosong
   null
   null
   PASS
   Kesimpulan: semua rumus benar. Skor 1 masuk rentang "1-25" (bug Excel lama tidak ditiru). Nilai kosong = null/KOSONG, bukan 0.

4. Verifikasi perbaikan komunikasi (v2) — MASIH ADA, TIDAK ADA HARDCODE 85
   grep di seluruh proyek: tidak ada = 85 / hardcode komunikasi = 85 di jalur impor. Angka 85 yang ada hanya nilai contoh di baris template Excel (app/peserta/page.tsx, baris template) — bukan hardcode.
   app/api/peserta/import/route.ts: komunikasi diambil dari Form Penilaian (sel H33 tiap sheet peserta, dengan fallback scan baris "Teknik Komunikasi", nilai di indeks 5 — jebakan kolom kosong XLSX dari v2 tetap ditangani). Bila Form tidak dilampirkan → komunikasi = null → TotalForm = null (terverifikasi lewat tes di §3).
   Satu-satunya kemunculan literal "Level 4" di kode adalah komentar lib/hitung.ts:211 — sudah diperbaiki menjadi "hasil Aksi Perubahan" dalam pekerjaan ini.
   Kode internal L3_01..L3_30 / L4_01..L4_03 masih dipakai sebagai kode data (cocok dengan kolom Excel dan isi database) — ini sengaja dipertahankan supaya data lama tetap bisa dibaca. Yang diubah adalah label yang terlihat pengguna ("Butir 1/2/3", "jawaban perubahan perilaku").

5. Penanganan data kosong (null) — BENAR
   Impor: skor/nilai yang tidak ada disimpan null (lib/peserta-db.ts, konversiSkorLikert mengembalikan null untuk kosong/tidak valid).
   Hitung: hitungRataSurveiL/hitungRataWawancaraM mengembalikan null bila tidak ada nilai valid; hitungTotalForm null bila ada satu kriteria kosong (termasuk komunikasi).
   Tampilan: tentukanRentang(null) = "KOSONG"; rekap wawancara memakai N=29 (Timbul tidak dihitung); grafik menampilkan batang kosong, bukan 0.
   Seed: mengosongkan pembahasan, hasilEkspose, wawancara, survey, peserta — sesuai permintaan user (bukan bug). Lihat R-4 untuk satu kekurangannya.

6. Privasi — TIDAK ADA DATA PRIBADI KE GEMINI
   Dicek di lib/ai.ts dan lib/ai-queue.ts: prompt Gemini hanya berisi judul grafik + angka rekap agregat (jumlah orang per rentang). Nama, NIP, jabatan, dan instansi tidak pernah dimasukkan ke prompt. GEMINI_API_KEY hanya dibaca dari environment.

7. Temuan bug / risiko / hal meragukan
   R-1 (kecil, sudah diperbaiki di copy) — Label tahun salah di Topbar
   components/Topbar.tsx: tertulis "Data PKP - 2026", padahal datanya PKP Angkatan VII 2023. Sudah dikoreksi menjadi "PKP Angkatan VII · 2023" dalam perbaikan copy ini. (Bila memang dimaksud tahun berjalan, beri tahu — akan dikembalikan.)
   R-2 (kecil, sudah diperbaiki di copy) — WarningBanner merujuk tombol yang tidak ada
   components/dashboard/WarningBanner.tsx: teks lama "Gunakan tombol muat dataset atau impor berkas Excel untuk memulai" — tidak ada tombol "muat dataset" di aplikasi. Sudah diubah menjadi "Mulai dengan mengimpor file Excel."
   R-3 (sedang) — Pencocokan komunikasi memakai nama depan saja
   app/api/peserta/import/route.ts:174–177 (cariKomunikasi): komunikasi dari sheet ekspose dicocokkan dengan nama depan saja (nama.split(/[\s,]/)[0]). Bila dua peserta punya nama depan yang sama (mis. dua "Ade"), nilai komunikasi bisa tertukar. Fallback urutan baris juga mengasumsikan urutan sheet sama dengan urutan baris ekspose. Pada data 30 peserta PKP saat ini tidak ada nama depan yang kembar, jadi aman untuk data ini — tapi berisiko bila dipakai untuk pelatihan lain. Saran: cocokkan dengan nama lengkap (atau NIP bila ada).
   R-4 (kecil) — Seed tidak menghapus antrean AI
   prisma/seed.ts:9–13 menghapus pembahasan, hasilEkspose, wawancara, survey, peserta — tapi tidak menghapus AiJob. Setelah reset, job antrean lama tertinggal dan akan diproses terhadap data baru (atau gagal dengan "Data peserta kosong"). Bandingkan: DELETE /api/peserta (lib/peserta-db.ts:135–138) menghapus pembahasan DAN aiJob. Saran: tambahkan await prisma.aiJob.deleteMany({}) di seed.
   R-5 (sedang) — Impor ulang tidak menghapus pembahasan lama
   lib/peserta-db.ts:135 — mode replace di impor memanggil hapusSemuaDataPeserta(false), jadi pembahasan AI dan antrean lama tetap tersimpan setelah data diimpor ulang. Akibatnya pembahasan dengan angka lama bisa tetap tampil sampai pengguna menekan "Buat ulang dengan AI". Saran: panggil dengan true saat impor ulang, atau hapus pembahasan bila datanya berubah.
   R-6 (perlu dicek) — Nama model Gemini belum terverifikasi
   lib/ai.ts:329 model default deep-research-preview-04-2026 dan fallback gemini-3.5-flash-lite (lib/ai.ts:204) adalah nama yang tidak umum dan belum terverifikasi — pemanggilan Gemini sungguhan belum pernah diuji di versi mana pun (butuh API key Indra). Mekanismenya aman: bila model tidak ada, kode mencoba model berikut, lalu jatuh ke template. Tapi percobaan pertama kemungkinan besar gagal dan membuang waktu. Saran: jalankan npm run list-models dengan API key untuk melihat nama model yang benar, lalu perbaiki GEMINI_MODEL/default.
   R-7 (sedang) — Hasil AI untuk kesimpulan TIDAK diverifikasi angkanya
   lib/ai.ts:345 — untuk grafik1–5, teks AI dicek 4 angka kuncinya; untuk kesimpulan, teks AI langsung dipakai tanpa pengecekan angka. Bila Gemini mengarang angka di kesimpulan, tidak ada yang menangkap. Saran: tambahkan verifikasi angka kunci kesimpulan juga, atau tandai jelas sumbernya (sudah ditandai "AI (Gemini)").
   R-8 (kecil) — Tipe parameter rumus dilonggarkan ke any
   lib/hitung.ts:40–42, 56–58 — parameter hitungRataSurveiL/hitungRataWawancaraM/hitungTotalForm memakai any, padahal v2 memakai number | null | undefined. Fungsinya tetap benar (nilai non-angka diabaikan isValidNumber), tapi TypeScript tidak lagi menangkap salah kirim tipe. Saran: kembalikan tipe ketat bila sempat.
   R-9 (perlu diketahui) — Database pindah SQLite → PostgreSQL, tanpa jalur migrasi
   prisma/schema.prisma provider postgresql; migrasi 0001_init_postgres adalah skema awal penuh. Database SQLite v2 tidak bisa dimigrasi otomatis — harus buat database PostgreSQL baru, npx prisma db push, lalu impor ulang kedua file Excel. Ini bukan bug, tapi langkah yang wajib diketahui saat pindah dari v2.
   R-10 (kecil) — Kode mati di script uji
   scripts/test-generate.ts:19 — fungsi test() tidak pernah dipanggil (run() hanya memanggil testJsonGeneration). Tidak berpengaruh ke aplikasi; boleh dihapus.
   R-11 (kecil) — Label sumber komunikasi sedikit menyesatkan
   app/api/peserta/import/route.ts: bila Form Penilaian tidak dilampirkan, sumberKomunikasi diisi 'Ekspose' padahal komunikasinya null (tidak ada sumbernya). Hanya label internal; tidak terlihat pengguna. Saran: isi null/tidak ada sumber bila komunikasi kosong.
   Yang dicek dan TIDAK bermasalah
   Tidak ada secret/API key hardcode di kode; tidak ada file .env di zip; .gitignore mengabaikan .env.
   Tidak ada hardcode komunikasi = 85 (lihat §4).
   Tidak ada nama/NIP yang dikirim ke Gemini (lihat §6).
   Seed yang mengosongkan DB adalah permintaan user, bukan bug.
   Referensi "URD Bab 6.8", "UR-N-02", "KP-05" di kode sudah dicek ke urd-sistem-evaluasi-pasca-pelatihan.md — semuanya memang ada di URD (Bab 6.8 baris 289, UR-N-02 baris 333, KP-05 baris 387). Referensi itu hanya dihapus dari tampilan (pengguna tidak perlu melihat kode persyaratan), bukan karena salah.

8. Perbaikan bahasa tampilan (copy)
   Prinsip: bahasa Indonesia natural dan hangat, seperti aplikasi berbicara dengan penggunanya — bukan seperti laporan resmi. Hanya string tampilan yang diubah; fungsi, rumus, angka, dan alur tidak disentuh. Istilah "perubahan perilaku" dan "hasil Aksi Perubahan" dipertahankan. Nama teknis yang perlu (nama file Excel, nama kolom data) dipertahankan. Pesan yang memuat angka hasil perhitungan tidak diubah.
   Jumlah: 192 string diubah (200 kemunculan) di 15 file.
   Perubahan pola yang berulang:
   "Berkas" → "File" (di semua tampilan; "berkas" terdengar seperti bahasa surat resmi)
   "Database Kosong" → "Belum Ada Data"; "Kosongkan database" → "Hapus semua data"; "Reset Data" → "Hapus Semua Data"
   "Terjadi kesalahan jaringan/koneksi" → "Koneksi bermasalah, silakan coba lagi." / "Coba lagi."
   "berhasil ditambahkan/dihapus/diperbarui/disimpan" → "sudah ditambahkan/dihapus/diperbarui/disimpan"
   "antrian" → "antrean" (ejaan benar); "Generate AI" → "Buat dengan AI"; "Memproses" → "Membuat/Memproses file"
   Referensi internal dihapus dari tampilan: "(UR-N-02)", "(URD Bab 6.8)", "(UR-F-04)", "URD Lampiran A.3", "(L3)", "L4_01/02/03" (jadi "Butir 1/2/3"), "Deviasi" → "Selisih", "Rumus Acuan" → "Cara hitungnya"
   Koreksi fakta (bukan sekadar gaya): Topbar "Data PKP - 2026" → "PKP Angkatan VII · 2023" (lihat R-1)
   Daftar lengkap sebelum → sesudah:
   app/api/peserta/import/route.ts (7)
   Sebelum
   Sesudah
   Tidak ada berkas yang diunggah.
   Tidak ada file yang diunggah.
   Berkas utama tidak ditemukan.
   File utama tidak ditemukan.
   Kedua berkas yang diunggah terdeteksi sebagai Berkas Survei (Olah Data). Silakan unggah salah satu berkas survei saja, atau lampirkan berkas Form Penilaian Wawancara.
   Kedua file yang diunggah terdeteksi sebagai file survei (Olah Data). Unggah satu file survei saja, atau lampirkan Form Penilaian Wawancara.
   Kedua berkas yang diunggah terdeteksi sebagai Form Penilaian Wawancara. Sistem membutuhkan berkas Olah Data Survei sebagai data induk peserta.
   Kedua file yang diunggah terdeteksi sebagai Form Penilaian Wawancara. Masih butuh file Olah Data Survei sebagai data utama peserta.
   Berkas yang diunggah adalah Form Penilaian Wawancara. Sistem membutuhkan berkas Olah Data Survei sebagai berkas data induk peserta.
   File yang diunggah adalah Form Penilaian Wawancara. Masih butuh file Olah Data Survei sebagai data utama peserta.
   Berkas Excel / CSV tidak memiliki sheet yang dapat dibaca.
   File Excel / CSV tidak punya sheet yang bisa dibaca.
   Berhasil mengimpor ${importedCount} data peserta lengkap dengan Jabatan Saat Ini dan Instansi dari file ${file.name}.
   Berhasil mengimpor ${importedCount} peserta beserta jabatan dan instansinya dari file ${file.name}.
   app/ekspose/page.tsx (50)
   Sebelum
   Sesudah
   Menyiapkan Tampilan Slide Presentasi Resmi Ekspose...
   Menyiapkan slide ekspose...
   Mengonfigurasi 6 slide 1:1 sesuai berkas paparan resmi BPSDM
   Menyiapkan 6 slide sesuai format paparan BPSDM
   Format Presentasi Resmi (1:1 Slide PPTX)
   Format slide PPTX (1:1)
   Susunan visual 6 slide presentasi lengkap: 5 grafik batang horizontal dengan kotak pembahasan, diakhiri slide kesimpulan & rekomendasi.
   6 slide lengkap: 5 grafik batang horizontal dengan kotak pembahasan, ditutup slide kesimpulan dan rekomendasi.
   Generate AI Semua Slide
   Buat Semua dengan AI
   Masukkan seluruh slide ke antrian generasi AI secara berurutan
   Buat pembahasan semua slide dengan AI, satu per satu
   Ekspor Rekap CSV
   Unduh Rekap CSV
   Gagal memproses antrian AI.
   Gagal memproses antrean AI.
   Koneksi terganggu saat memproses antrian AI.
   Koneksi bermasalah saat memproses antrean AI.
   Basis Data Saat Ini Kosong (0 Peserta)
   Belum Ada Data (0 Peserta)
   Semua data telah dihapus. Slide ekspose dan pembahasan belum ditampilkan sampai berkas Excel hasil survei/wawancara diimpor.
   Slide ekspose dan pembahasan baru muncul setelah file Excel survei dan wawancara diimpor.
   Buka Menu Impor Excel
   Impor File Excel
   Lompat ke Slide:
   Ke slide:
   Instrumen / Sumber
   Sumber
   Sedang diproses AI...
   AI sedang membuat pembahasan...
   Refresh narasi AI
   Buat ulang dengan AI
   Sunting teks pembahasan
   Ubah teks pembahasan
   AI sedang menganalisis data slide ini...
   AI sedang membaca data slide ini...
   Pembahasan AI belum dibuat untuk slide ini.
   Pembahasan untuk slide ini belum dibuat.
   Generate Pembahasan AI
   Buat Pembahasan dengan AI
   Disunting Manual
   Diubah manual
   Templat Baku (Slide PPT)
   Template (slide PPT)
   Generate AI
   Buat dengan AI
   Generating...
   Membuat...
   Sunting
   Ubah
   Generate kesimpulan & rekomendasi menggunakan AI
   Buat kesimpulan dan rekomendasi dengan AI
   AI sedang menyusun pembahasan kesimpulan...
   AI sedang menyusun kesimpulan...
   AI sedang menyusun rekomendasi strategis...
   AI sedang menyusun rekomendasi...
   Rekomendasi belum dihasilkan oleh AI. Silakan generate agar AI menyusun rekomendasi berdasarkan data peserta aktual.
   Rekomendasi belum dibuat. Buat dengan AI supaya disusun dari data peserta.
   Generate Rekomendasi AI
   Buat Rekomendasi dengan AI
   Tuliskan poin rekomendasi berikutnya pada tiap baris...
   Tulis satu rekomendasi per baris...
   Gagal memasukkan request AI ke antrian
   Gagal memasukkan ke antrean AI
   Gagal menambahkan antrian generasi AI
   Gagal menambahkan ke antrean AI
   Gagal menyimpan suntingan
   Gagal menyimpan perubahan
   Terjadi kesalahan koneksi saat menyimpan
   Koneksi bermasalah saat menyimpan. Coba lagi.
   Antrian AI (${activeJobs.length} aktif)
   AI sedang bekerja (${activeJobs.length} slide)
   AI sedang memproses ${SLIDE_QUEUE_LABELS[activeProcessingJob.grafikKey] \
   \
   activeProcessingJob.grafikKey}${queuedCount > 0 ?  • ${queuedCount} slide menunggu di antrian : ''}
   AI sedang membuat ${SLIDE_QUEUE_LABELS[activeProcessingJob.grafikKey] \
   \
   activeProcessingJob.grafikKey}${queuedCount > 0 ?  • ${queuedCount} slide menunggu : ''}
   Rate limit sementara — menjadwalkan retry ${SLIDE_QUEUE_LABELS[currentStatusJob.grafikKey] \
   \
   currentStatusJob.grafikKey} (percobaan ${currentStatusJob.attempts}/${currentStatusJob.maxAttempts})...
   AI sedang sibuk — mencoba lagi ${SLIDE_QUEUE_LABELS[currentStatusJob.grafikKey] \
   \
   currentStatusJob.grafikKey} (percobaan ${currentStatusJob.attempts}/${currentStatusJob.maxAttempts})...
   Menunggu giliran antrian AI: ${SLIDE_QUEUE_LABELS[currentStatusJob?.grafikKey \
   \
   ''] \
   \
   'slide berikutnya'} (${activeJobs.length} aktif)...
   Menunggu giliran: ${SLIDE_QUEUE_LABELS[currentStatusJob?.grafikKey \
   \
   ''] \
   \
   'slide berikutnya'} (${activeJobs.length} slide)...
   Batalkan Antrian (${queuedCount})
   Batalkan Antrean (${queuedCount})
   Menunggu antrian (#${slideQueue.queuePos})
   Menunggu giliran (ke-${slideQueue.queuePos})
   Rate limit sementara — menjadwalkan retry (${slideQueue.job?.attempts}/${slideQueue.job?.maxAttempts})...
   AI sedang sibuk — mencoba lagi (${slideQueue.job?.attempts}/${slideQueue.job?.maxAttempts})...
   Rate limit sementara — menjadwalkan retry (${kesimpulanQueue.job?.attempts}/${kesimpulanQueue.job?.maxAttempts})...
   AI sedang sibuk — mencoba lagi (${kesimpulanQueue.job?.attempts}/${kesimpulanQueue.job?.maxAttempts})...
   Menunggu antrian (#${kesimpulanQueue.queuePos}) untuk menyusun kesimpulan...
   Menunggu giliran (ke-${kesimpulanQueue.queuePos}) untuk menyusun kesimpulan...
   Menunggu antrian (#${kesimpulanQueue.queuePos}) untuk menyusun rekomendasi...
   Menunggu giliran (ke-${kesimpulanQueue.queuePos}) untuk menyusun rekomendasi...
   Antri #${kesimpulanQueue.queuePos}
   Antrean ke-${kesimpulanQueue.queuePos}
   'Model AI (Gemini)'
   'AI (Gemini)'
   Pembahasan kesimpulan belum dibuat. Klik <strong>Buat dengan AI</strong> untuk menyusun otomatis dari data.
   Pembahasan kesimpulan belum dibuat. Klik <strong>Buat dengan AI</strong> untuk menyusunnya dari data.
   Rekomendasi 2 &amp; 3 (pisahkan tiap poin dengan baris baru):
   Rekomendasi 2 dan 3 (satu poin satu baris):
   Menunggu giliran (ke-${slideQueue.queuePos}) untuk diproses AI...
   Menunggu giliran (ke-${slideQueue.queuePos})...
   app/input-nilai/page.tsx (14)
   Sebelum
   Sesudah
   Input Nilai Evaluasi
   Isi Nilai Evaluasi
   Pencatatan nilai survei hasil Aksi Perubahan (L) dan lima kriteria wawancara evaluator (M & Total Form)
   Isi nilai survei hasil Aksi Perubahan (L) dan lima kriteria wawancara evaluator (M dan Total Form)
   Lihat Semua Peserta
   Lihat Daftar Peserta
   Pilih Peserta Evaluasi:
   Pilih peserta:
   Status Data Wawancara:
   Status wawancara:
   Lengkap Terisi
   Sudah Lengkap
   Terjadi kesalahan saat menyimpan data.
   Koneksi bermasalah saat menyimpan. Coba lagi.
   Skor kuesioner skala 1 sampai 4 (Sangat Sesuai = 4, Sesuai = 3, Kurang Sesuai = 2, Tidak Sesuai = 1)
   Skala 1 sampai 4: Sangat Sesuai = 4, Sesuai = 3, Kurang Sesuai = 2, Tidak Sesuai = 1
   Nilai L (Rata-rata × 25):
   Nilai L (rata-rata × 25):
   Penilaian assessor lapangan terhadap 5 kriteria Aksi Perubahan
   Penilaian evaluator terhadap 5 kriteria hasil Aksi Perubahan
   Nilai 0 - 100 (dari sel H33 Form Penilaian)
   Nilai 0 - 100 (dari Form Penilaian)
   Simpan Nilai Peserta
   Simpan Nilai
   <strong>Rumus Acuan:</strong> Nilai L = Rata-rata 3 butir survei × 25 &nbsp;\
   &nbsp; Nilai M = Rata-rata 3 butir wawancara tanpa bobot &nbsp;\
   &nbsp; Total Form = Jumlah 5 kriteria berbobot (URD Bab 6)
   <strong>Cara hitungnya:</strong> Nilai L = rata-rata 3 butir survei × 25 &nbsp;\
   &nbsp; Nilai M = rata-rata 3 butir wawancara (tanpa bobot) &nbsp;\
   &nbsp; Total Form = jumlah 5 kriteria berbobot
   Data evaluasi untuk "${selectedPeserta?.nama}" berhasil disimpan & dihitung ulang di database.
   Nilai untuk "${selectedPeserta?.nama}" sudah disimpan dan dihitung ulang.
   app/layout.tsx (1)
   Sebelum
   Sesudah
   Dashboard Evaluasi Pasca Pelatihan Kepemimpinan Pengawas (PKP) BPSDM
   Dashboard evaluasi pasca pelatihan PKP di BPSDM
   app/page.tsx (11)
   Sebelum
   Sesudah
   Ringkasan data dan kondisi evaluasi pasca pelatihan PKP Angkatan VII 2023
   Ringkasan hasil evaluasi pasca pelatihan PKP Angkatan VII 2023
   Sumber Data Aktif
   Sumber data
   Database Kosong (Siap Impor Berkas)
   Belum ada data (siap diimpor)
   Memuat data dari database...
   Memuat data...
   Database telah berhasil dikosongkan.
   Semua data sudah dihapus.
   Gagal mengosongkan data
   Gagal menghapus data
   Terjadi kesalahan koneksi
   Koneksi bermasalah, silakan coba lagi.
   Kosongkan database
   Hapus semua data
   Reset Data
   Hapus Semua Data
   PERINGATAN: Kosongkan seluruh data di database?
   Seluruh tabel peserta, survei, dan wawancara akan dibersihkan.
   Hapus semua data?
   Seluruh data peserta, survei, dan wawancara akan ikut terhapus.
   ${data?.ringkasan?.totalPeserta \
   \
   0} Peserta Terdaftar
   ${data?.ringkasan?.totalPeserta \
   \
   0} peserta terdaftar
   app/perbandingan/page.tsx (15)
   Sebelum
   Sesudah
   Langkah 2: Komparasi hasil survei mandiri alumni (L) vs wawancara evaluator (M) per peserta
   Bandingkan hasil survei alumni (L) dengan hasil wawancara evaluator (M) untuk tiap peserta
   Ekspor CSV Perbandingan
   Unduh CSV
   Memuat analisis perbandingan nilai...
   Memuat perbandingan nilai...
   Grafik Deviasi Selisih (Nilai M - Nilai L) Per Peserta (PKP 2023)
   Grafik Selisih Nilai (M − L) per Peserta (PKP 2023)
   0.00 (Titik Seimbang M = L)
   0.00 (seimbang: M = L)
   Arahkan kursor pada batang grafik untuk melihat rincian peserta
   Arahkan kursor ke batang grafik untuk melihat detail peserta
   Peserta dengan Selisih Ekstrem (Bahan Evaluasi Khusus URD Lampiran A.3):
   Peserta dengan Selisih Terbesar:
   Tabel Perbandingan Seluruh Peserta (UR-F-04)
   Tabel Perbandingan Semua Peserta
   Urutkan kolom selisih, nilai survei, atau wawancara untuk menganalisis deviasi
   Klik judul kolom untuk mengurutkan berdasarkan selisih atau nilai
   {countPos} <span className="text-emerald-600 text-lg">Pos</span>
   {countPos} <span className="text-emerald-600 text-lg">Positif</span>
   <span className="text-rose-600 text-lg">Neg</span>
   <span className="text-rose-600 text-lg">Negatif</span>
   <span className="text-amber-600 text-lg">Kos</span>
   <span className="text-amber-600 text-lg">Kosong</span>
   Dari {ringkasan?.totalPeserta} total peserta terdaftar
   Dari {ringkasan?.totalPeserta} peserta
   Evaluator menilai lebih tinggi
   evaluator menilai lebih tinggi
   Alumni menilai mandiri lebih tinggi
   alumni menilai lebih tinggi
   app/peserta/[id]/page.tsx (22)
   Sebelum
   Sesudah
   Memuat profil dan data nilai peserta...
   Memuat data peserta...
   Kembali ke Data Peserta
   Kembali ke Daftar Peserta
   NIP Tidak Tercatat
   NIP belum tercatat
   Kosongkan Wawancara
   Kosongkan Nilai Wawancara
   Kosongkan seluruh nilai wawancara untuk peserta ini? Statusnya akan menjadi KOSONG sesuai aturan URD.
   Kosongkan semua nilai wawancara peserta ini? Statusnya akan jadi KOSONG.
   Ubah Profil Peserta
   Ubah Profil
   Profil peserta berhasil diperbarui.
   Profil peserta sudah diperbarui.
   Gagal memperbarui profil peserta.
   Gagal memperbarui profil. Coba lagi.
   Terjadi kesalahan saat menyimpan profil.
   Koneksi bermasalah saat menyimpan profil. Coba lagi.
   Nilai dan evaluasi peserta berhasil disimpan ke database.
   Nilai peserta sudah disimpan.
   Terjadi kesalahan saat menyimpan data.
   Koneksi bermasalah saat menyimpan. Coba lagi.
   Terjadi kesalahan saat menghapus peserta.
   Koneksi bermasalah saat menghapus peserta. Coba lagi.
   5 Kriteria Berbobot
   5 kriteria berbobot
   Deviasi Persepsi
   Selisih Penilaian
   Penilaian lapangan assessor terhadap 5 kriteria Aksi Perubahan
   Penilaian evaluator terhadap 5 kriteria hasil Aksi Perubahan
   L4_01: Target Jangka Panjang
   Butir 1: Target Jangka Panjang
   L4_02: Seluruh Tujuan Tercapai
   Butir 2: Seluruh Tujuan Tercapai
   L4_03: Manfaat Aksi Perubahan
   Butir 3: Manfaat Aksi Perubahan
   Nilai 0 - 100 (dari sel H33 Form Penilaian)
   Nilai 0 - 100 (dari Form Penilaian)
   Catatan / deskripsi evaluator (opsional)
   Catatan evaluator (boleh dikosongkan)
   {l3Summary.count} butir Perubahan Perilaku (L3) tersimpan • Sumber: {l3Summary.sumber}
   {l3Summary.count} jawaban perubahan perilaku tersimpan • Sumber: {l3Summary.sumber}
   Hapus permanen peserta "${peserta?.nama}" beserta seluruh data nilainya?
   Hapus peserta "${peserta?.nama}" secara permanen beserta semua datanya?
   app/peserta/page.tsx (23)
   Sebelum
   Sesudah
   Data Peserta
   Daftar Peserta
   Daftar {totalAll} peserta evaluasi pasca pelatihan PKP Angkatan VII Tahun 2023 Kabupaten Bogor
   {totalAll} peserta pelatihan PKP Angkatan VII 2023, Kabupaten Bogor
   Unduh format template Excel untuk data evaluasi
   Unduh contoh format Excel
   Gagal menambahkan peserta.
   Gagal menambahkan peserta. Coba lagi.
   Terjadi kesalahan jaringan saat menambah peserta.
   Koneksi bermasalah saat menambah peserta. Coba lagi.
   Hapus peserta "${p.nama}" beserta seluruh data survei dan wawancaranya?
   Hapus peserta "${p.nama}" beserta semua data survei dan wawancaranya?
   Peserta "${p.nama}" berhasil dihapus.
   Peserta "${p.nama}" sudah dihapus.
   Gagal menghapus peserta.
   Gagal menghapus peserta. Coba lagi.
   Terjadi kesalahan jaringan saat menghapus peserta.
   Koneksi bermasalah saat menghapus peserta. Coba lagi.
   Cari nama peserta, NIP, instansi...
   Cari nama, NIP, atau instansi...
   Memuat data peserta dari database...
   Memuat daftar peserta...
   Tidak ada peserta yang cocok dengan pencarian.
   Tidak ada peserta yang cocok.
   Coba gunakan kata kunci lain atau bersihkan filter.
   Coba kata kunci lain atau ubah filternya.
   NIP Tidak Tercatat
   NIP belum tercatat
   Tambah Peserta Manual
   Tambah Peserta
   Nilai awal otomatis KOSONG (URD Bab 6.8)
   Nilainya masih KOSONG sampai diisi.
   Nama lengkap beserta gelar
   Nama lengkap peserta
   18 digit NIP (opsional)
   NIP 18 digit (boleh dikosongkan)
   Instansi / Perangkat Daerah
   Instansi
   Opsional
   Boleh dikosongkan
   Menampilkan {filteredPeserta.length} dari {totalAll} total peserta terdaftar
   Menampilkan {filteredPeserta.length} dari {totalAll} peserta
   {totalValid} Lengkap • {totalEmpty} Data Kosong (UR-N-02)
   {totalValid} lengkap • {totalEmpty} masih kosong
   Peserta "${addForm.nama.trim()}" berhasil ditambahkan dengan nilai awal KOSONG.
   Peserta "${addForm.nama.trim()}" sudah ditambahkan. Nilainya masih KOSONG.
   components/ImportExcelModal.tsx (21)
   Sebelum
   Sesudah
   Impor Berkas Evaluasi (Excel)
   Impor File Excel
   Langkah 1: Masukkan berkas Olah Data dan Form Penilaian
   Siapkan file Olah Data dan Form Penilaian
   Bebas memasukkan 1 atau 2 file (.xlsx, .xls) — sistem otomatis mengenali jenisnya
   Boleh 1 atau 2 file (.xlsx, .xls) — jenis filenya dikenali otomatis
   Berkas Terpilih ({files.length}/2)
   File yang Dipilih ({files.length}/2)
   Survei Alumni (Olah Data)
   Survei (Olah Data)
   Wawancara Assessor
   Wawancara
   Format Belum Dikenali
   Format Belum Dikenal
   Hapus berkas
   Hapus file
   Sistem membutuhkan minimal 1 Berkas Survei (Olah Data) sebagai data induk peserta.
   Minimal perlu 1 file survei (Olah Data) sebagai data utama peserta.
   Berhasil mengimpor Berkas Survei dan Form Penilaian Wawancara.
   File survei dan Form Penilaian Wawancara berhasil diimpor.
   Berhasil mengimpor Berkas Survei (Nilai wawancara dinyatakan KOSONG sesuai aturan URD).
   File survei berhasil diimpor. Nilai wawancara berstatus KOSONG.
   Gagal memproses berkas Excel.
   Gagal memproses file Excel.
   Terjadi kesalahan jaringan saat mengunggah berkas.
   Koneksi bermasalah saat mengunggah file. Coba lagi.
   Mulai Impor & Proses Perbandingan
   Mulai Impor
   Memproses Berkas...
   Memproses file...
   Tarik & lepas file Excel ke sini, atau <span
   Tarik file Excel ke sini, atau <span
   <strong>Kedua berkas terdeteksi sebagai Berkas Survei.</strong> Silakan tentukan berkas mana yang<br>                  ingin dijadikan data survei utama:
   <strong>Kedua file terdeteksi sebagai file survei.</strong> Pilih mana yang<br>                  mau dipakai sebagai data survei utama:
   <strong>Kedua berkas adalah Form Penilaian Wawancara.</strong> Sistem membutuhkan berkas Olah Data<br>                Survei sebagai data induk peserta (Nama, NIP, Instansi). Mohon masukkan berkas Olah Data Survei.
   <strong>Kedua file adalah Form Penilaian Wawancara.</strong> Masih butuh file Olah Data<br>                Survei sebagai data utama peserta (nama, NIP, instansi). Silakan tambahkan file Olah Data Survei.
   <strong>Hanya Berkas Wawancara yang dimasukkan.</strong> Mohon masukkan juga berkas Olah Data Survei<br>                agar daftar peserta dapat dimuat.
   <strong>Baru ada file wawancara.</strong> Tambahkan juga file Olah Data Survei<br>                supaya daftar peserta bisa dimuat.
   <strong>Berkas Form Penilaian Wawancara tidak disertakan.</strong> Sistem tetap dapat memproses nilai<br>                survei (L), namun nilai wawancara (M) dan Total Form secara jujur akan berstatus <strong>KOSONG</strong>.
   <strong>File Form Penilaian Wawancara tidak disertakan.</strong> Nilai survei (L) tetap bisa diproses,<br>                tapi nilai wawancara (M) dan Total Form akan berstatus <strong>KOSONG</strong>.
   <strong>Kedua instrumen lengkap!</strong> Berkas Olah Data Survei dan Form Penilaian Wawancara siap<br>                diproses untuk komparasi nilai L, M, dan Total Form.
   <strong>Kedua file lengkap!</strong> File Olah Data Survei dan Form Penilaian Wawancara siap<br>                diproses untuk membandingkan nilai L, M, dan Total Form.
   components/Sidebar.tsx (1)
   Sebelum
   Sesudah
   Data Peserta
   Daftar Peserta
   components/Topbar.tsx (1)
   Sebelum
   Sesudah
   Data PKP - 2026
   PKP Angkatan VII · 2023
   components/dashboard/BottomCards.tsx (12)
   Sebelum
   Sesudah
   Status Kelengkapan Data
   Kelengkapan Data
   Data kosong (null) diabaikan dari pembagi wawancara sesuai URD Bab 6.8.
   Nilai yang kosong tidak ikut dihitung dalam rata-rata wawancara.
   Rekapitulasi Nilai Rata-rata
   Rata-rata Nilai
   Total Rata-rata Gabungan
   Rata-rata Gabungan
   Belum ada data peserta untuk dihitung.
   Belum ada data untuk dihitung.
   Kategori nilai rata-rata berada pada Rentang Optimal (76–100).
   Rata-rata nilainya masuk rentang optimal (76–100).
   Kategori nilai rata-rata berada pada Rentang Baik (51–75).
   Rata-rata nilainya masuk rentang baik (51–75).
   Kategori nilai rata-rata perlu peningkatan (< 51).
   Rata-rata nilainya masih perlu ditingkatkan (< 51).
   Selisih Deviasi Terbesar
   Selisih Terbesar
   Evaluator > Survei
   Wawancara lebih tinggi
   Survei > Evaluator
   Survei lebih tinggi
   Deviasi persepsi antara pengakuan alumni vs observasi evaluator.
   Perbedaan antara penilaian alumni dan penilaian evaluator.
   components/dashboard/StatCards.tsx (2)
   Sebelum
   Sesudah
   Perlu Peningkatan
   Perlu ditingkatkan
   Belum ada data selisih
   Belum ada selisih
   components/dashboard/WarningBanner.tsx (8)
   Sebelum
   Sesudah
   Database Kosong
   Belum Ada Data
   Belum ada data peserta tersimpan. Gunakan tombol muat dataset atau impor berkas Excel untuk memulai.
   Belum ada data peserta. Mulai dengan mengimpor file Excel.
   Kelola Peserta →
   Lihat Daftar Peserta →
   Status Data Lengkap
   Data Sudah Lengkap
   Seluruh peserta evaluasi memiliki data survei dan wawancara yang lengkap.
   Semua peserta sudah punya data survei dan wawancara yang lengkap.
   Perhatian (UR-N-02)
   Perlu Diperhatikan
   Input Nilai Sekarang →
   Isi Nilainya Sekarang →
   Terdapat {count} peserta dengan nilai wawancara kosong{' '}<br>          {firstP ? (${firstP.nama}) : ''}. Data kosong tidak dihitung nol dan statusnya jujur KOSONG.
   {count} peserta belum punya nilai wawancara{' '}<br>          {firstP ? (${firstP.nama}) : ''}. Nilai yang kosong tetap ditulis KOSONG, bukan dianggap nol.
   lib/ai.ts (3)
   Sebelum
   Sesudah
   Belum ada data peserta yang tersedia pada database.
   Belum ada data peserta.
   Silakan impor berkas Excel hasil survei dan wawancara pada menu Data Peserta.
   Silakan impor file Excel survei dan wawancara dari menu Daftar Peserta.
   Narasi analisis otomatis akan menyesuaikan segera setelah data diimpor.
   Pembahasan akan dibuat otomatis setelah data diimpor.
   lib/hitung.ts (1)
   Sebelum
   Sesudah
   Ambil survei alumni Level 4 (L4_01, L4_02, L4_03)
   Ambil survei alumni hasil Aksi Perubahan (L4_01, L4_02, L4_03)
   Yang sengaja TIDAK diubah:
   Isi template pembahasan AI (lib/ai.ts, generatePembahasanTemplate) — teksnya bergaya slide resmi dan sudah terverifikasi cocok dengan PPT (KP-05); mengubahnya akan merusak kesesuaian dengan slide. Hanya pesan kosongnya yang disesuaikan (menu "Daftar Peserta").
   Pesan error API yang hanya muncul di log server (bukan di tampilan).
   Komentar kode (mis. // Keterlacakan sumber (UR-N-05)) — hanya untuk pengembang.
   Kode data internal L3_01/L4_01 — harus sama dengan kolom Excel dan isi database (lihat §4).

9. Hasil build & smoke test
   Lingkungan uji: VM (tanpa PostgreSQL). npm install memakai --ignore-scripts karena postinstall Prisma gagal lewat proxy (sama seperti v2); Prisma client di-generate lewat mirror lokal dari cache engine (~/.cache/prisma, hash 605197351a3c8bdd595af2d2a9bc3025bca48ea2).
   npm install — berhasil (144 paket).
   Tes rumus lib/hitung.ts — 18/18 PASS (lihat §3).
   npm run build (prisma generate && next build) — berhasil, tanpa error. 8 halaman statis + 9 route API dinamis:
   / (Dashboard), /peserta, /peserta/[id], /input-nilai, /perbandingan, /ekspose
   /api/ai/pembahasan, /api/ai/queue, /api/ai/queue/process, /api/ekspose, /api/peserta, /api/peserta/[id], /api/peserta/[id]/survey, /api/peserta/[id]/wawancara, /api/peserta/import
   Smoke test server produksi (npm run start, port 3100): 5/5 halaman mengembalikan 200 (/, /peserta, /ekspose, /perbandingan, /input-nilai).
   /api/ekspose tanpa database mengembalikan JSON error yang rapi ("Can't reach database server") — wajar di VM ini karena tidak ada PostgreSQL; bukan cacat kode. Di PC Indra (dengan DATABASE_URL yang benar) API akan jalan normal.
   Catatan untuk menjalankan di PC Indra: isi .env dari .env.example (DATABASE_URL PostgreSQL + GEMINI_API_KEY bila mau memakai AI), lalu npm install, npx prisma generate, npx prisma db push, npm run dev. Panduan lengkap ada di README.md yang baru ditambahkan.

10. File tambahan (baru, bukan perubahan kode)
    .env.example — daftar environment variable yang dibutuhkan (DATABASE_URL, GEMINI_API_KEY, GEMINI_MODEL) beserta cara membuat API key. Sebelumnya tidak ada di zip baru (v2 punya).
    README.md — cara menjalankan, cara memakai, ringkasan rumus, daftar perintah. Sebelumnya tidak ada di zip baru (v2 punya).

11. File hasil
    Zip proyek (sudah diperbaiki bahasanya): ~/workspace/goals/internship-1-proposal-drafting/files/perbandingan-survey-analisis-bahasa.zip
    (tanpa node_modules, .next, .env; zip asli ~/workspace/user/files/perbandingan-survey.zip tetap utuh, tidak diubah)
    Laporan ini: ~/workspace/goals/internship-1-proposal-drafting/files/laporan-analisis-bahasa-perbandingan-survey.md
    Folder kerja: ~/workspace/goals/internship-1-proposal-drafting/files/perbandingan-survey-baru/perbandingan-survey/