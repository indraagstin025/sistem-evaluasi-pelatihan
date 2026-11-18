# User Requirements Document (URD) — Sistem Evaluasi Pasca Pelatihan

**Dokumen Kebutuhan Pengguna**

*Ekspos Evaluasi Pasca Pelatihan Kepemimpinan Administrator (PKA), Pelatihan Kepemimpinan Pengawas (PKP), dan Pelatihan Kepemimpinan Nasional (PKN)*

**Badan Pengembangan Sumber Daya Manusia (BPSDM)**

| Keterangan | Isi |
| --- | --- |
| Nama sistem | Sistem Evaluasi Pasca Pelatihan |
| Dokumen | User Requirements Document (URD) — dokumen kebutuhan pengguna dan ruang lingkup sistem |
| Versi / status | 1.3 — Draf untuk diskusi dan persetujuan (belum disahkan) |
| Tanggal | 17 November 2026 |
| Disusun oleh | Indra — peserta Internship 1 di BPSDM |
| Pembimbing eksternal | Samsidin (Pak Samsidin) — BPSDM, pemberi kebutuhan dan data contoh |
| Pembimbing internal | Rd. Nuraini Siti Fathonah, S.S., M.Hum (Bu Nuraini) — kampus |
| Sistem rujukan | (1) Aplikasi asli yang sudah ada di BPSDM, dijelaskan Pak Samsidin pada 17 November 2026 dan dirujuk lewat Link Public https://integral-bpsdm.jabarprov.go.id/pasca-pelatihan/unggah-inovasi (dicek langsung 17 Nov 2026, isinya cocok dengan penjelasan beliau); (2) aplikasi web versi v2 dengan Pembahasan AI (berkas sistem-evaluasi-pasca-pelatihan-v2-pembahasan-ai.zip) yang memverifikasi perhitungan pada Bab 6 |

> Cara membaca dokumen ini: versi 1.3 ini MEREVISI dan MEMPERLUAS versi 1.2. Versi 1.2 hanya memuat tiga langkah (dua berkas Excel masuk → perbandingan dengan rumus → lima grafik + penjelasan AI) dan menyatakan sistem belum memiliki login. Penjelasan Pak Samsidin pada 17 November 2026 menunjukkan sistem yang sebenarnya SUDAH ADA itu jauh lebih luas: ada autentikasi dan pembagian peran, Super Admin membuat kegiatan, data Excel diimpor lalu peserta dibagi ke tim evaluator, peserta mengunggah Inovasi/Proper lewat Link Public, dan Evaluator mengisi nilai wawancara di dalam aplikasi. Tugas penyusun adalah MEMBUAT ULANG sistem yang sudah ada itu. Ketiga langkah versi 1.2 tetap menjadi inti perhitungan (Bab 6 tidak berubah), tetapi kini ditempatkan di dalam alur aplikasi yang lengkap pada Bab 2.1. Hal yang belum dijelaskan Pak Samsidin TIDAK ditebak-tebak: semuanya ditandai [BELUM DIKONFIRMASI] dan dicatat sebagai isu terbuka pada Bab 11.

---

## Riwayat versi

| Versi | Tanggal | Perubahan |
| --- | --- | --- |
| 0.1–0.9 | 9 November 2026 | Rancangan kebutuhan selama analisis tiga berkas contoh PKP dan uji coba MVP. |
| 1.0 | 10 November 2026 | URD pertama yang utuh: kebutuhan fungsional, aturan perhitungan, Pembahasan AI, matriks ruang lingkup, dan kriteria penerimaan berdasarkan sistem v2 yang telah terverifikasi. |
| 1.1 | 10 November 2026 | Istilah Level 3 dan Level 4 dihapus dari seluruh dokumen dan diganti bahasa yang menjelaskan langsung apa yang diukur, karena istilah tersebut tidak dipahami pemberi kebutuhan; perhitungan dan isi survei tidak berubah. |
| 1.2 | 10 November 2026 | Disederhanakan atas koreksi penyusun: ruang lingkup ditegaskan hanya tiga langkah (impor dua berkas Excel yang sudah ada, perbandingan survei–wawancara dengan rumus, lima grafik + penjelasan AI dari hasil perbandingan); kebutuhan fungsional dipangkas dari 14 menjadi kebutuhan inti; kedua berkas dinyatakan sebagai prasyarat, bukan keluaran sistem. |
| 1.3 | 17 November 2026 | REVISI BERDASARKAN PENJELASAN PAK SAMSIDIN 17 NOVEMBER 2026 TENTANG APLIKASI YANG SUDAH ADA. Ditambahkan: autentikasi dan peran (Super Admin, Evaluator, peserta lewat Link Public); Buat Kegiatan dengan lima isian; Input Data Excel yang tidak boleh diubah setelah diimpor; Pembagian Tim otomatis 10 peserta per evaluator; Link Public Unggah Inovasi/Proper (tiga langkah, dicek langsung); Evaluator mengisi nilai wawancara lewat menu wawancara per pegawai; Pantau Wawancara; Ringkasan Grafik dan Jawaban di dalam Kegiatan; Expose sebagai keseluruhan. Perhitungan Bab 6, rekap grafik, dan Lampiran A–C TIDAK BERUBAH dari v1.2. Hal yang belum dikonfirmasi dicatat jujur sebagai isu terbuka (Bab 11), bukan diisi dengan tebakan. |

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
- Lampiran D Catatan verifikasi 17 November 2026

## 1 Pendahuluan

### 1.1 Latar belakang

Evaluasi pasca pelatihan di BPSDM menilai apakah perilaku peserta berubah setelah pelatihan dan apakah Aksi Perubahan yang dibuat peserta memberikan hasil. Penilaian memakai dua sumber yang berbeda: survei yang diisi alumni dan atasannya, serta wawancara lapangan oleh tim evaluator. Hasil kedua sumber itu kemudian dibandingkan dan disajikan dalam ekspose, yaitu pemaparan hasil evaluasi pada hari kedua, dalam bentuk lima grafik batang beserta pembahasannya.

Selama ini perbandingan tersebut dikerjakan secara manual di Excel dan disalin lagi ke PowerPoint. Cara kerja itu rawan salah salin dan sudah terbukti menimbulkan ketidakcocokan nilai untuk peserta yang sama di antara berkas yang berbeda. Selain itu, rekap pada slide ditulis ulang sebagai teks, sehingga apabila berkas sumber berubah, slide tidak ikut berubah.

Sistem Evaluasi Pasca Pelatihan dibangun untuk mengerjakan perbandingan itu secara otomatis. Pada versi 1.2, pekerjaan sistem dibatasi pada perbandingannya saja. Penjelasan Pak Samsidin pada 17 November 2026 memperjelas bahwa aplikasi yang sudah ada di BPSDM mencakup alur yang lebih panjang: kegiatan dibuat oleh Super Admin, data diimpor dari Excel, peserta dibagi ke tim evaluator, peserta mengunggah dokumen Inovasi/Proper lewat Link Public, Evaluator mengisi nilai wawancara, dan hasilnya dipantau sampai ekspose. Dokumen versi 1.3 ini mendeskripsikan alur lengkap itu sebagai sistem yang harus dibuat ulang, dengan perhitungan versi 1.2 tetap dipertahankan sebagai inti.

### 1.2 Alur sistem dalam satu paragraf

Satu kegiatan berjalan sebagai berikut. Super Admin membuat kegiatan (Nama Kegiatan, Penyelenggara, Lokasi, Tanggal Mulai, Tanggal Selesai), lalu mengimpor dua berkas Excel yang sudah ada (Olah Data dan Form Penilaian); data yang sudah diimpor tidak boleh diubah. Sistem membagi peserta ke tim evaluator, 10 peserta per evaluator. Peserta mengunggah Inovasi/Proper-nya lewat Link Public (pilih kegiatan, verifikasi NIP/NIK, unggah dokumen beserta Judul Inovasi/Proper, Jangka Menengah, Jangka Panjang, dan Kondisi Proper Saat Ini). Evaluator melihat hasil survey dan daftar pegawainya, dan mengisi nilai wawancara lewat menu wawancara di setiap pegawai. Sistem membandingkan survei dan wawancara dengan rumus pada Bab 6, menampilkan Ringkasan Grafik dan Jawaban di dalam kegiatan, memantau wawancara, dan menyajikan semuanya pada Expose, lengkap dengan penjelasan AI per grafik.

### 1.3 Tujuan dokumen

- Menyatakan kebutuhan pengguna secara tertulis dan terstruktur, berdasarkan aplikasi yang sudah ada sebagaimana dijelaskan pemberi kebutuhan pada 17 November 2026.
- Menegaskan ruang lingkup sistem yang harus dibuat ulang, termasuk hal yang secara eksplisit belum dikonfirmasi dan tidak boleh ditebak.
- Menjadi acuan bersama antara penyusun, pembimbing eksternal, dan pembimbing internal untuk menilai hasil pengembangan.
- Menjadi dasar kriteria penerimaan pada Bab 10.

### 1.4 Tujuan sistem

- Menyelenggarakan satu kegiatan evaluasi dari awal (Buat Kegiatan) sampai akhir (Expose) dalam satu aplikasi, dengan peran yang dibedakan.
- Menghitung perbandingan hasil survei dan wawancara secara otomatis, konsisten, dan dapat ditelusuri kembali ke rumus asalnya di Excel.
- Menghasilkan lima grafik ekspose dan tabel rekap yang sama bentuknya dengan slide ekspose yang selama ini dibuat secara manual.
- Menghasilkan kalimat Pembahasan untuk setiap grafik dengan bantuan AI, dari hasil perbandingan yang sudah dihitung sistem.
- Menandai data yang kosong secara jujur sebagai KOSONG, agar data yang belum ada tidak terbaca sebagai nilai nol.
- Menjamin data yang sudah diimpor tidak berubah di dalam sistem.

### 1.5 Definisi dan singkatan

| Istilah | Arti |
| --- | --- |
| PKA | Pelatihan Kepemimpinan Administrator. |
| PKP | Pelatihan Kepemimpinan Pengawas. |
| PKN | Pelatihan Kepemimpinan Nasional. |
| Alumni | Peserta yang telah menyelesaikan pelatihan dan menjadi objek evaluasi pasca pelatihan. |
| Aksi Perubahan (Proper) | Rancangan perubahan yang dibuat peserta selama pelatihan dan dinilai hasilnya pada evaluasi pasca pelatihan. |
| Survei | Kuesioner Survei Pasca Pelatihan yang diisi alumni dan atasan alumni. Survei ini menanyakan perubahan perilaku peserta dan hasil Aksi Perubahan. Jawabannya terkumpul di dalam berkas Olah Data. |
| Wawancara | Penilaian lapangan oleh tim evaluator terhadap Aksi Perubahan, dengan nilai 0 sampai 100. Nilainya terkumpul di dalam berkas Form Penilaian, dan — menurut penjelasan 17 November 2026 — juga diisi Evaluator di dalam aplikasi (lihat Isu IT-07). |
| Ekspose | Pemaparan hasil evaluasi pasca pelatihan, yang keluaran utamanya adalah lima grafik batang dan pembahasannya. Pada aplikasi yang sudah ada, Expose adalah keseluruhan hasil kegiatan. |
| Kegiatan | Satu pelaksanaan evaluasi pasca pelatihan untuk satu pelatihan (misalnya PKP Angkatan VII Tahun 2023 Kabupaten Bogor), yang dibuat Super Admin dan menjadi wadah bagi peserta, data, tim, dan hasilnya. |
| Tim (Pembagian Tim) | Kelompok peserta yang ditugaskan kepada satu evaluator. Satu tim berisi 10 peserta; bila jumlah peserta tidak habis dibagi 10, ada tim yang berisi 11 peserta. |
| L | Nilai rata-rata survei seorang peserta, yaitu rata-rata tiga skor hasil Aksi Perubahan dikali 25 sehingga berskala 0 sampai 100. |
| M | Nilai rata-rata wawancara seorang peserta, yaitu rata-rata tiga nilai wawancara tanpa bobot. |
| Total Form | Nilai akhir pada Form Penilaian, yaitu jumlah berbobot dari lima kriteria wawancara. Nilai ini berbeda dari M. |
| Pembahasan | Kalimat penjelasan untuk sebuah grafik ekspose, terdiri atas empat poin, seperti pada slide ekspose. Pada sistem ini Pembahasan dibuat oleh AI dari hasil perbandingan. |
| KOSONG | Keadaan data yang belum ada. Data kosong tidak dihitung sebagai nol dan tidak masuk rekap. |

## 2 Gambaran umum sistem

### 2.1 Alur kerja sistem

Alur kerja sistem mengikuti urutan berikut. Urutan ini adalah urutan sebagaimana dijelaskan Pak Samsidin pada 17 November 2026; di mana urutan dua langkah belum dijelaskan, hal itu dicatat sebagai isu terbuka, bukan diputuskan sendiri.

| Tahap | Yang terjadi | Pelaku |
| --- | --- | --- |
| 1 — Buat Kegiatan | Super Admin membuat kegiatan baru dengan lima isian (Bab 4, UR-F-08). Kegiatan itu kemudian muncul pada Daftar Kegiatan. | Super Admin |
| 2 — Input Data | Super Admin mengimpor dua berkas Excel yang sudah ada (Olah Data dan Form Penilaian) ke dalam kegiatan. Data yang sudah diimpor TIDAK BOLEH diubah di dalam sistem. | Super Admin |
| 3 — Pembagian Tim | Sistem membagi peserta ke tim evaluator, 10 peserta per evaluator (30 peserta menjadi 3 tim; 31 peserta berarti satu tim berisi 11 orang). | Sistem (otomatis), atas perintah Super Admin |
| 4 — Unggah Inovasi (Link Public) | Peserta membuka Link Public, memilih kegiatan, memverifikasi NIP/NIK, lalu mengunggah dokumen Inovasi/Proper beserta Judul, Jangka Menengah, Jangka Panjang, dan Kondisi Proper Saat Ini. Unggahan ini menjadi bahan awal wawancara dan penilaian peserta. | Peserta (tanpa login, lewat Link Public) |
| 5 — Wawancara dan penilaian | Evaluator melihat hasil survey dan daftar pegawainya, lalu mengisi nilai wawancara lewat menu wawancara di setiap pegawai. | Evaluator |
| 6 — Perbandingan | Sistem membandingkan survei dan wawancara dengan rumus pada Bab 6, menyusun tabel perbandingan per peserta, dan menghitung rekap per rentang untuk lima grafik. Di dalam kegiatan tampil Ringkasan Grafik dan Jawaban. | Sistem (otomatis) |
| 7 — Pantau Wawancara | Super Admin / pengelola memantau wawancara: List Peserta, Link Wawancara Peserta, dan Pembagian Tim. | Super Admin [BELUM DIKONFIRMASI siapa tepatnya yang membuka menu ini] |
| 8 — Expose | Seluruh hasil kegiatan disajikan sebagai Expose — keseluruhan — beserta Pembahasan AI per grafik. | Semua pihak yang berhak melihat, sesuai perannya [BELUM DIKONFIRMASI siapa saja] |

Hasil akhir yang dipakai pada pemaparan ekspose adalah lima grafik beserta Pembahasannya, yang seluruhnya berasal dari satu perhitungan yang sama.

### 2.2 Pengguna dan pihak yang terlibat

Berbeda dengan versi 1.2 yang menyatakan sistem belum memiliki login, aplikasi yang sudah ada MEMILIKI autentikasi dan pembagian peran. Cara login, pembuatan akun, dan pengelolaan kata sandi belum dijelaskan — lihat Isu IT-10.

| Pihak | Kedudukan | Yang dilakukan |
| --- | --- | --- |
| Super Admin | Pengelola kegiatan | Membuat kegiatan; mengimpor dua berkas Excel; menjalankan pembagian tim; memantau wawancara dan hasil kegiatan. |
| Evaluator (tim evaluator / assessor) | Penilai wawancara | Melihat hasil survey dan daftar pegawai yang menjadi tanggung jawabnya; mengisi nilai wawancara lewat menu wawancara di setiap pegawai. |
| Peserta / alumni | Peserta evaluasi | Mengunggah Inovasi/Proper lewat Link Public (pilih kegiatan, verifikasi NIP/NIK, isi Judul dan rencana jangka menengah/panjang, unggah dokumen). Mengisi survei di luar sistem; jawabannya sampai ke sistem melalui berkas Olah Data. |
| Atasan alumni | Sumber data survei | Mengisi survei tentang peserta di luar sistem. Jawabannya sampai ke sistem melalui berkas Olah Data, bukan diisi langsung di dalam aplikasi. |
| Pembimbing eksternal (Pak Samsidin) | Pemberi kebutuhan | Menentukan kebutuhan, memberikan dua berkas contoh, menjelaskan alur aplikasi yang sudah ada, dan menilai kesesuaian hasil sistem dengan ekspose yang selama ini dibuat. |
| Pembimbing internal (Bu Nuraini) | Pembimbing akademik | Menilai kelayakan dan keistimewaan topik Internship 1 serta kesesuaian dokumentasinya. |

Peran "admin pengelola sistem" pada versi 1.2 kini disebut Super Admin, sesuai istilah yang dipakai Pak Samsidin pada 17 November 2026. Apakah ada peran admin lain di samping Super Admin, belum dikonfirmasi.

## 3 Batasan, asumsi, dan aturan data

### 3.1 Batasan teknis

| Aspek | Ketentuan pada versi ini |
| --- | --- |
| Tumpukan teknologi | Untuk perhitungan inti: Next.js dengan App Router, TypeScript, Prisma sebagai penghubung basis data, dan Chart.js untuk grafik (sebagaimana terverifikasi pada sistem v2). Tumpukan teknologi aplikasi asli yang sudah ada di BPSDM belum dijelaskan — pembuatan ulang mengikuti tumpukan yang sudah terverifikasi ini, kecuali diputuskan lain. |
| Basis data | SQLite untuk pemakaian lokal pada sistem v2. Skema basis data dirancang sama untuk PostgreSQL, sehingga perpindahan ke PostgreSQL cukup dilakukan dengan mengganti penyedia basis data dan alamat koneksinya. |
| Lingkungan berjalan | Sistem v2 berjalan di komputer lokal (http://localhost:3000). Aplikasi asli yang sudah ada dapat diakses lewat internet, terbukti dari Link Public https://integral-bpsdm.jabarprov.go.id/pasca-pelatihan/unggah-inovasi yang dapat dibuka. Pemasangan (hosting) sistem hasil pembuatan ulang belum diputuskan — lihat Bab 9.2. |
| Autentikasi | ADA pada aplikasi asli: login dengan pembagian peran (Super Admin dan Evaluator, sekurang-kurangnya). Mekanisme login, pembuatan akun, dan pemulihan akun belum dijelaskan (Isu IT-10). Link Public tidak memerlukan login; verifikasi dilakukan dengan NIP/NIK. |
| Kunci AI | Kunci API Gemini disimpan pada berkas .env setempat sebagai GEMINI_API_KEY. Kunci tidak dimasukkan ke dalam paket kode maupun ke dalam repositori. |

### 3.2 Asumsi

- Kedua berkas masukan sudah dibuat dan sudah terisi sebelum sistem dipakai. Sistem tidak memeriksa kebenaran isi survei atau wawancara, hanya membaca dan membandingkannya.
- Data contoh yang tersedia dan dapat dipakai untuk pengujian adalah data PKP Angkatan VII Tahun 2023 Kabupaten Bogor, 30 peserta, dari berkas yang diberikan pembimbing eksternal.
- Data PKA dan PKN belum tersedia, sehingga belum dapat diimpor maupun diuji (lihat Bab 9.2).
- Apabila untuk peserta yang sama terdapat nilai yang berbeda antarberkas, versi ekspose yang dipakai, karena versi itulah yang cocok dengan slide presentasi. Keputusan akhir mengenai berkas mana yang resmi masih terbuka (lihat Bab 11, IT-01).
- Pembagian tim mengikuti aturan 10 peserta per evaluator; bila jumlah peserta tidak habis dibagi 10, kelebihan peserta menambah isi satu tim (contoh: 31 peserta berarti satu tim berisi 11 orang). Cara kelebihan itu dibagikan apabila kelebihannya lebih dari satu orang belum dijelaskan (Isu IT-11).

### 3.3 Aturan data dan kerahasiaan

- **Nomor Induk Pegawai (NIP):** menurut keterangan pembimbing eksternal, NIP adalah data publik dan boleh dipakai di dalam sistem dan laporan Internship 1 di BPSDM.
- **Pembatasan tampilan NIP:** NIP hanya ditampilkan pada halaman pengelolaan data peserta. NIP tidak ditampilkan pada halaman Ekspose.
- **NIP/NIK pada Link Public:** NIP/NIK hanya digunakan untuk mencocokkan peserta. Nama dan status dokumen muncul otomatis setelah NIP/NIK terverifikasi. Dokumen lama diganti setelah dokumen baru berhasil diunggah.
- **Data yang dikirim ke AI:** hanya angka agregat rekap per rentang nilai dari hasil perbandingan. Nama peserta dan NIP tidak dikirim ke layanan AI.
- **Nilai yang disimpan:** setiap nilai wawancara dan survei menyimpan keterangan sumbernya, yaitu Form, Ekspose, atau Jawaban, agar perbedaan antarberkas dapat ditelusuri.
- **Data impor tidak boleh diubah:** data yang sudah diimpor dari Excel tidak boleh diubah di dalam sistem (penjelasan 17 November 2026). Perbaikan data dilakukan pada berkas Excel sebelum diimpor, bukan di dalam aplikasi. Aturan ini berlaku untuk data impor; hubungannya dengan nilai wawancara yang diisi Evaluator di dalam aplikasi belum dikonfirmasi (Isu IT-07).

## 4 Kebutuhan fungsional

Kebutuhan fungsional versi 1.3 terdiri atas dua kelompok: (A) kebutuhan inti perhitungan yang diwarisi dari versi 1.2 tanpa perubahan (UR-F-01 sampai UR-F-06), dan (B) kebutuhan alur aplikasi yang baru dijelaskan pada 17 November 2026 (UR-F-07 sampai UR-F-17). Keduanya sama-sama menjadi tugas penyusun pada versi ini.

### 4.1 Kebutuhan inti perhitungan (diwarisi dari v1.2, tidak berubah)

| Nomor | Langkah | Kebutuhan | Status |
| --- | --- | --- | --- |
| UR-F-01 | Input Data | Sistem mengimpor berkas Excel Olah Data yang sudah ada. Impor membaca jawaban survei peserta beserta jabatan dan instansi peserta. | Terwujud, terverifikasi (v2) |
| UR-F-02 | Input Data | Impor menerima berkas kedua yang bersifat pilihan, yaitu Form Penilaian yang sudah ada, sebagai sumber nilai Teknik Komunikasi yang dibaca dari lembar setiap peserta (sel H33 tiap lembar; nilai totalnya pada J34). Urutan pemakaian yang benar adalah memilih Form Penilaian terlebih dahulu, kemudian mengimpor Olah Data. Apabila Form Penilaian tidak dilampirkan, nilai Teknik Komunikasi harus KOSONG dan Total Form harus KOSONG; sistem tidak boleh mengisi nilai perkiraan. | Terwujud, terverifikasi (v2) |
| UR-F-03 | Perbandingan | Sistem menghitung perbandingan untuk setiap peserta dengan rumus pada Bab 6: L, M, Total Form berbobot, selisih M dikurangi L, dan rentang untuk L dan untuk M. Perhitungan dilakukan di sisi server dan selalu memakai rumus yang sama. | Terwujud, terverifikasi (v2) |
| UR-F-04 | Perbandingan | Sistem menampilkan tabel perbandingan per peserta dengan kolom L, M, Total Form, dan selisih, sebagai keluaran langsung dari perhitungan UR-F-03. | Terwujud, terverifikasi (v2) |
| UR-F-05 | Perbandingan | Sistem menyusun rekap jumlah peserta per rentang nilai dan menampilkan LIMA GRAFIK batang beserta tabel rekapnya, sama dengan slide 5 sampai 9 presentasi ekspose. | Terwujud, terverifikasi (v2) |
| UR-F-06 | Penjelasan AI | Untuk setiap grafik, sistem memberikan hasil perbandingan (angka rekap agregat per rentang, tanpa nama dan tanpa NIP) kepada AI, dan AI mengembalikan kalimat Pembahasan empat poin gaya slide. Hasil AI diverifikasi terhadap empat angka kunci; apabila verifikasi gagal, Pembahasan diisi dari templat. Pembahasan tersimpan dan dapat diubah secara manual. Tersedia pula perintah untuk membuat Pembahasan bagi kelima grafik sekaligus. | Terwujud; jalur templat terverifikasi, pemanggilan AI langsung belum diuji (Bab 7) |

### 4.2 Kebutuhan alur aplikasi (baru, dari penjelasan 17 November 2026)

| Nomor | Tahap | Kebutuhan | Status |
| --- | --- | --- | --- |
| UR-F-07 | Autentikasi dan peran | Sistem memiliki login dengan pembagian peran, sekurang-kurangnya Super Admin dan Evaluator. Setiap peran hanya dapat membuka menu dan data sesuai perannya (misalnya Evaluator hanya melihat hasil survey dan daftar pegawainya). Mekanisme login dan pembuatan akun belum dikonfirmasi (Isu IT-10). | Baru — perlu dibuat |
| UR-F-08 | Buat Kegiatan | Super Admin membuat kegiatan baru melalui formulir dengan lima isian: Nama Kegiatan, Penyelenggara, Lokasi, Tanggal Mulai, dan Tanggal Selesai. Kegiatan yang dibuat muncul pada Daftar Kegiatan. | Baru — perlu dibuat |
| UR-F-09 | Daftar Kegiatan | Sistem menampilkan Daftar Kegiatan. Isi tiap baris daftar dan tujuan saat satu kegiatan diklik belum dikonfirmasi secara rinci [BELUM DIKONFIRMASI]; yang pasti, dari Daftar Kegiatan pengguna masuk ke dalam kegiatan tersebut (Ringkasan Grafik, Jawaban, dan menu terkait). | Baru — perlu dibuat; rinciannya isu terbuka |
| UR-F-10 | Input Data | Super Admin mengimpor dua berkas Excel yang sudah ada (Olah Data dan Form Penilaian) ke dalam kegiatan yang dipilih. Setelah diimpor, data TIDAK BOLEH diubah di dalam sistem. | Baru sebagai alur kegiatan — impornya terwujud (UR-F-01/02); aturan tidak-boleh-diubah perlu ditegakkan |
| UR-F-11 | Pembagian Tim | Setelah data diimpor, sistem membagi peserta ke tim evaluator: 10 peserta per evaluator. Contoh yang dijelaskan: 30 peserta menjadi 3 tim berisi 10 orang; 31 peserta berarti ada tim yang berisi 11 orang. | Baru — perlu dibuat |
| UR-F-12 | Link Public — Unggah Inovasi/Proper | Peserta tanpa login dapat membuka Link Public https://integral-bpsdm.jabarprov.go.id/pasca-pelatihan/unggah-inovasi dan menyelesaikan tiga langkah: (1) Pilih Kegiatan — memilih Nama pelatihan/kegiatan; (2) Verifikasi Peserta — memasukkan NIP/NIK, lalu nama dan status dokumen muncul otomatis setelah terverifikasi; (3) Unggah Dokumen — mengunggah dokumen Inovasi/Proper (PDF, Word, PowerPoint, Excel, ZIP, atau RAR, maksimal 100 MB). Formulir Informasi Inovasi/Proper berisi: Judul Inovasi/Proper; Jangka Menengah (Milestone/Rencana Jangka Menengah dan Evidence Jangka Menengah dengan status Sudah Dilaksanakan / Belum Dilaksanakan — foto hanya diperlukan jika sudah dilaksanakan); Jangka Panjang (bentuk yang sama); Kondisi Proper Saat Ini (penjelasan kondisi terbaru). Dokumen lama diganti setelah dokumen baru berhasil diunggah. | Baru — perlu dibuat ulang; isi halaman terverifikasi langsung 17 Nov 2026 |
| UR-F-13 | Wawancara — Evaluator mengisi nilai | Evaluator melihat hasil survey dan daftar pegawai yang menjadi tanggung jawabnya, dan MENGISI NILAI wawancara lewat menu wawancara yang ada di setiap pegawai. (Koreksi atas catatan awal 17 Nov 09:02 yang menyebut Evaluator "hanya melihat": menurut penjelasan lanjutan 09:26, Evaluator juga mengisi nilainya.) Nilai yang diisi adalah nilai wawancara 0–100 per kriteria. **Klarifikasi 17 Nov 09:47–09:48 (Indra): form wawancara ini berdasarkan Form Penilaian — lima kriteria pada Bab 5.1 — dan nilainya SUDAH TERISI dari Data Excel, bukan form kosong.** Apakah Evaluator boleh mengubah nilai yang sudah terisi itu masih bagian dari Isu IT-07. **Alur yang dikonfirmasi Indra 18 Nov 09:25 dari tangkapan layar: peserta mengisi evidence dulu lewat Link Public (UR-F-12), lalu Evaluator melihat evidence itu di form wawancara ("Data Jangka Menengah dari peserta" beserta status evidence dan "Lihat foto evidence") dan mengisi Nilai wawancara serta "Hasil wawancara & bukti".** | Baru — perlu dibuat |
| UR-F-14 | Pantau Wawancara | Sistem menyediakan menu Pantau Wawancara yang berisi: List Peserta, Link Wawancara Peserta, dan Pembagian Tim. Cara Link Wawancara Peserta dibuat dan dibagikan — satu link per peserta atau satu link untuk semua — belum dikonfirmasi (Isu IT-08). | Baru — perlu dibuat; sebagian rinciannya isu terbuka |
| UR-F-15 | Di dalam Kegiatan — Ringkasan Grafik dan Jawaban | Di dalam satu kegiatan, sistem menampilkan Ringkasan Grafik dan Jawaban. Grafik apa saja yang muncul pada Ringkasan Grafik dan jawaban siapa yang tampil pada Jawaban belum dikonfirmasi secara rinci [BELUM DIKONFIRMASI]; yang pasti, keduanya berada di dalam kegiatan dan bersumber dari data kegiatan itu. | Baru — perlu dibuat; rinciannya isu terbuka |
| UR-F-16 | Hasil Survey keseluruhan | Sistem menampilkan Hasil Survey keseluruhan untuk satu kegiatan. "Dijadikan apa" hasil ini — grafik, laporan, atau bahan Expose — belum dikonfirmasi (catatan 16 Nov yang terpotong, belum terjawab pada 17 Nov). Kebutuhan ini dicatat agar tidak hilang, dengan status menunggu konfirmasi. | Baru — menunggu konfirmasi (Isu IT-09) |
| UR-F-17 | Expose | Sistem menyajikan Expose sebagai keseluruhan hasil kegiatan — seluruh hasil survey, wawancara, grafik, dan pembahasan dalam satu sajian akhir. Siapa yang dapat melihat Expose dan kapan ditampilkan belum dikonfirmasi [BELUM DIKONFIRMASI]. | Baru — perlu dibuat; rinciannya isu terbuka |

### 4.3 Fitur pendukung yang sudah ada di aplikasi v2

Fitur-fitur berikut sudah ada di dalam aplikasi versi v2 dan dapat dipakai untuk membantu alur di atas, tetapi kedudukannya perlu ditinjau ulang pada versi 1.3: sebagian kini bersinggungan dengan kebutuhan inti yang baru (misalnya formulir Input Nilai manual kini sejalan dengan UR-F-13, tetapi aturan "data impor tidak boleh diubah" pada UR-F-10 membatasinya).

| Fitur pendukung | Kegunaannya | Kedudukan pada v1.3 |
| --- | --- | --- |
| Dashboard ringkasan | Menampilkan jumlah peserta, rata-rata L dan M, daftar selisih terbesar, dan peringatan data kosong. | Pendukung — bukan kebutuhan inti |
| Data Peserta (tambah, ubah, hapus manual) | Mengelola daftar peserta secara manual apabila ada perbaikan kecil di luar impor. | Pendukung — DITINJAU ULANG: bertentangan dengan aturan "data impor tidak boleh diubah" (UR-F-10) apabila dipakai untuk mengubah data impor; hanya boleh dipakai untuk data yang memang dimasukkan manual, bila diputuskan demikian |
| Formulir Input Nilai manual | Memasukkan atau memperbaiki nilai survei dan wawancara seorang peserta secara manual, termasuk mengosongkan wawancaranya. | Pendukung — DITINJAU ULANG: kini sejalan dengan UR-F-13 (Evaluator mengisi nilai wawancara), tetapi batas antara "mengisi nilai wawancara" dan "mengubah data impor" harus diputuskan (Isu IT-07) |
| Ekspor CSV dan cetak PDF halaman Ekspose | Membawa grafik dan Pembahasan keluar dari aplikasi untuk dipakai pada pemaparan. | Pendukung — bukan kebutuhan inti |
| Penyimpanan 30 jawaban perubahan perilaku | Jawaban perubahan perilaku ikut tersimpan saat impor, untuk kemungkinan pengembangan berikutnya. | Pendukung — tidak ditampilkan dan tidak dibandingkan pada versi ini |

## 5 Kebutuhan data

### 5.1 Kegiatan dan peserta

| Data | Isi | Sumber |
| --- | --- | --- |
| Kegiatan | Nama Kegiatan, Penyelenggara, Lokasi, Tanggal Mulai, Tanggal Selesai. | Diisi Super Admin pada UR-F-08. |
| Peserta kegiatan | Daftar peserta beserta jabatan dan instansi, NIP/NIK untuk pencocokan. | Dibaca dari berkas Olah Data saat impor (UR-F-01/UR-F-10). |
| Tim evaluator | Pembagian peserta ke evaluator, 10 peserta per evaluator (kelebihan menambah satu tim). | Dihasilkan sistem pada UR-F-11. |
| Dokumen Inovasi/Proper | Judul Inovasi/Proper; Jangka Menengah (milestone, evidence, status Sudah/Belum Dilaksanakan); Jangka Panjang (sama); Kondisi Proper Saat Ini; berkas dokumen (maksimal 100 MB). | Diunggah peserta lewat Link Public (UR-F-12). |
| Nilai wawancara | Lima kriteria wawancara per peserta (jangka menengah, jangka panjang, seluruh tujuan, manfaat, Teknik Komunikasi), nilai 0–100. | Dari berkas Form Penilaian (UR-F-02) dan/atau diisi Evaluator di aplikasi (UR-F-13) — hubungannya Isu IT-07. |

### 5.2 Dua berkas masukan

| Berkas masukan | Isi yang dibaca sistem |
| --- | --- |
| (a) Olah Data — Olah_Data_Level_3_4_PKP_Bogor_Angk_7_th_2023__29-30_Okt_2025_REV.xlsx | Lembar Jawaban berisi jawaban survei; lembar OlahData berisi rata-rata per pertanyaan perubahan perilaku; lembar ekspose berisi nilai wawancara versi ekspose, skor survei, rentang, serta L dan M. Nama berkas tetap memakai nama aslinya. |
| (b) Form Penilaian — Form_Penilaian_PKP_Angk_VII_th_2023_Bogor__29-30_Okt_2025.xlsx | 30 lembar peserta. Setiap lembar memuat lima nilai wawancara beserta deskripsinya, Nilai Akhir per kriteria, dan Nilai Total. Nilai Teknik Komunikasi dibaca dari berkas ini. |
| Acuan keluaran (bukan masukan) — Presentasi Hari Kedua Evaluasi Pasca Pelatihan Kabupaten Bogor 2025 (.pptx) | Slide 5 sampai 9 adalah bentuk keluaran ekspose yang harus dihasilkan sistem, dan menjadi acuan kebenaran rekap pada Bab 10. |

Kedua berkas masukan dibuat secara manual di luar sistem oleh pihak BPSDM. Sistem hanya membacanya. Apabila salah satu berkas belum ada, langkah Input Data tidak dapat dijalankan dan bukan tugas sistem untuk membuatnya. Setelah diimpor, data tidak boleh diubah di dalam sistem (UR-F-10).

### 5.3 Hasil hitungan

| Hasil | Isi | Dipakai untuk |
| --- | --- | --- |
| 1. Perbandingan per peserta | Untuk setiap peserta: L, M, Total Form, selisih M dikurangi L, rentang survei, dan rentang wawancara. Selalu dihitung sistem, tidak pernah diketik manual. | Tabel perbandingan (UR-F-04) dan tampilan Evaluator. |
| 2. Rekap grafik | Jumlah peserta pada setiap rentang (0, 1–25, 26–50, 51–75, 76–100) untuk survei dan untuk wawancara, untuk kelima grafik. | Lima grafik ekspose (UR-F-05), Ringkasan Grafik (UR-F-15), dan masukan bagi AI (UR-F-06). |
| 3. Pembahasan | Teks empat poin untuk sebuah grafik, beserta cara pembuatannya (AI, templat, atau manual). | Penjelasan yang menyertai setiap grafik pada ekspose. Disimpan agar halaman ekspose tidak perlu memanggil AI setiap kali dibuka. |

Kuesioner survei memuat 47 item bernomor. Hanya tiga item hasil Aksi Perubahan yang dibandingkan dengan wawancara, karena hanya ketiganya yang mempunyai pasangan yang sama persis pada kriteria wawancara: target jangka panjang, seluruh tujuan tercapai, dan manfaat Aksi Perubahan. Pemetaan lengkapnya ada pada Lampiran B.

## 6 Aturan perhitungan

Bab ini TIDAK BERUBAH dari versi 1.2. Bab ini adalah aturan perbandingan (tahap 6 pada Bab 2.1). Metode yang dipakai adalah metode kuantitatif deskriptif komparatif. Survei pasca pelatihan mengukur dua hal, yaitu perubahan perilaku peserta setelah pelatihan dan hasil Aksi Perubahan yang dibuat peserta. Seluruh perhitungan pada bab ini bersifat deterministik, artinya hasil yang sama selalu diperoleh dari data yang sama, dan tidak bergantung pada AI maupun pada pembelajaran mesin.

### 6.1 Mengubah jawaban survei menjadi angka

Jawaban survei berupa teks diubah menjadi angka dengan skala Likert berikut. Pengubahan ini adalah langkah pertama dari seluruh perhitungan.

| Jawaban teks | Skor |
| --- | --- |
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
| --- | --- |
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

Bab ini TIDAK BERUBAH dari versi 1.2. Bab ini adalah aturan Penjelasan AI. Kebutuhan ini berasal dari permintaan pembimbing eksternal agar sistem dilengkapi AI yang membuat ringkasan dari hasil perbandingan kedua data.

> Alur yang berlaku:  HASIL PERBANDINGAN DATA  →  AI MEMBERIKAN PENJELASAN DARI HASIL TERSEBUT.  AI tidak menghitung apa pun dan tidak membaca berkas Excel. Angka tetap dihitung sistem dengan rumus pada Bab 6; yang dibuat AI hanyalah kalimat penjelasannya.

### 7.1 Isi Pembahasan

Pembahasan adalah kalimat penjelasan yang menyertai setiap grafik pada slide ekspose. Setiap Pembahasan terdiri atas empat poin dengan susunan tetap, mengikuti gaya slide ekspose yang selama ini dibuat secara manual:

- **Poin 1 — Konsentrasi penilaian:** menyatakan bahwa penilaian dari kedua sumber terkonsentrasi pada rentang nilai yang tinggi, apabila memang demikian menurut rekap.
- **Poin 2 — Rentang Optimal (76–100):** membandingkan berapa orang yang dinilai survei dan berapa orang yang dinilai wawancara pada rentang tertinggi.
- **Poin 3 — Rentang Dominan (51–75):** membandingkan jumlah orang pada rentang dominan dari kedua sumber.
- **Poin 4 — Rentang Rendah (26–50):** menyebutkan berapa orang yang masih berada pada rentang rendah dari kedua sumber, yaitu peserta yang manfaat Aksi Perubahannya dinilai rendah.

### 7.2 Cara kerja dan pengaman angka

- **Masukan untuk AI:** hanya rekap agregat per rentang dari grafik yang bersangkutan, yaitu keluaran perbandingan. Nama peserta dan NIP tidak dikirim.
- **Model:** Gemini, dengan kunci API yang dibaca dari berkas .env setempat. Tanpa kunci tersebut, tombol AI tidak dapat memanggil layanan dan sistem memakai templat.
- **Verifikasi hasil AI:** teks yang dihasilkan AI diperiksa terhadap empat angka kunci, yaitu jumlah orang pada rentang 76–100 dan 51–75 untuk survei dan untuk wawancara. Keempat angka itu harus muncul di dalam teks.
- **Penggantian otomatis:** apabila satu saja dari empat angka kunci tidak muncul, hasil AI dibuang dan Pembahasan diisi dari templat yang disusun langsung dari angka rekap, sehingga angkanya selalu benar.
- **Penyimpanan:** Pembahasan yang sudah dibuat disimpan, sehingga tidak perlu dibuat ulang setiap halaman dibuka.
- **Perubahan manual:** pengguna dapat mengubah isi Pembahasan dan menyimpannya, dan hasil perubahan itulah yang tampil pada ekspose.

### 7.3 Status pengujian Pembahasan AI

> Jalur templat telah terverifikasi: untuk Grafik 4 (Manfaat), poin yang dihasilkan sama persis dengan slide contoh, yaitu rentang 76–100 wawancara 15 orang berbanding survei 10 orang, rentang 51–75 survei 19 orang berbanding wawancara 13 orang, dan rentang rendah 1 orang pada kedua sumber. Pemanggilan Gemini yang sesungguhnya BELUM diuji, karena memerlukan kunci API milik pengguna yang diisi sendiri pada berkas .env di komputernya. Oleh sebab itu kebutuhan UR-F-06 dinyatakan terwujud dengan catatan, bukan terverifikasi penuh.

## 8 Kebutuhan non-fungsional

| Nomor | Kebutuhan | Ukuran |
| --- | --- | --- |
| UR-N-01 — Ketepatan | Seluruh hasil hitung harus sama dengan hasil hitung manual dari rumus pada Bab 6 dan sama dengan rekap pada slide ekspose untuk data contoh. | Rekap kelima grafik cocok persis, tanpa selisih satu orang pun (Bab 10). |
| UR-N-02 — Kejujuran data | Data kosong tidak boleh ditampilkan sebagai angka dan tidak boleh diganti dengan perkiraan. | Peserta tanpa wawancara tampil KOSONG dan rekap wawancara berkurang satu orang. |
| UR-N-03 — Perlindungan data pada AI | Layanan AI hanya menerima angka agregat hasil perbandingan. | Tidak ada nama dan tidak ada NIP pada data yang dikirim ke AI. |
| UR-N-04 — Keberlangsungan tanpa AI | Sistem tetap menghasilkan ekspose yang lengkap apabila layanan AI tidak tersedia atau kunci API belum diisi. | Pembahasan diisi dari templat dan tetap dapat diubah manual. |
| UR-N-05 — Keterlacakan | Setiap nilai menyimpan sumbernya, dan setiap hasil hitung dapat ditelusuri ke nilai asalnya. | Keterangan sumber terisi Form, Ekspose, atau Jawaban pada setiap nilai. |
| UR-N-06 — Pembatasan peran | Setiap peran hanya dapat membuka menu dan data sesuai perannya. Evaluator tidak dapat membuka menu Super Admin; peserta lewat Link Public tidak dapat membuka data kegiatan lain. | Pengujian peran: login sebagai Evaluator tidak menampilkan menu Buat Kegiatan, Input Data, dan Pembagian Tim. |
| UR-N-07 — Data impor tidak berubah | Data yang sudah diimpor dari Excel tidak dapat diubah, dihapus, atau ditimpa dari dalam sistem. | Setelah impor, tidak ada tombol ubah/hapus pada data impor; percobaan mengubahnya ditolak sistem. |
| UR-N-08 — Pembagian tim deterministik | Pembagian tim selalu menghasilkan susunan yang sama dari data yang sama: 10 peserta per evaluator, kelebihan ditambahkan ke satu tim. | Uji dengan 30 peserta menghasilkan 3 tim berisi 10 orang; uji dengan 31 peserta menghasilkan satu tim berisi 11 orang. |

## 9 Matriks ruang lingkup

Bab ini adalah pernyataan ruang lingkup yang mengikat untuk versi ini.

### 9.1 Inti — alur aplikasi yang harus dibuat ulang

| Bagian inti | Keterangan |
| --- | --- |
| Autentikasi dan peran | Login dengan peran Super Admin dan Evaluator; peserta lewat Link Public tanpa login (UR-F-07). |
| Buat Kegiatan dan Daftar Kegiatan | Lima isian kegiatan; daftar kegiatan sebagai pintu masuk ke dalam kegiatan (UR-F-08, UR-F-09). |
| Input Data Excel yang sudah ada | Olah Data (survei) dan Form Penilaian (wawancara); data impor tidak boleh diubah (UR-F-10, UR-F-01, UR-F-02). |
| Pembagian Tim | 10 peserta per evaluator (UR-F-11). |
| Link Public Unggah Inovasi/Proper | Tiga langkah: Pilih Kegiatan, Verifikasi NIP/NIK, Unggah Dokumen beserta Judul, Jangka Menengah, Jangka Panjang, Kondisi Proper Saat Ini (UR-F-12). |
| Evaluator mengisi nilai wawancara | Menu wawancara di setiap pegawai; Evaluator melihat hasil survey dan daftar pegawainya (UR-F-13). |
| Pantau Wawancara | List Peserta, Link Wawancara Peserta, Pembagian Tim (UR-F-14). |
| Perbandingan survei–wawancara dengan rumus | L, M, Total Form berbobot, selisih, dan rentang, sesuai UR-F-03 dan Bab 6. |
| Tabel perbandingan per peserta | L, M, Total Form, dan selisih untuk seluruh peserta, sesuai UR-F-04. |
| Ringkasan Grafik dan Jawaban di dalam Kegiatan | Sesuai UR-F-15 (rincian isinya masih menunggu konfirmasi). |
| Lima grafik ekspose | Grafik yang sama dengan slide 5 sampai 9, beserta tabel rekapnya, sesuai UR-F-05. |
| Hasil Survey keseluruhan | Sesuai UR-F-16 (tujuan penggunaannya masih menunggu konfirmasi). |
| Expose sebagai keseluruhan | Sesuai UR-F-17. |
| Penjelasan AI dari hasil perbandingan | Pembahasan empat poin per grafik, dibuat AI dari angka rekap, diverifikasi, dengan cadangan templat, sesuai UR-F-06 dan Bab 7. |

Fitur pendukung yang sudah ada di aplikasi v2 (Dashboard ringkasan, pengelolaan Data Peserta secara manual, formulir Input Nilai manual, ekspor CSV dan cetak PDF) tidak termasuk kelompok inti ini, kecuali sepanjang bersinggungan dengan UR-F-13 sebagaimana dijelaskan pada Bab 4.3.

> Kedua berkas Excel adalah PRASYARAT yang sudah ada sebelum sistem dipakai. Keduanya bukan keluaran sistem, dan membuatnya bukan tugas sistem. Sistem juga tidak membuat survei dan tidak membuat wawancara lapangan; survei diisi di luar sistem oleh alumni dan atasan, dan wawancara lapangan dilakukan tim evaluator.

### 9.2 Belum diputuskan — menunggu keputusan

| Hal yang belum diputuskan | Mengapa penting | Yang memutuskan |
| --- | --- | --- |
| Modul pembelajaran mesin berupa pengelompokan (clustering) pola selisih survei dan wawancara | Diusulkan sebagai nilai keistimewaan topik. Selama belum diputuskan, clustering bukan bagian dari sistem. | Bu Nuraini untuk kelayakan akademik; Pak Samsidin untuk kebutuhan teknis |
| Cakupan kuesioner penuh pada antarmuka | Versi ini hanya membandingkan tiga item hasil Aksi Perubahan. Belum diputuskan apakah seluruh 47 item, termasuk 30 item perubahan perilaku, kelompok dukungan, dan kelompok kendala, harus tampil dan diolah. | Pak Samsidin |
| Berkas resmi apabila nilai berbeda antarberkas | Terdapat nilai yang tidak cocok antara Form Penilaian, lembar Jawaban, dan lembar ekspose untuk peserta yang sama. Selama belum diputuskan, sistem mengikuti versi ekspose agar cocok dengan slide. | Pak Samsidin |
| Data PKA dan PKN | Judul topik menyebut tiga pelatihan, tetapi data yang tersedia baru PKP. Selama data PKA dan PKN belum diberikan, sistem hanya teruji pada PKP dan tidak ada pekerjaan persiapan untuk keduanya. | Pak Samsidin |
| Hubungan nilai wawancara di Excel dengan nilai yang diisi Evaluator di aplikasi (IT-07) | Menentukan apakah nilai wawancara bersumber dari impor, dari isian Evaluator, atau keduanya, dan bagaimana keduanya tidak saling bertentangan dengan aturan "data impor tidak boleh diubah". | Pak Samsidin |
| Pemasangan sistem hasil pembuatan ulang (hosting) | Aplikasi asli dapat diakses lewat internet (Link Public terbukti hidup). Belum diputuskan di mana sistem hasil pembuatan ulang dipasang dan siapa yang memasangnya. | Pak Samsidin |

### 9.3 Di luar ruang lingkup versi ini

- Pembuatan survei dan penyusunan pertanyaan survei.
- Pembuatan kedua berkas Excel (Olah Data dan Form Penilaian). Kedua berkas diterima apa adanya sebagai masukan.
- Input manual sebagai pengganti berkas untuk data impor. Formulir manual yang sudah ada di aplikasi hanya fitur pendukung untuk perbaikan kecil (Bab 4.3), bukan jalur utama masuknya data impor.
- Aplikasi telepon genggam.
- Integrasi dengan sistem lain di BPSDM, termasuk pengiriman data otomatis ke sistem lain.
- Perubahan terhadap kuesioner, kriteria wawancara, bobot, dan rumus yang berlaku. Sistem mengikuti rumus yang sudah berjalan dan tidak menetapkan rumus baru.

Catatan perubahan dari v1.2: login dan pembagian hak akses TIDAK LAGI di luar ruang lingkup — keduanya kini menjadi kebutuhan inti (UR-F-07), karena aplikasi yang sudah ada memilikinya. Pengisian nilai wawancara di dalam aplikasi juga TIDAK LAGI di luar ruang lingkup — kini menjadi kebutuhan inti (UR-F-13).

## 10 Kriteria penerimaan

Sistem dinyatakan diterima untuk ruang lingkup Bab 9.1 apabila kriteria berikut terpenuhi.

| Nomor | Tahap | Kriteria dan hasil yang diharapkan |
| --- | --- | --- |
| KP-01 | Input Data | Impor dua berkas berhasil: mengimpor Olah Data bersama Form Penilaian memasukkan 30 peserta beserta jabatan dan instansi, dan Total Form cocok dengan Form Penilaian untuk peserta yang nilainya sama antarberkas. Mengimpor tanpa Form Penilaian menghasilkan Total Form KOSONG, bukan nilai perkiraan. |
| KP-02 | Perbandingan | Contoh perhitungan satu peserta cocok: peserta dengan survei 3, 3, 3 dan wawancara jangka panjang 88, seluruh tujuan 93, manfaat 94 menghasilkan L 75, M 91,67, dan selisih 16,67; dengan nilai menengah 92 dan komunikasi 90, Total Form-nya 91,8. |
| KP-03 | Perbandingan | Rekap lima grafik cocok persis dengan slide: rekap kelima grafik sama dengan angka pada Bab 6.6 dan dengan slide 5 sampai 9 presentasi ekspose, dengan jumlah wawancara yang valid sebanyak 29 orang dan survei sebanyak 30 orang. |
| KP-04 | Perbandingan | Data kosong diperlakukan jujur: peserta yang wawancaranya kosong memiliki M dan Total Form KOSONG, tidak dihitung sebagai nol, dan tidak masuk rekap wawancara. Peserta berskor survei 1 masuk rentang 1–25, bukan rentang 0. |
| KP-05 | Penjelasan AI | Penjelasan menyebut angka rekap yang benar: Pembahasan Grafik 4 menyebut wawancara 15 berbanding survei 10 pada rentang 76–100, survei 19 berbanding wawancara 13 pada rentang 51–75, dan rentang rendah 1 berbanding 1. |
| KP-06 | Penjelasan AI | Bersyarat: penjelasan yang dibuat langsung oleh AI baru dapat dinilai setelah kunci API Gemini diisi dan pemanggilan langsung diuji. Selama belum diuji, penerimaan langkah Penjelasan AI didasarkan pada KP-05 melalui jalur templat. |
| KP-07 | Buat Kegiatan | Super Admin dapat membuat kegiatan dengan lima isian (Nama Kegiatan, Penyelenggara, Lokasi, Tanggal Mulai, Tanggal Selesai) dan kegiatan itu muncul pada Daftar Kegiatan. |
| KP-08 | Input Data dan Pembagian Tim | Setelah impor 30 peserta, sistem membagi peserta menjadi 3 tim berisi 10 orang per evaluator; setelah impor 31 peserta, ada satu tim berisi 11 orang. Data impor tidak dapat diubah dari dalam sistem. |
| KP-09 | Link Public | Peserta dapat menyelesaikan tiga langkah Link Public (Pilih Kegiatan, Verifikasi NIP/NIK, Unggah Dokumen maksimal 100 MB) beserta Judul Inovasi/Proper, Jangka Menengah, Jangka Panjang, dan Kondisi Proper Saat Ini; dokumen lama terganti setelah dokumen baru berhasil diunggah. |
| KP-10 | Evaluator | Evaluator yang login hanya melihat hasil survey dan daftar pegawainya, dan dapat mengisi nilai wawancara lewat menu wawancara di setiap pegawai. |
| KP-11 | Expose | Expose menampilkan keseluruhan hasil kegiatan: lima grafik beserta Pembahasannya, berdasarkan satu perhitungan yang sama. |

Data dummy 10 peserta dipakai sebagai bahan uji tambahan untuk KP-02 dan KP-04, agar rumus dapat diperiksa tanpa memakai data asli.

## 11 Isu terbuka dan keputusan yang dibutuhkan

| Nomor | Isu | Dampak apabila tidak diputuskan | Penanggung jawab keputusan |
| --- | --- | --- | --- |
| IT-01 | Nilai yang tidak cocok antarberkas untuk peserta yang sama. Contoh yang diketahui: seorang peserta bernilai wawancara 30 pada Form Penilaian tetapi 60 pada lembar ekspose; peserta lain bernilai 95 pada Form Penilaian tetapi 100 pada lembar ekspose; dan nilai manfaat 50 berbanding 60. **KEPUTUSAN INTERIM 18 Nov 2026 (Indra): sistem memakai Form Penilaian sebagai sumber nilai wawancara, dan setiap selisih antarberkas ditampilkan sebagai daftar peringatan, bukan dipilih diam-diam. Keputusan resmi berkas mana yang berlaku tetap menunggu Pak Samsidin.** | Sistem terpaksa mengikuti satu versi tanpa dasar keputusan resmi. Apabila versi yang dipilih kemudian dinyatakan keliru, L, M, Total Form, dan rekap grafik untuk peserta terkait ikut berubah. | Pak Samsidin |
| IT-02 | Data PKA dan PKN belum tersedia sebagai berkas. **Terjawab sebagian 16 Nov 2026: data PKA ADA — Pak Samsidin mengirim tangkapan layar aplikasi asli (Senin 16 Nov) yang menampilkan peserta PKA dengan tim "EVALUATOR PKA V 1" dan pengisian wawancara bertanggal 16 Nov 2026. Indra menyatakan 18 Nov 2026: data PKA, PKN, dan lainnya PASTI ADA. STATUS 18 Nov 2026: pertanyaan keberadaan data DITUTUP — yang tersisa hanya meminta berkasnya ke Pak Samsidin. MVP dibangun dulu dengan data PKP yang sudah ada.** | Judul topik menyebut tiga pelatihan, tetapi sistem hanya teruji pada PKP. | Pak Samsidin |
| IT-03 | Perlu tidaknya modul clustering sebagai keistimewaan topik. | Nilai keistimewaan Internship 1 belum dapat dinyatakan pada laporan, dan Bab 9.2 tidak dapat ditutup. | Bu Nuraini, dengan masukan Pak Samsidin |
| IT-04 | Cakupan kuesioner pada antarmuka: tiga item hasil Aksi Perubahan saja atau seluruh 47 item. | Menentukan besar pekerjaan berikutnya dan isi laporan. | Pak Samsidin |
| IT-05 | Kunci API Gemini belum diisi dan pemanggilan AI langsung belum diuji. **KEPUTUSAN 18 Nov 2026 (Indra): Indra membuat kunci API Gemini sendiri dan menguji satu kali pemanggilan sungguhan dengan angka agregat saja, lalu memeriksa 4 angka kuncinya. Sampai pengujian itu dilakukan, kebutuhan ini tetap dinyatakan hanya terverifikasi pada jalur templat.** | Kebutuhan penjelasan AI hanya terverifikasi pada jalur templat, sehingga belum dapat dinyatakan bekerja penuh. | Indra |
| IT-06 | Persetujuan ruang lingkup pada Bab 9. **RENCANA 18 Nov 2026: dimintakan persetujuan Bu Nuraini pada Bimbingan #3 (18 Nov, pukul 11.00 diajukan) dan Pak Samsidin pada pertemuan BPSDM berikutnya, dengan isu-isu terbuka dicatat di bawah tanda tangan pada Bab 12. Sampai tanda tangan diperoleh, isu ini tetap TERBUKA.** | Selama belum disetujui, perbedaan tafsir mengenai alur aplikasi, PKA/PKN, dan clustering dapat muncul kembali di tengah pengembangan. | Pak Samsidin dan Bu Nuraini |
| IT-07 | Hubungan nilai wawancara di berkas Form Penilaian dengan nilai wawancara yang diisi Evaluator di dalam aplikasi. Kedua sumber sama-sama tercatat (impor Excel dikonfirmasi 17 Nov 09:07; isian Evaluator dikonfirmasi 17 Nov 09:26), tetapi belum dijelaskan apakah isian Evaluator menggantikan impor, melengkapi impor, atau hanya untuk peserta yang nilainya belum ada — dan bagaimana hal itu tidak melanggar aturan "data impor tidak boleh diubah". **Bukti baru 16 Nov 2026 (tangkapan layar aplikasi asli): form wawancara per kriteria berisi Nilai wawancara 0–100, kolom "Hasil wawancara & bukti" (teks bebas), "Data Jangka Menengah dari peserta" (milestone/rencana, status evidence, tautan "Lihat foto evidence"), dan "Keterangan rentang nilai" yang deskripsinya spesifik per kriteria (bukan skala umum ≤60 kurang dst. pada Form Penilaian).** | Menentukan sumber nilai wawancara yang dipakai perhitungan Bab 6; bila salah tafsir, M dan Total Form dapat memakai sumber yang keliru. | Pak Samsidin |
| IT-08 | Link Wawancara Peserta pada Pantau Wawancara: satu link per peserta, atau satu link untuk semua? Bagaimana link itu dibuat dan dibagikan? | Menentukan rancangan modul Pantau Wawancara (UR-F-14). | Pak Samsidin |
| IT-09 | Hasil Survey keseluruhan "dijadikan apa" (catatan 16 Nov yang terpotong, belum terjawab 17 Nov). | Menentukan rancangan UR-F-16 dan isi Expose. | Pak Samsidin |
| IT-10 | Autentikasi: bagaimana cara login, siapa yang membuat akun Super Admin dan Evaluator, dan bagaimana pemulihan akun? | Menentukan rancangan UR-F-07; tanpa ini, pembagian peran tidak dapat diuji penuh. | Pak Samsidin |
| IT-11 | Isi rinci Daftar Kegiatan, Ringkasan Grafik, Jawaban di dalam Kegiatan, dan Expose (grafik apa saja, jawaban siapa, siapa yang melihat Expose dan kapan). | Menentukan rancangan UR-F-09, UR-F-15, dan UR-F-17; tanpa ini, tampilan di dalam kegiatan hanya dapat dibuat berdasarkan tebakan. | Pak Samsidin |
| IT-12 | Pembagian kelebihan peserta bila jumlah peserta tidak habis dibagi 10 dan kelebihannya lebih dari satu orang (misalnya 32 peserta: apakah 11/11/10 atau 11/10/11, dan siapa yang menentukan). | Menentukan aturan pasti UR-F-11 dan UR-N-08. | Pak Samsidin |

Tidak ada batas waktu yang ditetapkan di dalam dokumen ini untuk isu-isu di atas. Batas waktu mengikuti jadwal Internship 1 yang berlaku dan keputusan para pembimbing. Isu IT-07 sampai IT-12 adalah isu BARU pada versi 1.3, berasal dari penjelasan 17 November 2026.

**Penutupan sebagian isu, 18 November 2026 (hanya pada berkas Markdown ini; Word v1.3 belum dibuat ulang):** IT-01 ditutup sementara dengan keputusan interim (Form Penilaian sebagai sumber, selisih ditampilkan sebagai peringatan; keputusan resmi tetap menunggu Pak Samsidin); IT-02 ditutup untuk pertanyaan keberadaan data (PKA/PKN dipastikan ada; yang tersisa hanya meminta berkasnya); IT-05 diputuskan caranya (Indra membuat kunci API dan menguji satu kali pemanggilan; pelaksanaan masih menunggu); IT-06 direncanakan persetujuannya (Bu Nuraini pada Bimbingan #3, Pak Samsidin berikutnya) dan tetap TERBUKA sampai tanda tangan diperoleh. Isu IT-03, IT-04, dan IT-07 sampai IT-12 tetap terbuka.

## 12 Persetujuan

Dengan menandatangani halaman ini, para pihak menyatakan bahwa kebutuhan dan ruang lingkup pada dokumen ini, khususnya alur pada Bab 2.1 dan matriks pada Bab 9, telah dibaca dan disetujui sebagai acuan pengembangan Sistem Evaluasi Pasca Pelatihan. Perubahan terhadap ruang lingkup yang sudah disetujui dicatat sebagai versi baru dokumen ini.

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
| Aplikasi asli BPSDM — Link Public https://integral-bpsdm.jabarprov.go.id/pasca-pelatihan/unggah-inovasi | Rujukan alur aplikasi yang sudah ada (UR-F-12); dicek langsung 17 November 2026, isinya cocok dengan penjelasan Pak Samsidin. |
| Lembar catatan alur aplikasi Pak Samsidin 17 Nov 2026 (catatan-alur-aplikasi-pak-samsidin-17-nov.md) | Catatan penjelasan Pak Samsidin 16–17 November 2026 yang menjadi dasar revisi v1.3. |

Dokumen ini disusun dari berkas-berkas di atas dan dari hasil verifikasi aplikasi yang dilakukan pada 9 dan 10 November 2026, ditambah penjelasan Pak Samsidin dan pengecekan langsung Link Public pada 17 November 2026. Apabila isi dokumen ini berbeda dengan isi berkas sumber, yang berlaku adalah berkas sumber, dan perbedaannya dicatat sebagai isu baru pada Bab 11.

## Lampiran D Catatan verifikasi 17 November 2026

Lampiran ini mencatat apa yang benar-benar dicek pada 17 November 2026, agar pembaca dapat membedakan fakta yang terverifikasi dari hal yang masih menunggu konfirmasi.

- Link Public https://integral-bpsdm.jabarprov.go.id/pasca-pelatihan/unggah-inovasi DIBUKA LANGSUNG pada 17 November 2026 pukul 09:02 WIB. Yang terlihat: tiga langkah (1 Pilih Kegiatan, 2 Verifikasi Peserta dengan NIP/NIK, 3 Unggah Dokumen maksimal 100 MB); Informasi Inovasi/Proper berisi Judul Inovasi/Proper, Jangka Menengah, Jangka Panjang, dan Kondisi Proper Saat Ini; jenis berkas PDF, Word, PowerPoint, Excel, ZIP, atau RAR; catatan "NIP/NIK hanya digunakan untuk mencocokkan peserta. Dokumen lama akan diganti setelah dokumen baru berhasil diunggah."
- Pembagian tim DIJELASKAN Indra pada 17 November 2026 pukul 09:05 WIB dari penjelasan Pak Samsidin: 10 peserta per evaluator; 30 peserta menjadi 3 tim; 31 peserta berarti satu tim berisi 11 orang.
- File Excel yang diimpor DIKONFIRMASI Indra pada 17 November 2026 pukul 09:07 WIB: ya, dua file Excel yang kemarin (Olah Data dan Form Penilaian); data tidak boleh diubah setelah diimpor.
- Peran Evaluator DIKOREKSI Indra pada 17 November 2026 pukul 09:26 WIB: Evaluator bukan hanya melihat hasil survey dan daftar pegawai, tetapi juga mengisi nilai wawancara. Alur Super Admin dirangkum ulang: Buat Kegiatan → Input Data → Pembagian Tim.
- Form wawancara Evaluator DIKONFIRMASI Indra pada 17 November 2026 pukul 09:47 WIB: berdasarkan Form Penilaian (lima kriteria, lengkap dengan bobot dan deskripsi catatan evaluator). Pukul 09:48 WIB dikonfirmasi lagi: nilai di form itu SUDAH TERISI dari Data Excel.
- Asumsi Indra pada 17 November 2026 pukul 09:54 WIB: yang tidak boleh diedit adalah Data Peserta (data dari Excel sudah fix); sistem kemarin bisa mengedit semuanya, desain baru bedanya di situ.
- Tangkapan layar aplikasi asli dari Pak Samsidin (dikirim Senin 16 Nov 2026, diterima Indra 18 Nov): (1) halaman "Peserta & pengisian wawancara" — tabel peserta PKA dengan kolom Tim ("EVALUATOR PKA V 1"), Survei, Wawancara, Akhir Berbobot, Status Selesai beserta stempel waktu 16 Nov 2026, tombol Wawancara per peserta, pencarian nama/NIP/instansi dan filter status; (2) form wawancara "1. Target jangka menengah" — Bobot 20%, Nilai wawancara 95, kolom "Hasil wawancara & bukti", "Data Jangka Menengah dari peserta" (Milestone 5: Implementasi, status evidence Sudah Dilaksanakan, "Lihat foto evidence"), dan "Keterangan rentang nilai" spesifik per kriteria. Dua tangkapan layar ini disimpan di `~/workspace/user/media_library/image/image-8.png` dan `image-9.png`.
- Alur evidence → wawancara DIKONFIRMASI Indra pada 18 November 2026 pukul 09:25 WIB dari tangkapan layar form wawancara: peserta mengisi evidence dulu lewat Link Public https://integral-bpsdm.jabarprov.go.id/pasca-pelatihan/unggah-inovasi, lalu Evaluator melihat evidence itu di form wawancara dan mengisi hasil wawancaranya (Nilai wawancara + "Hasil wawancara & bukti").
- Catatan pembaruan berkas ini: tiga klarifikasi di atas ditambahkan ke berkas Markdown ini pada 18 November 2026; versi dokumen tetap 1.3 dan isi Word v1.3 tidak berubah.
- Yang BELUM terjawab sampai dokumen ini disusun: "Hasil Survey keseluruhan dijadikan apa"; Link Wawancara Peserta satu per peserta atau satu untuk semua; cara login dan pembuatan akun; isi rinci Daftar Kegiatan, Ringkasan Grafik, Jawaban, dan Expose; hubungan nilai wawancara di Excel dengan nilai yang diisi Evaluator di aplikasi. Semuanya dicatat pada Bab 11 (IT-07 sampai IT-12), bukan diisi dengan tebakan.

---

*URD Sistem Evaluasi Pasca Pelatihan • Versi 1.3 — 17 November 2026*
