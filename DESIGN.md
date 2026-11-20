# Panduan Desain Antarmuka — Sistem Evaluasi Pasca Pelatihan (BPSDM Provinsi Jawa Barat)

## Arah Desain

- **Tema Visual:** *Editorial Civic Monochrome* (hitam-putih resmi untuk instansi pemerintah, berfokus pada keterbacaan tabel angka, kejelasan hierarki, dan kontras tinggi tanpa dekorasi berlebihan).
- **Bahasa Antarmuka:** Bahasa Indonesia lugas dan konsisten bagi pengelola program, evaluator, serta peserta unggah publik.

## Token Warna Utama

- **Kanvas (`--canvas-bg`):** `#FAFAFA`
- **Permukaan Kartu & Modal:** `#FFFFFF` (`border-zinc-200`)
- **Teks Utama & Aksi Primer:** `#09090B` (`zinc-950`)
- **Teks Sekunder & Label:** `#3F3F46` (`zinc-700`) / `#52525B` (`zinc-600`)
- **Batas Kontrol Interaktif & Badge:** `#71717A` (`zinc-500`, rasio kontras non-teks `>= 4.6:1` di atas `#FFFFFF`/`#FAFAFA`)
- **Teks Teredup di Atas Kartu Gelap (`#09090B`):** `#D4D4D8` (`zinc-300`) / `#A1A1AA` (`zinc-400`, rasio `>= 7.7:1`)

> [!NOTE]
> Hindari pemakaian `text-zinc-400` maupun `border-zinc-300` pada latar terang (`#FFFFFF`, `#FAFAFA`, `#F4F4F5`) karena tidak memenuhi batas kontras WCAG 2.2 AA (`4.5:1` teks normal / `3.0:1` komponen interaktif).

## Pengecualian Resmi: Slide Ekspose (PPTX)

Kontainer `.slide-card` di halaman Ekspose tetap mempertahankan warna standar materi presentasi resmi PPTX agar pratinjau layar dan ekspor PowerPoint tetap identik:

- Grafik perbandingan dua sisi: `#4472C4` dan `#ED7D31`
- Segel / logo Pemprov Jawa Barat
- Kotak pembahasan & kesimpulan: `#D9E1F2`, `#FCE4D6`, `#E2EFDA`

Seluruh antarmuka pengendali di luar `.slide-card` (bilah aksi, antrean proses, paginasi, tab, dialog, dan fokus keyboard) tetap menggunakan palet monokrom hitam-putih.

## Tipografi & Skala

- **Font UI:** `Plus Jakarta Sans`
- **Font Angka / NIP / Skor / Kode:** `JetBrains Mono` dengan `tabular-nums`
- **Skala Root Aplikasi:** `html { font-size: 90%; }` (ketentuan kepadatan kerja admin & tabel; skala cetak `@media print` kembali ke `100%`)

## Standar Aksesibilitas & Komponen

- **Ikon:** Menggunakan `@radix-ui/react-icons` secara konsisten di seluruh aplikasi.
- **Indikator Fokus Keyboard:** Setiap elemen interaktif mempertahankan `:focus-visible` (`outline: 2px solid #09090B; outline-offset: 2px;`) dan tidak menonaktifkan ring fokus tanpa pengganti yang kontras.
- **Target Sentuh Mobile:** Tombol ikon dan kontrol navigasi memakai tinggi/lebar minimum `44x44 CSS px` pada viewport sempit (`min-h-11 min-w-11` sebelum breakpoint `sm:` / `lg:`).
- **Formulir & Tabel:** Setiap `<input>`, `<select>`, `<textarea>` terhubung dengan `<label htmlFor>` + `id`, dilengkapi `autoComplete` yang sesuai, dan setiap `<table>` memiliki `<caption>` deskriptif serta `<th scope="col">`.
