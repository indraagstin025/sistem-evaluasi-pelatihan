# User Requirements Document (URD) — Sistem Evaluasi Pasca Pelatihan

**Dokumen Kebutuhan Pengguna**

*Ekspos Evaluasi Pasca Pelatihan Kepemimpinan Administrator (PKA), Pelatihan Kepemimpinan Pengawas (PKP), dan Pelatihan Kepemimpinan Nasional (PKN)*

**Badan Pengembangan Sumber Daya Manusia (BPSDM)**

| Keterangan | Isi |
| --- | --- |
| Nama sistem | Sistem Evaluasi Pasca Pelatihan |
| Dokumen | User Requirements Document (URD) — dokumen kebutuhan pengguna dan ruang lingkup sistem |
| Versi / status | 1.2 — Draf untuk diskusi dan persetujuan (belum disahkan) |
| Tanggal | 10 November 2026 |
| Disusun oleh | Indra — peserta Internship 1 di BPSDM |
| Pembimbing eksternal | Samsidin (Pak Samsidin) — BPSDM, pemberi kebutuhan dan data contoh |
| Pembimbing internal | Rd. Nuraini Siti Fathonah, S.S., M.Hum (Bu Nuraini) — kampus |
| Sistem rujukan | Aplikasi web versi v2 dengan Pembahasan AI (berkas sistem-evaluasi-pasca-pelatihan-v2-pembahasan-ai.zip) |

> Cara membaca dokumen ini: sistem ini hanya melakukan TIGA langkah. (1) Menerima dua berkas Excel yang sudah ada sebagai masukan. (2) Membandingkan data survei dan data wawancara dengan rumus, lalu menghasilkan tabel perbandingan dan lima grafik. (3) AI memberikan penjelasan dari hasil perbandingan tersebut. Seluruh isi dokumen disusun mengelilingi tiga langkah itu. Bab 9 menegaskan ruang lingkupnya.

---

## Riwayat versi

| Versi | Tanggal | Perubahan |
| --- | --- | --- |
| 0.1–0.9 | 9 November 2026 | Rancangan kebutuhan selama analisis tiga berkas contoh PKP dan uji coba MVP. |
| 1.0 | 10 November 2026 | URD pertama yang utuh: kebutuhan fungsional, aturan perhitungan, Pembahasan AI, matriks ruang lingkup, dan kriteria penerimaan berdasarkan sistem v2 yang telah terverifikasi. |
| 1.1 | 10 November 2026 | Istilah Level 3 dan Level 4 dihapus dari seluruh dokumen dan diganti bahasa yang menjelaskan langsung apa yang diukur, karena istilah tersebut tidak dipahami pemberi kebutuhan; perhitungan dan isi survei tidak berubah. |
| 1.2 | 10 November 2026 | Disederhanakan atas koreksi penyusun: ruang lingkup ditegaskan hanya tiga langkah (impor dua berkas Excel yang sudah ada, perbandingan survei–wawancara dengan rumus, lima grafik + penjelasan AI dari hasil perbandingan); kebutuhan fungsional dipangkas dari 14 menjadi kebutuhan inti; kedua berkas dinyatakan sebagai prasyarat, bukan keluaran sistem. |

## Daftar isi

- 1 Pendahuluan
- 2 Gambaran umum sistem
- 3 Batasan, asumsi, dan aturan data
- 4 Kebutuhan fungsional
- 5 Kebutuhan data
- 6 Aturan perhitungan
- 7 Penjelasan AI
- 8 Kebutuhan non-fungsional
- 9 Matriks ruang lingkup
- 10 Kriteria penerimaan
- 11 Isu terbuka dan keputusan yang dibutuhkan
- 12 Persetujuan
- Lampiran A Contoh perhitungan lengkap
- Lampiran B Pemetaan kuesioner survei
- Lampiran C Berkas sumber dan rujukan

## 1 Pendahuluan

### 1.1 Latar belakang

Evaluasi pasca pelatihan di BPSDM menilai apakah perilaku peserta berubah setelah pelatihan dan apakah Aksi Perubahan yang dibuat peserta memberikan hasil. Penilaian memakai dua sumber yang berbeda: survei yang diisi alumni dan atasannya, serta wawancara lapangan oleh tim evaluator. Hasil kedua sumber itu kemudian dibandingkan dan disajikan dalam ekspose, yaitu pemaparan hasil evaluasi pada hari kedua, dalam bentuk lima grafik batang beserta pembahasannya.

Selama ini perbandingan tersebut dikerjakan secara manual di Excel dan disalin lagi ke PowerPoint. Cara kerja itu rawan salah salin dan sudah terbukti menimbulkan ketidakcocokan nilai untuk peserta yang sama di antara berkas yang berbeda. Selain itu, rekap pada slide ditulis ulang sebagai teks, sehingga apabila berkas sumber berubah, slide tidak ikut berubah.

Sistem Evaluasi Pasca Pelatihan dibangun untuk mengerjakan perbandingan itu secara otomatis. Pekerjaan yang menjadi tugas sistem hanya perbandingannya: membaca dua berkas yang sudah jadi, menghitungnya dengan rumus yang sama seperti yang selama ini dipakai, menggambar grafiknya, lalu meminta AI menjelaskan hasil perbandingan tersebut.

### 1.2 Tiga langkah sistem

Ruang lingkup sistem ini hanya tiga langkah yang berurutan. Di luar tiga langkah ini, tidak ada pekerjaan lain yang menjadi tugas sistem pada versi ini.

| Langkah | Yang terjadi | Keluaran |
| --- | --- | --- |
| 1 — Masukan | Sistem menerima dua berkas Excel yang sudah ada: (a) Olah Data, berisi jawaban survei; dan (b) Form Penilaian, berisi nilai wawancara. | Data survei dan data wawancara terbaca di dalam sistem. |
| 2 — Perbandingan | Sistem membandingkan data survei dan data wawancara dengan rumus pada Bab 6, lalu menyusun rekap jumlah peserta per rentang nilai. | Tabel perbandingan per peserta (L, M, Total Form, selisih) dan LIMA GRAFIK yang sama dengan slide 5–9 presentasi ekspose. |
| 3 — Penjelasan AI | AI membaca hasil perbandingan pada langkah 2, yaitu angka rekap agregat per grafik, dan menuliskan penjelasannya. | Kalimat Pembahasan empat poin untuk setiap grafik. Alurnya: hasil perbandingan data → AI memberikan penjelasan dari hasil tersebut. |

> Kedua berkas Excel pada langkah 1 SUDAH ADA dan dibuat secara manual di luar sistem, sebelum sistem dipakai. Sistem TIDAK membuat survei, TIDAK membuat wawancara, dan TIDAK membuat kedua berkas itu. Kedua berkas adalah prasyarat yang harus sudah tersedia, bukan keluaran sistem. Penegasan yang sama diulang pada Bab 9.

### 1.3 Tujuan dokumen

- Menyatakan kebutuhan pengguna secara tertulis dan terstruktur, sebelum pengembangan dilanjutkan lebih jauh.
- Menegaskan ruang lingkup sistem yang hanya tiga langkah, termasuk hal yang secara eksplisit tidak termasuk di dalamnya.
- Menjadi acuan bersama antara penyusun, pembimbing eksternal, dan pembimbing internal untuk menilai hasil pengembangan.
- Menjadi dasar kriteria penerimaan pada Bab 10.

### 1.4 Tujuan sistem

- Menghitung perbandingan hasil survei dan wawancara secara otomatis, konsisten, dan dapat ditelusuri kembali ke rumus asalnya di Excel.
- Menghasilkan lima grafik ekspose dan tabel rekap yang sama bentuknya dengan slide ekspose yang selama ini dibuat secara manual.
- Menghasilkan kalimat Pembahasan untuk setiap grafik dengan bantuan AI, dari hasil perbandingan yang sudah dihitung sistem.
- Menandai data yang kosong secara jujur sebagai KOSONG, agar data yang belum ada tidak terbaca sebagai nilai nol.

### 1.5 Definisi dan singkatan

| Istilah | Arti |
| --- | --- |
| PKA | Pelatihan Kepemimpinan Administrator. |
| PKP | Pelatihan Kepemimpinan Pengawas. |
| PKN | Pelatihan Kepemimpinan Nasional. |
| Alumni | Peserta yang telah menyelesaikan pelatihan dan menjadi objek evaluasi pasca pelatihan. |
| Aksi Perubahan (Proper) | Rancangan perubahan yang dibuat peserta selama pelatihan dan dinilai hasilnya pada evaluasi pasca pelatihan. |
| Survei | Kuesioner Survei Pasca Pelatihan yang diisi alumni dan atasan alumni. Survei ini menanyakan perubahan perilaku peserta dan hasil Aksi Perubahan. Jawabannya terkumpul di dalam berkas Olah Data. |
| Wawancara | Penilaian lapangan oleh tim evaluator terhadap Aksi Perubahan, dengan nilai 0 sampai 100. Nilainya terkumpul di dalam berkas Form Penilaian. |
| Ekspose | Pemaparan hasil evaluasi pasca pelatihan, yang keluaran utamanya adalah lima grafik batang dan pembahasannya. |
| L | Nilai rata-rata survei seorang peserta, yaitu rata-rata tiga skor hasil Aksi Perubahan dikali 25 sehingga berskala 0 sampai 100. |
| M | Nilai rata-rata wawancara seorang peserta, yaitu rata-rata tiga nilai wawancara tanpa bobot. |
| Total Form | Nilai akhir pada Form Penilaian, yaitu jumlah berbobot dari lima kriteria wawancara. Nilai ini berbeda dari M. |
| Pembahasan | Kalimat penjelasan untuk sebuah grafik ekspose, terdiri atas empat poin, seperti pada slide ekspose. Pada sistem ini Pembahasan dibuat oleh AI dari hasil perbandingan. |
| KOSONG | Keadaan data yang belum ada. Data kosong tidak dihitung sebagai nol dan tidak masuk rekap. |

## 2 Gambaran umum sistem

### 2.1 Alur kerja sistem

Alur kerja sistem adalah satu garis lurus yang mengikuti tiga langkah pada Bab 1.2. Tidak ada cabang alur lain yang menjadi kebutuhan inti.

- **Langkah 1 — Masukan:** operator memilih berkas Form Penilaian terlebih dahulu (apabila tersedia), kemudian mengimpor berkas Olah Data. Sistem membaca jawaban survei dari Olah Data dan nilai wawancara dari kedua berkas itu.
- **Langkah 2 — Perbandingan:** sistem menghitung L, M, Total Form, dan selisih untuk setiap peserta dengan rumus pada Bab 6, menyusun tabel perbandingan per peserta, lalu menghitung rekap per rentang dan menggambar lima grafik ekspose.
- **Langkah 3 — Penjelasan AI:** untuk setiap grafik, sistem mengirimkan angka rekap hasil perbandingan ke AI; AI mengembalikan kalimat Pembahasan empat poin; sistem memeriksa angka di dalam kalimat itu, lalu menyimpannya agar dapat ditampilkan dan diubah manual.

Hasil akhir yang dipakai pada pemaparan ekspose adalah lima grafik beserta Pembahasannya, yang seluruhnya berasal dari satu perhitungan yang sama.

### 2.2 Pengguna dan pihak yang terlibat

Sistem pada versi ini belum memiliki login dan pembagian hak akses. Hanya ada satu pengguna langsung, yaitu operator yang menjalankan ketiga langkah di atas. Pihak lain adalah sumber data atau pemberi kebutuhan, bukan pengguna sistem.

| Pihak | Kedudukan | Yang dilakukan |
| --- | --- | --- |
| Admin pengelola sistem | Operator sistem (satu-satunya pengguna langsung) | Mengimpor dua berkas, menjalankan perbandingan, meninjau grafik, meminta dan mengubah Pembahasan AI, serta memakai hasil ekspose. |
| Alumni dan atasan alumni | Sumber data survei | Mengisi survei di luar sistem. Jawabannya sampai ke sistem melalui berkas Olah Data, bukan diisi langsung di dalam aplikasi. |
| Tim evaluator | Sumber data wawancara | Melakukan wawancara lapangan di luar sistem dan memberikan nilai 0 sampai 100. Nilainya sampai ke sistem melalui berkas Form Penilaian dan Olah Data. |
| Pembimbing eksternal (Pak Samsidin) | Pemberi kebutuhan | Menentukan kebutuhan, memberikan dua berkas contoh, dan menilai kesesuaian hasil sistem dengan ekspose yang selama ini dibuat. |
| Pembimbing internal (Bu Nuraini) | Pembimbing akademik | Menilai kelayakan dan keistimewaan topik Internship 1 serta kesesuaian dokumentasinya. |

## 3 Batasan, asumsi, dan aturan data

### 3.1 Batasan teknis

| Aspek | Ketentuan pada versi ini |
| --- | --- |
| Tumpukan teknologi | Next.js dengan App Router, TypeScript, Prisma sebagai penghubung basis data, dan Chart.js untuk grafik. Seluruh perhitungan dilakukan di sisi server. |
| Basis data | SQLite untuk pemakaian lokal. Skema basis data dirancang sama untuk PostgreSQL, sehingga perpindahan ke PostgreSQL cukup dilakukan dengan mengganti penyedia basis data dan alamat koneksinya. |
| Lingkungan berjalan | Komputer lokal pengguna, dijalankan dengan perintah npm install, npx prisma generate, lalu npm run dev, dan dibuka melalui http://localhost:3000. Sistem belum dipasang pada server dan belum dapat diakses melalui internet. |
| Autentikasi | Belum ada login, akun pengguna, maupun pembagian peran di dalam aplikasi. |
| Kunci AI | Kunci API Gemini disimpan pada berkas .env setempat sebagai GEMINI_API_KEY. Kunci tidak dimasukkan ke dalam paket kode maupun ke dalam repositori. |

### 3.2 Asumsi

- Kedua berkas masukan sudah dibuat dan sudah terisi sebelum sistem dipakai. Sistem tidak memeriksa kebenaran isi survei atau wawancara, hanya membaca dan membandingkannya.
- Data contoh yang tersedia dan dapat dipakai untuk pengujian adalah data PKP Angkatan VII Tahun 2023 Kabupaten Bogor, 30 peserta, dari berkas yang diberikan pembimbing eksternal.
- Data PKA dan PKN belum tersedia, sehingga belum dapat diimpor maupun diuji (lihat Bab 9.2).
- Apabila untuk peserta yang sama terdapat nilai yang berbeda antarberkas, versi ekspose yang dipakai, karena versi itulah yang cocok dengan slide presentasi. Keputusan akhir mengenai berkas mana yang resmi masih terbuka (lihat Bab 11).

### 3.3 Aturan data dan kerahasiaan

- **Nomor Induk Pegawai (NIP):** menurut keterangan pembimbing eksternal, NIP adalah data publik dan boleh dipakai di dalam sistem dan laporan Internship 1 di BPSDM.
- **Pembatasan tampilan NIP:** NIP hanya ditampilkan pada halaman pengelolaan data peserta. NIP tidak ditampilkan pada halaman Ekspose.
- **Data yang dikirim ke AI:** hanya angka agregat rekap per rentang nilai dari hasil perbandingan. Nama peserta dan NIP tidak dikirim ke layanan AI.
- **Nilai yang disimpan:** setiap nilai wawancara dan survei menyimpan keterangan sumbernya, yaitu Form, Ekspose, atau Jawaban, agar perbedaan antarberkas dapat ditelusuri.

## 4 Kebutuhan fungsional

Kebutuhan inti hanya enam, dan keenamnya mengikuti tiga langkah pada Bab 1.2. Inilah pekerjaan yang menjadi tugas penyusun. Fitur lain yang sudah ada di dalam aplikasi ditulis terpisah pada Bab 4.2 sebagai fitur pendukung, bukan sebagai kebutuhan inti.

### 4.1 Kebutuhan inti

| Nomor | Langkah | Kebutuhan | Status |
| --- | --- | --- | --- |
| UR-F-01 | 1 — Masukan | Sistem mengimpor berkas Excel Olah Data yang sudah ada. Impor membaca jawaban survei peserta beserta jabatan dan instansi peserta. | Terwujud, terverifikasi |
| UR-F-02 | 1 — Masukan | Impor menerima berkas kedua yang bersifat pilihan, yaitu Form Penilaian yang sudah ada, sebagai sumber nilai Teknik Komunikasi yang dibaca dari lembar setiap peserta (sel H33 tiap lembar; nilai totalnya pada J34). Urutan pemakaian yang benar adalah memilih Form Penilaian terlebih dahulu, kemudian mengimpor Olah Data. Apabila Form Penilaian tidak dilampirkan, nilai Teknik Komunikasi harus KOSONG dan Total Form harus KOSONG; sistem tidak boleh mengisi nilai perkiraan. | Terwujud, terverifikasi |
| UR-F-03 | 2 — Perbandingan | Sistem menghitung perbandingan untuk setiap peserta dengan rumus pada Bab 6: L, M, Total Form berbobot, selisih M dikurangi L, dan rentang untuk L dan untuk M. Perhitungan dilakukan di sisi server dan selalu memakai rumus yang sama. | Terwujud, terverifikasi |
| UR-F-04 | 2 — Perbandingan | Sistem menampilkan tabel perbandingan per peserta dengan kolom L, M, Total Form, dan selisih, sebagai keluaran langsung dari perhitungan UR-F-03. | Terwujud, terverifikasi |
| UR-F-05 | 2 — Perbandingan | Sistem menyusun rekap jumlah peserta per rentang nilai dan menampilkan LIMA GRAFIK batang beserta tabel rekapnya, sama dengan slide 5 sampai 9 presentasi ekspose. | Terwujud, terverifikasi |
| UR-F-06 | 3 — Penjelasan AI | Untuk setiap grafik, sistem memberikan hasil perbandingan (angka rekap agregat per rentang, tanpa nama dan tanpa NIP) kepada AI, dan AI mengembalikan kalimat Pembahasan empat poin gaya slide. Hasil AI diverifikasi terhadap empat angka kunci; apabila verifikasi gagal, Pembahasan diisi dari templat. Pembahasan tersimpan dan dapat diubah secara manual. Tersedia pula perintah untuk membuat Pembahasan bagi kelima grafik sekaligus. | Terwujud; jalur templat terverifikasi, pemanggilan AI langsung belum diuji (Bab 7) |

### 4.2 Fitur pendukung yang sudah ada di aplikasi

Fitur-fitur berikut sudah ada di dalam aplikasi versi v2 dan dapat dipakai untuk membantu ketiga langkah di atas, tetapi fitur-fitur ini bukan bagian dari pekerjaan inti dan bukan syarat penerimaan sistem. Menyebutnya di sini hanya agar pembaca tahu fitur itu ada, bukan agar fitur itu dinilai sebagai kebutuhan.

| Fitur pendukung | Kegunaannya | Kedudukan |
| --- | --- | --- |
| Dashboard ringkasan | Menampilkan jumlah peserta, rata-rata L dan M, daftar selisih terbesar, dan peringatan data kosong. | Pendukung — bukan kebutuhan inti |
| Data Peserta (tambah, ubah, hapus manual) | Mengelola daftar peserta secara manual apabila ada perbaikan kecil di luar impor. | Pendukung — bukan kebutuhan inti; bukan pengganti impor berkas |
| Formulir Input Nilai manual | Memasukkan atau memperbaiki nilai survei dan wawancara seorang peserta secara manual, termasuk mengosongkan wawancaranya. | Pendukung — bukan kebutuhan inti; bukan pengganti impor berkas |
| Ekspor CSV dan cetak PDF halaman Ekspose | Membawa grafik dan Pembahasan keluar dari aplikasi untuk dipakai pada pemaparan. | Pendukung — bukan kebutuhan inti |
| Penyimpanan 30 jawaban perubahan perilaku | Jawaban perubahan perilaku ikut tersimpan saat impor, untuk kemungkinan pengembangan berikutnya. | Pendukung — tidak ditampilkan dan tidak dibandingkan pada versi ini |

## 5 Kebutuhan data

Kebutuhan data sistem ini sederhana: dua berkas sebagai masukan, dan tiga hasil hitungan sebagai keluaran. Tidak ada data lain yang menjadi kebutuhan inti.

### 5.1 Dua berkas masukan

| Berkas masukan | Isi yang dibaca sistem |
| --- | --- |
| (a) Olah Data — Olah_Data_Level_3_4_PKP_Bogor_Angk_7_th_2023__29-30_Okt_2025_REV.xlsx | Lembar Jawaban berisi jawaban survei; lembar OlahData berisi rata-rata per pertanyaan perubahan perilaku; lembar ekspose berisi nilai wawancara versi ekspose, skor survei, rentang, serta L dan M. Nama berkas tetap memakai nama aslinya. |
| (b) Form Penilaian — Form_Penilaian_PKP_Angk_VII_th_2023_Bogor__29-30_Okt_2025.xlsx | 30 lembar peserta. Setiap lembar memuat lima nilai wawancara beserta deskripsinya, Nilai Akhir per kriteria, dan Nilai Total. Nilai Teknik Komunikasi dibaca dari berkas ini. |
| Acuan keluaran (bukan masukan) — Presentasi Hari Kedua Evaluasi Pasca Pelatihan Kabupaten Bogor 2025 (.pptx) | Slide 5 sampai 9 adalah bentuk keluaran ekspose yang harus dihasilkan sistem, dan menjadi acuan kebenaran rekap pada Bab 10. |

Kedua berkas masukan dibuat secara manual di luar sistem oleh pihak BPSDM. Sistem hanya membacanya. Apabila salah satu berkas belum ada, langkah 1 tidak dapat dijalankan dan bukan tugas sistem untuk membuatnya.

### 5.2 Tiga hasil hitungan

| Hasil | Isi | Dipakai untuk |
| --- | --- | --- |
| 1. Perbandingan per peserta | Untuk setiap peserta: L, M, Total Form, selisih M dikurangi L, rentang survei, dan rentang wawancara. Selalu dihitung sistem, tidak pernah diketik manual. | Tabel perbandingan pada halaman Perbandingan (UR-F-04). |
| 2. Rekap grafik | Jumlah peserta pada setiap rentang (0, 1–25, 26–50, 51–75, 76–100) untuk survei dan untuk wawancara, untuk kelima grafik. | Lima grafik ekspose (UR-F-05) dan masukan bagi AI (UR-F-06). |
| 3. Pembahasan | Teks empat poin untuk sebuah grafik, beserta cara pembuatannya (AI, templat, atau manual). | Penjelasan yang menyertai setiap grafik pada ekspose. Disimpan agar halaman ekspose tidak perlu memanggil AI setiap kali dibuka. |

Kuesioner survei memuat 47 item bernomor. Hanya tiga item hasil Aksi Perubahan yang dibandingkan dengan wawancara, karena hanya ketiganya yang mempunyai pasangan yang sama persis pada kriteria wawancara: target jangka panjang, seluruh tujuan tercapai, dan manfaat Aksi Perubahan. Pemetaan lengkapnya ada pada Lampiran B.

## 6 Aturan perhitungan

Bab ini adalah aturan langkah 2. Metode yang dipakai adalah metode kuantitatif deskriptif komparatif. Survei pasca pelatihan mengukur dua hal, yaitu perubahan perilaku peserta setelah pelatihan dan hasil Aksi Perubahan yang dibuat peserta. Seluruh perhitungan pada bab ini bersifat deterministik, artinya hasil yang sama selalu diperoleh dari data yang sama, dan tidak bergantung pada AI maupun pada pembelajaran mesin.

### 6.1 Mengubah jawaban survei menjadi angka

Jawaban survei berupa teks diubah menjadi angka dengan skala Likert berikut. Pengubahan ini adalah langkah pertama dari seluruh perhitungan.

| Jawaban teks | Skor |
| --- | ---: |
| Sangat Sesuai | 4 |
| Sesuai | 3 |
| Kurang Sesuai | 2 |
| Tidak Sesuai | 1 |

### 6.2 L, nilai rata-rata survei

L adalah rata-rata tiga skor hasil Aksi Perubahan seorang peserta, dikali 25. Perkalian dengan 25 diperlukan karena skala survei hanya 1 sampai 4, sedangkan skala wawancara 0 sampai 100; tanpa perkalian itu keduanya tidak dapat dibandingkan. Skor 4 menjadi 100, skor 3 menjadi 75, skor 2 menjadi 50, dan skor 1 menjadi 25.

> Rumus:  L = (skor target jangka panjang + skor seluruh tujuan + skor manfaat) / 3 × 25

### 6.3 M, nilai rata-rata wawancara

M adalah rata-rata tiga nilai wawancara yang berpasangan dengan tiga item survei, yaitu jangka panjang, seluruh tujuan, dan manfaat. M dihitung tanpa bobot. Nilai jangka menengah dan nilai Teknik Komunikasi tidak dipakai dalam M, walaupun keduanya tetap disimpan dan dipakai pada Total Form.

> Rumus:  M = (nilai jangka panjang + nilai seluruh tujuan + nilai manfaat) / 3

### 6.4 Total Form, nilai akhir berbobot

Total Form adalah hitungan yang berbeda dari M dan tidak boleh dipertukarkan dengannya. Total Form memakai kelima kriteria wawancara, masing-masing dikali bobotnya, kemudian dijumlahkan. Bobot terbesar adalah manfaat sebesar 30 persen dan bobot terkecil adalah Teknik Komunikasi sebesar 10 persen.

| Kriteria wawancara | Bobot |
| --- | ---: |
| Target jangka menengah | 20% |
| Target jangka panjang | 20% |
| Seluruh tujuan | 20% |
| Manfaat Aksi Perubahan | 30% |
| Teknik Komunikasi | 10% |

> Rumus:  Total Form = (menengah × 20%) + (jangka panjang × 20%) + (seluruh tujuan × 20%) + (manfaat × 30%) + (komunikasi × 10%)

Rata-rata wawancara yang tampil pada ekspose dan pada slide adalah M, bukan Total Form. Keduanya hampir selalu berbeda nilainya, dan perbedaan itu bukan kesalahan.

### 6.5 Selisih dan rentang

Selisih adalah M dikurangi L. Selisih positif berarti evaluator menilai peserta lebih tinggi daripada penilaian peserta atas dirinya sendiri; selisih negatif berarti sebaliknya. Setiap nilai L dan M kemudian dimasukkan ke dalam salah satu dari lima rentang berikut.

| Rentang | Arti |
| --- | --- |
| 0 | Nilai nol persis. |
| 1–25 | Sangat rendah. Skor survei 1 termasuk ke rentang ini. |
| 26–50 | Rendah. |
| 51–75 | Dominan atau menengah ke atas. |
| 76–100 | Optimal atau tinggi. |

> Perbaikan yang wajib dipertahankan: pada rumus rentang di berkas Excel terdapat kekeliruan, cabang terakhirnya tertulis IF(C2=4, "1-25", 0) padahal seharusnya IF(C2=1, "1-25", 0). Akibatnya skor 1 terbaca sebagai 0 dan hilang dari rekap. Sistem menerapkan aturan yang benar, yaitu skor 1 masuk rentang 1–25.

### 6.6 Rekap dan lima grafik ekspose

Setelah L dan M seluruh peserta dihitung, sistem menghitung berapa orang yang masuk ke setiap rentang. Penghitungan jumlah orang per rentang inilah yang menjadi tinggi batang pada grafik. Kelima grafik tersebut adalah:

- Grafik 1 — wawancara target jangka menengah dibandingkan dengan target jangka panjang.
- Grafik 2 — target jangka panjang, survei dibandingkan dengan wawancara.
- Grafik 3 — seluruh tujuan tercapai, survei dibandingkan dengan wawancara.
- Grafik 4 — manfaat Aksi Perubahan, survei dibandingkan dengan wawancara.
- Grafik 5 — keseluruhan, L dibandingkan dengan M.

Rekap acuan untuk data PKP 30 peserta, dengan urutan rentang 0, 1–25, 26–50, 51–75, 76–100, adalah sebagai berikut. Angka ini menjadi acuan penerimaan pada Bab 10.

| Grafik | Survei | Wawancara |
| --- | --- | --- |
| 1 — Menengah / Panjang | — | Menengah [0, 0, 1, 17, 11]; Panjang [0, 0, 1, 18, 10] |
| 2 — Jangka panjang | [0, 0, 5, 19, 6] | [0, 0, 1, 18, 10] |
| 3 — Seluruh tujuan | [0, 0, 4, 20, 6] | [0, 0, 1, 15, 13] |
| 4 — Manfaat | [0, 0, 1, 19, 10] | [0, 0, 1, 13, 15] |
| 5 — Keseluruhan L / M | [0, 0, 1, 17, 12] | [0, 0, 1, 20, 8] |

Jumlah orang pada rekap survei adalah 30, sedangkan pada rekap wawancara adalah 29, karena satu peserta tidak memiliki nilai wawancara. Perbedaan jumlah ini benar dan harus dipertahankan.

### 6.7 Perubahan perilaku, dihitung per pertanyaan

Tiga puluh pertanyaan perubahan perilaku tidak dibandingkan dengan wawancara per orang, karena wawancara tidak menanyakan hal yang sama. Pertanyaan perubahan perilaku menanyakan perubahan sikap dan perilaku, misalnya taat hukum, jujur dan berintegritas, berpikir kreatif, membangun tim, dan literasi digital, sedangkan wawancara menanyakan hasil Aksi Perubahan. Kelompok pertanyaan ini dihitung dengan cara lain, yaitu rata-rata per pertanyaan dari seluruh peserta. Sebagai contoh, untuk pertanyaan sikap bela negara, 18 orang menjawab Sesuai dan 12 orang menjawab Sangat Sesuai, sehingga rata-ratanya adalah (18 × 3 + 12 × 4) / 30 = 3,4. Kelompok ini bukan bagian dari perbandingan inti pada versi ini.

### 6.8 Aturan data kosong

- Nilai yang belum ada dinyatakan KOSONG dan disimpan sebagai nilai kosong pada basis data, bukan sebagai angka nol.
- Peserta yang wawancaranya kosong tidak memiliki M dan tidak memiliki Total Form, tetapi tetap memiliki L apabila surveinya ada.
- Peserta yang datanya kosong tidak dihitung dalam rekap wawancara.
- Sistem tidak boleh mengisi nilai kosong dengan nilai perkiraan, nilai rata-rata peserta lain, atau nilai tetap apa pun.

*Catatan: dalam literatur evaluasi pelatihan, perubahan perilaku dikenal sebagai Level 3 (perilaku) dan hasil Aksi Perubahan dikenal sebagai Level 4 (hasil) dari model Kirkpatrick. Istilah tersebut tidak dipakai di badan dokumen ini agar isinya langsung dipahami dari apa yang diukur.*

## 7 Penjelasan AI

Bab ini adalah aturan langkah 3. Kebutuhan ini berasal dari permintaan pembimbing eksternal agar sistem dilengkapi AI yang membuat ringkasan dari hasil perbandingan kedua data.

> Alur yang berlaku:  HASIL PERBANDINGAN DATA  →  AI MEMBERIKAN PENJELASAN DARI HASIL TERSEBUT.  AI tidak menghitung apa pun dan tidak membaca berkas Excel. Angka tetap dihitung sistem dengan rumus pada Bab 6; yang dibuat AI hanyalah kalimat penjelasannya.

### 7.1 Isi Pembahasan

Pembahasan adalah kalimat penjelasan yang menyertai setiap grafik pada slide ekspose. Setiap Pembahasan terdiri atas empat poin dengan susunan tetap, mengikuti gaya slide ekspose yang selama ini dibuat secara manual:

- **Poin 1 — Konsentrasi penilaian:** menyatakan bahwa penilaian dari kedua sumber terkonsentrasi pada rentang nilai yang tinggi, apabila memang demikian menurut rekap.
- **Poin 2 — Rentang Optimal (76–100):** membandingkan berapa orang yang dinilai survei dan berapa orang yang dinilai wawancara pada rentang tertinggi.
- **Poin 3 — Rentang Dominan (51–75):** membandingkan jumlah orang pada rentang dominan dari kedua sumber.
- **Poin 4 — Rentang Rendah (26–50):** menyebutkan berapa orang yang masih berada pada rentang rendah dari kedua sumber, yaitu peserta yang manfaat Aksi Perubahannya dinilai rendah.

### 7.2 Cara kerja dan pengaman angka

- **Masukan untuk AI:** hanya rekap agregat per rentang dari grafik yang bersangkutan, yaitu keluaran langkah 2. Nama peserta dan NIP tidak dikirim.
- **Model:** Gemini, dengan kunci API yang dibaca dari berkas .env setempat. Tanpa kunci tersebut, tombol AI tidak dapat memanggil layanan dan sistem memakai templat.
- **Verifikasi hasil AI:** teks yang dihasilkan AI diperiksa terhadap empat angka kunci, yaitu jumlah orang pada rentang 76–100 dan 51–75 untuk survei dan untuk wawancara. Keempat angka itu harus muncul di dalam teks.
- **Penggantian otomatis:** apabila satu saja dari empat angka kunci tidak muncul, hasil AI dibuang dan Pembahasan diisi dari templat yang disusun langsung dari angka rekap, sehingga angkanya selalu benar.
- **Penyimpanan:** Pembahasan yang sudah dibuat disimpan, sehingga tidak perlu dibuat ulang setiap halaman dibuka.
- **Perubahan manual:** pengguna dapat mengubah isi Pembahasan dan menyimpannya, dan hasil perubahan itulah yang tampil pada ekspose.

### 7.3 Status pengujian Pembahasan AI

> Jalur templat telah terverifikasi: untuk Grafik 4 (Manfaat), poin yang dihasilkan sama persis dengan slide contoh, yaitu rentang 76–100 wawancara 15 orang berbanding survei 10 orang, rentang 51–75 survei 19 orang berbanding wawancara 13 orang, dan rentang rendah 1 orang pada kedua sumber. Pemanggilan Gemini yang sesungguhnya BELUM diuji, karena memerlukan kunci API milik pengguna yang diisi sendiri pada berkas .env di komputernya. Oleh sebab itu kebutuhan UR-F-06 dinyatakan terwujud dengan catatan, bukan terverifikasi penuh.

## 8 Kebutuhan non-fungsional

Kebutuhan non-fungsional pada versi ini hanya yang menjaga agar ketiga langkah berjalan benar. Ketepatan angka, kejujuran data kosong, dan perlindungan data lebih utama daripada fitur tambahan.

| Nomor | Kebutuhan | Ukuran |
| --- | --- | --- |
| UR-N-01 — Ketepatan | Seluruh hasil hitung harus sama dengan hasil hitung manual dari rumus pada Bab 6 dan sama dengan rekap pada slide ekspose untuk data contoh. | Rekap kelima grafik cocok persis, tanpa selisih satu orang pun (Bab 10). |
| UR-N-02 — Kejujuran data | Data kosong tidak boleh ditampilkan sebagai angka dan tidak boleh diganti dengan perkiraan. | Peserta tanpa wawancara tampil KOSONG dan rekap wawancara berkurang satu orang. |
| UR-N-03 — Perlindungan data pada AI | Layanan AI hanya menerima angka agregat hasil perbandingan. | Tidak ada nama dan tidak ada NIP pada data yang dikirim ke AI. |
| UR-N-04 — Keberlangsungan tanpa AI | Sistem tetap menghasilkan ekspose yang lengkap apabila layanan AI tidak tersedia atau kunci API belum diisi. | Pembahasan diisi dari templat dan tetap dapat diubah manual. |
| UR-N-05 — Keterlacakan | Setiap nilai menyimpan sumbernya, dan setiap hasil hitung dapat ditelusuri ke nilai asalnya. | Keterangan sumber terisi Form, Ekspose, atau Jawaban pada setiap nilai. |

## 9 Matriks ruang lingkup

Bab ini adalah pernyataan ruang lingkup yang mengikat untuk versi ini. Hanya ada tiga kelompok. Sesuatu yang tertulis pada kelompok kedua belum diputuskan, dan sesuatu pada kelompok ketiga bukan pekerjaan sistem ini.

### 9.1 Inti — tiga langkah yang menjadi tugas sistem

| Bagian inti | Keterangan |
| --- | --- |
| Impor dua berkas Excel yang sudah ada | Olah Data (survei) dan Form Penilaian (wawancara), sesuai UR-F-01 dan UR-F-02. |
| Perbandingan survei–wawancara dengan rumus | L, M, Total Form berbobot, selisih, dan rentang, sesuai UR-F-03 dan Bab 6. |
| Tabel perbandingan per peserta | L, M, Total Form, dan selisih untuk seluruh peserta, sesuai UR-F-04. |
| Lima grafik ekspose | Grafik yang sama dengan slide 5 sampai 9, beserta tabel rekapnya, sesuai UR-F-05. |
| Penjelasan AI dari hasil perbandingan | Pembahasan empat poin per grafik, dibuat AI dari angka rekap, diverifikasi, dengan cadangan templat, sesuai UR-F-06 dan Bab 7. |

Fitur pendukung yang sudah ada di aplikasi (Dashboard ringkasan, pengelolaan Data Peserta secara manual, formulir Input Nilai manual, ekspor CSV dan cetak PDF) tidak termasuk kelompok inti ini. Kedudukannya dijelaskan pada Bab 4.2.

> Kedua berkas Excel adalah PRASYARAT yang sudah ada sebelum sistem dipakai. Keduanya bukan keluaran sistem, dan membuatnya bukan tugas sistem. Sistem juga tidak membuat survei dan tidak membuat wawancara; keduanya dilakukan di luar sistem oleh alumni, atasan, dan tim evaluator.

### 9.2 Belum diputuskan — menunggu keputusan

| Hal yang belum diputuskan | Mengapa penting | Yang memutuskan |
| --- | --- | --- |
| Modul pembelajaran mesin berupa pengelompokan (clustering) pola selisih survei dan wawancara | Diusulkan sebagai nilai keistimewaan topik. Selama belum diputuskan, clustering bukan bagian dari sistem. | Bu Nuraini untuk kelayakan akademik; Pak Samsidin untuk kebutuhan teknis |
| Cakupan kuesioner penuh pada antarmuka | Versi ini hanya membandingkan tiga item hasil Aksi Perubahan. Belum diputuskan apakah seluruh 47 item, termasuk 30 item perubahan perilaku, kelompok dukungan, dan kelompok kendala, harus tampil dan diolah. | Pak Samsidin |
| Berkas resmi apabila nilai berbeda antarberkas | Terdapat nilai yang tidak cocok antara Form Penilaian, lembar Jawaban, dan lembar ekspose untuk peserta yang sama. Selama belum diputuskan, sistem mengikuti versi ekspose agar cocok dengan slide. | Pak Samsidin |
| Data PKA dan PKN | Judul topik menyebut tiga pelatihan, tetapi data yang tersedia baru PKP. Selama data PKA dan PKN belum diberikan, sistem hanya teruji pada PKP dan tidak ada pekerjaan persiapan untuk keduanya. | Pak Samsidin |

### 9.3 Di luar ruang lingkup versi ini

- Pembuatan survei dan pembuatan wawancara, termasuk menyusun pertanyaan survei dan melakukan wawancara lapangan.
- Pembuatan kedua berkas Excel (Olah Data dan Form Penilaian). Kedua berkas diterima apa adanya sebagai masukan.
- Login, akun pengguna, dan pembagian hak akses berdasarkan peran, termasuk akun untuk alumni, atasan, dan evaluator.
- Pengisian survei dan pengisian nilai wawancara secara langsung oleh alumni, atasan, atau evaluator di dalam aplikasi.
- Input manual sebagai pengganti berkas. Formulir manual yang sudah ada di aplikasi hanya fitur pendukung untuk perbaikan kecil (Bab 4.2), bukan jalur utama masuknya data.
- Pemasangan sistem pada server, penerbitan ke internet, dan pengaksesan dari luar komputer pengguna (hosting).
- Aplikasi telepon genggam.
- Integrasi dengan sistem lain di BPSDM, termasuk pengiriman data otomatis ke sistem lain.
- Perubahan terhadap kuesioner, kriteria wawancara, bobot, dan rumus yang berlaku. Sistem mengikuti rumus yang sudah berjalan dan tidak menetapkan rumus baru.

## 10 Kriteria penerimaan

Sistem dinyatakan diterima untuk ruang lingkup Bab 9.1 apabila kriteria berikut terpenuhi. Kriteria disusun mengikuti tiga langkah yang sama, agar pemeriksaannya singkat.

| Nomor | Langkah | Kriteria dan hasil yang diharapkan |
| --- | --- | --- |
| KP-01 | 1 — Masukan | Impor dua berkas berhasil: mengimpor Olah Data bersama Form Penilaian memasukkan 30 peserta beserta jabatan dan instansi, dan Total Form cocok dengan Form Penilaian untuk peserta yang nilainya sama antarberkas. Mengimpor tanpa Form Penilaian menghasilkan Total Form KOSONG, bukan nilai perkiraan. |
| KP-02 | 2 — Perbandingan | Contoh perhitungan satu peserta cocok: peserta dengan survei 3, 3, 3 dan wawancara jangka panjang 88, seluruh tujuan 93, manfaat 94 menghasilkan L 75, M 91,67, dan selisih 16,67; dengan nilai menengah 92 dan komunikasi 90, Total Form-nya 91,8. |
| KP-03 | 2 — Perbandingan | Rekap lima grafik cocok persis dengan slide: rekap kelima grafik sama dengan angka pada Bab 6.6 dan dengan slide 5 sampai 9 presentasi ekspose, dengan jumlah wawancara yang valid sebanyak 29 orang dan survei sebanyak 30 orang. |
| KP-04 | 2 — Perbandingan | Data kosong diperlakukan jujur: peserta yang wawancaranya kosong memiliki M dan Total Form KOSONG, tidak dihitung sebagai nol, dan tidak masuk rekap wawancara. Peserta berskor survei 1 masuk rentang 1–25, bukan rentang 0. |
| KP-05 | 3 — Penjelasan AI | Penjelasan menyebut angka rekap yang benar: Pembahasan Grafik 4 menyebut wawancara 15 berbanding survei 10 pada rentang 76–100, survei 19 berbanding wawancara 13 pada rentang 51–75, dan rentang rendah 1 berbanding 1. |
| KP-06 | 3 — Penjelasan AI | Bersyarat: penjelasan yang dibuat langsung oleh AI baru dapat dinilai setelah kunci API Gemini diisi dan pemanggilan langsung diuji. Selama belum diuji, penerimaan langkah 3 didasarkan pada KP-05 melalui jalur templat. |

Data dummy 10 peserta dipakai sebagai bahan uji tambahan untuk KP-02 dan KP-04, agar rumus dapat diperiksa tanpa memakai data asli.

## 11 Isu terbuka dan keputusan yang dibutuhkan

Isu berikut adalah isu yang menghalangi tiga langkah pada Bab 9.1 atau persetujuannya. Isu lain di luar itu tidak dicatat pada versi ini.

| Nomor | Isu | Dampak apabila tidak diputuskan | Penanggung jawab keputusan |
| --- | --- | --- | --- |
| IT-01 | Nilai yang tidak cocok antarberkas untuk peserta yang sama. Contoh yang diketahui: seorang peserta bernilai wawancara 30 pada Form Penilaian tetapi 60 pada lembar ekspose; peserta lain bernilai 95 pada Form Penilaian tetapi 100 pada lembar ekspose; dan nilai manfaat 50 berbanding 60. | Sistem terpaksa mengikuti satu versi tanpa dasar keputusan resmi. Apabila versi yang dipilih kemudian dinyatakan keliru, L, M, Total Form, dan rekap grafik untuk peserta terkait ikut berubah. | Pak Samsidin |
| IT-02 | Data PKA dan PKN belum tersedia. | Judul topik menyebut tiga pelatihan, tetapi sistem hanya teruji pada PKP. | Pak Samsidin |
| IT-03 | Perlu tidaknya modul clustering sebagai keistimewaan topik. | Nilai keistimewaan Internship 1 belum dapat dinyatakan pada laporan, dan Bab 9.2 tidak dapat ditutup. | Bu Nuraini, dengan masukan Pak Samsidin |
| IT-04 | Cakupan kuesioner pada antarmuka: tiga item hasil Aksi Perubahan saja atau seluruh 47 item. | Menentukan besar pekerjaan berikutnya dan isi laporan. | Pak Samsidin |
| IT-05 | Kunci API Gemini belum diisi dan pemanggilan AI langsung belum diuji. | Kebutuhan penjelasan AI hanya terverifikasi pada jalur templat, sehingga belum dapat dinyatakan bekerja penuh. | Indra |
| IT-06 | Persetujuan ruang lingkup pada Bab 9. | Selama belum disetujui, perbedaan tafsir mengenai tiga langkah, PKA/PKN, dan clustering dapat muncul kembali di tengah pengembangan. | Pak Samsidin dan Bu Nuraini |

Tidak ada batas waktu yang ditetapkan di dalam dokumen ini untuk isu-isu di atas. Batas waktu mengikuti jadwal Internship 1 yang berlaku dan keputusan para pembimbing.

## 12 Persetujuan

Dengan menandatangani halaman ini, para pihak menyatakan bahwa kebutuhan dan ruang lingkup pada dokumen ini, khususnya tiga langkah pada Bab 1.2 dan matriks pada Bab 9, telah dibaca dan disetujui sebagai acuan pengembangan Sistem Evaluasi Pasca Pelatihan. Perubahan terhadap ruang lingkup yang sudah disetujui dicatat sebagai versi baru dokumen ini.

| Peran | Nama | Tanda tangan | Tanggal |
| --- | --- | --- | --- |
| Disusun oleh — Peserta Internship 1 | Indra |  |  |
| Pembimbing eksternal — BPSDM | Samsidin |  |  |
| Pembimbing internal — Kampus | Rd. Nuraini Siti Fathonah, S.S., M.Hum |  |  |

Catatan persetujuan: apabila terdapat bagian yang belum disetujui, tuliskan nomor kebutuhan atau nomor isu yang bersangkutan pada catatan di bawah ini, agar perbaikannya dapat ditelusuri.

___________________________________________________________________________

___________________________________________________________________________

___________________________________________________________________________

## Lampiran A Contoh perhitungan lengkap

Contoh ini memakai satu peserta yang datanya lengkap, agar seluruh langkah dapat diperiksa dengan kalkulator biasa. Angka-angka berikut adalah angka yang sama dengan yang dipakai pada kriteria penerimaan KP-02.

### A.1 Data awal

| Sumber | Nilai |
| --- | --- |
| Survei, tiga item hasil Aksi Perubahan | Target jangka panjang: Sesuai (3). Seluruh tujuan: Sesuai (3). Manfaat: Sesuai (3). |
| Wawancara, lima kriteria | Jangka menengah 92, jangka panjang 88, seluruh tujuan 93, manfaat 94, Teknik Komunikasi 90. |

### A.2 Langkah perhitungan

| Langkah | Hitungan | Hasil |
| --- | --- | ---: |
| 1. Skor survei | Sesuai diubah menjadi 3 untuk ketiga item. | 3, 3, 3 |
| 2. L | (3 + 3 + 3) / 3 × 25 = 3 × 25 | 75 |
| 3. M | (88 + 93 + 94) / 3 = 275 / 3 | 91,67 |
| 4. Total Form | 92×20% + 88×20% + 93×20% + 94×30% + 90×10% = 18,4 + 17,6 + 18,6 + 28,2 + 9 | 91,8 |
| 5. Selisih | 91,67 − 75 | 16,67 |
| 6. Rentang | L sebesar 75 masuk rentang 51–75; M sebesar 91,67 masuk rentang 76–100. | 51–75 / 76–100 |

Perhatikan bahwa M sebesar 91,67 dan Total Form sebesar 91,8 adalah dua angka yang berbeda dari hitungan yang berbeda. M hanya memakai tiga nilai tanpa bobot, sedangkan Total Form memakai lima nilai dengan bobot.

### A.3 Contoh selisih negatif

Peserta lain pada data yang sama memperoleh survei sempurna, yaitu 4, 4, 4, sehingga L-nya 100, sedangkan ketiga nilai wawancaranya 60, 60, 60 sehingga M-nya 60. Selisihnya adalah 60 dikurangi 100, yaitu negatif 40, yang berarti evaluator menilai peserta tersebut 40 poin lebih rendah daripada penilaian peserta atas dirinya sendiri. Pola selisih seperti inilah yang menjadi bahan pembahasan utama pada ekspose.

### A.4 Contoh data kosong

Satu peserta pada data contoh memiliki survei dengan L sebesar 83,33 tetapi tidak memiliki nilai wawancara sama sekali. Untuk peserta itu M dan Total Form dinyatakan KOSONG. Peserta tersebut tetap dihitung pada rekap survei sebanyak 30 orang, tetapi tidak dihitung pada rekap wawancara, sehingga jumlah wawancara yang valid adalah 29 orang.

## Lampiran B Pemetaan kuesioner survei

Kuesioner survei memuat 47 item bernomor. Kelompok-kelompoknya adalah sebagai berikut.

| Nomor item | Kelompok | Perlakuan di dalam sistem |
| --- | --- | --- |
| 1–2 | Keterangan jabatan dan metode | Disimpan sebagai keterangan peserta, tidak dihitung. |
| 3–32 | Perubahan perilaku — 30 pertanyaan sikap dan perilaku | Disimpan. Dihitung sebagai rata-rata per pertanyaan dari seluruh peserta. Tidak dibandingkan dengan wawancara. |
| 33–34 | Hasil dan kontribusi pelayanan | Dilaporkan sebagai hasil, tidak dibandingkan dengan wawancara. |
| 35–37 | Hasil Aksi Perubahan — target jangka panjang, seluruh tujuan, manfaat | Dibandingkan dengan wawancara. Ketiga item ini yang membentuk L. |
| 38–42 | Dukungan — 5 pertanyaan | Bahan penjelasan, tidak masuk perhitungan L dan M. |
| 43–46 | Kendala — 4 pertanyaan | Bahan penjelasan, tidak masuk perhitungan L dan M. |

Survei ini mengukur dua hal utama. Pertama, perubahan perilaku, yaitu apakah sikap dan perilaku peserta berubah setelah pelatihan. Kedua, hasil Aksi Perubahan, yaitu apakah Aksi Perubahan berhasil dan bermanfaat. Yang dibandingkan sistem pada versi ini adalah hasil Aksi Perubahan.

## Lampiran C Berkas sumber dan rujukan

| Berkas | Peran |
| --- | --- |
| Form_Penilaian_PKP_Angk_VII_th_2023_Bogor__29-30_Okt_2025.xlsx | Masukan (b): sumber nilai wawancara dan nilai Teknik Komunikasi per peserta. |
| Olah_Data_Level_3_4_PKP_Bogor_Angk_7_th_2023__29-30_Okt_2025_REV.xlsx | Masukan (a): sumber jawaban survei, rata-rata perubahan perilaku, dan lembar ekspose. |
| Presentasi Hari Kedua Evaluasi Pasca Pelatihan Kabupaten Bogor 2025 | Acuan keluaran ekspose pada slide 5 sampai 9. |
| sistem-evaluasi-pasca-pelatihan-v2-pembahasan-ai.zip | Paket kode sistem versi yang dirujuk dokumen ini, sudah termasuk dua berkas Excel asli pada folder data-excel-asli dan perbaikan impor Teknik Komunikasi. |
| data-anonim-pkp-30-peserta-ekspose.csv | Versi anonim 30 peserta untuk dibagikan ke luar BPSDM tanpa nama dan NIP. Rekapnya cocok persis dengan presentasi. |
| uji-dummy-evaluasi-pasca-pelatihan.csv | Data dummy 10 peserta untuk pengujian rumus tanpa memakai data asli. |

Dokumen ini disusun dari berkas-berkas di atas dan dari hasil verifikasi aplikasi yang dilakukan pada 9 dan 10 November 2026. Apabila isi dokumen ini berbeda dengan isi berkas sumber, yang berlaku adalah berkas sumber, dan perbedaannya dicatat sebagai isu baru pada Bab 11.

---

*URD Sistem Evaluasi Pasca Pelatihan • Versi 1.2 — 10 November 2026*
