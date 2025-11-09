# Matiku LMS - Dashboard Guru & Siswa

Matiku LMS adalah aplikasi dasbor _Learning Management System_ (LMS) yang modern dan intuitif, dirancang untuk membantu guru dalam memantau aktivitas siswa, mengelola modul ajar, dan memberikan penilaian. Aplikasi ini juga dilengkapi dengan fitur-fitur canggih berbasis AI dari Google Gemini untuk memberikan rekomendasi dan membantu proses belajar mengajar. Selain itu, terdapat tampilan dasbor khusus untuk siswa melihat kemajuan belajar mereka.

## ✨ Fitur Utama

### Untuk Guru (Teacher)
- **Dashboard Utama**: Menampilkan ringkasan statistik kunci seperti total siswa, jumlah modul, dan rata-rata nilai kelas dalam antarmuka yang mudah dipahami.
- **Manajemen Data Siswa**: Kemampuan untuk menambah, mengedit, dan menghapus siswa dari kelas. Proses penambahan siswa dilakukan dengan menggunakan alamat email unik siswa.
- **Manajemen Modul Ajar**: Guru dapat mengunggah materi ajar dalam format PDF, menambahkan judul, deskripsi, serta tanggal tenggat. Deskripsi modul dapat dibuat secara otomatis menggunakan bantuan AI.
- **Sistem Penilaian**: Memasukkan nilai kuantitatif (skor) dan analisis kualitatif untuk setiap siswa pada setiap modul ajar.
- **Rekomendasi Berbasis AI**: Setelah penilaian disimpan, AI akan memberikan rekomendasi tindak lanjut yang personal untuk membantu siswa meningkatkan pemahamannya.
- **Analitik Pembelajaran**: Visualisasi data performa siswa dan efektivitas modul ajar dalam bentuk diagram batang yang interaktif, dengan kemampuan filter per kelas.
- **Asisten AI**: Halaman khusus berisi chatbot untuk membantu guru dengan berbagai pertanyaan seputar pendidikan, mulai dari membuat soal hingga mencari ide mengajar.

### Untuk Siswa (Student)
- **Dashboard Siswa**: Menampilkan ringkasan akademik personal, termasuk nilai rata-rata, jumlah modul yang telah dinilai, dan nilai tertinggi.
- **Akses Modul & Tugas**: Siswa dapat melihat semua modul ajar yang diberikan oleh guru, mengunduh materi, dan melihat tugas yang akan datang beserta tenggat waktunya.
- **Lihat Hasil Penilaian**: Siswa dapat melihat skor yang mereka peroleh untuk setiap modul yang telah dinilai oleh guru.

## 🚀 Teknologi yang Digunakan

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend & Database**: Supabase (Authentication, PostgreSQL Database, Storage)
- **Artificial Intelligence**: Google Gemini API (`@google/genai`)
- **Deployment**: Supabase Hosting or any static site hosting provider.

## ⚠️ Penting: Perbaikan Kebijakan Keamanan

Agar fitur **Tambah Siswa** dapat berfungsi, Anda **harus** memperbarui kebijakan keamanan (Row Level Security) di database Supabase Anda. Kebijakan default terlalu ketat dan mencegah guru mencari siswa yang belum ada di kelasnya.

**Cara Memperbaiki:**
1. Buka proyek Supabase Anda.
2. Navigasi ke **SQL Editor** di menu sebelah kiri.
3. Klik **New query**, salin kode di bawah ini, tempel, lalu klik **RUN**.

```sql
-- Policy ini mengizinkan guru untuk mencari profil pengguna lain
-- untuk ditambahkan sebagai siswa. Ini aman karena aplikasi
-- hanya melakukan pencarian berdasarkan email spesifik yang diinput.
CREATE POLICY "Teachers can search for student profiles to add them."
ON public.profiles FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'guru'
);
```

## 📁 Struktur Proyek

```
/
├── components/           # Komponen-komponen React yang dapat digunakan kembali
├── config/               # Konfigurasi Supabase dan API Gemini
├── types.ts              # Definisi tipe TypeScript
├── App.tsx               # Komponen utama aplikasi
├── index.tsx             # Titik masuk aplikasi React
├── index.html            # File HTML utama
└── README.md             # Dokumentasi proyek
```

## 🔧 Cara Kerja

1.  **Autentikasi**: Pengguna dapat mendaftar atau masuk menggunakan email/password atau akun Google via Supabase Auth. Peran (Guru/Siswa) dipilih saat login pertama kali.
2.  **Dasbor Berbasis Peran**: Setelah masuk, pengguna akan diarahkan ke dasbor yang sesuai dengan perannya.
3.  **Interaksi Guru**:
    - Guru menambahkan siswa ke kelasnya melalui alamat email siswa.
    - Guru mengunggah dan mengelola modul ajar.
    - Guru memberikan penilaian kepada siswa untuk setiap modul.
    - Guru menggunakan Asisten AI untuk mendapatkan bantuan.
4.  **Interaksi Siswa**:
    - Siswa melihat ringkasan performa akademiknya.
    - Siswa mengakses modul, mengunduh materi, dan melihat tugas.
5.  **Integrasi AI**: Aplikasi terhubung dengan Google Gemini API untuk fitur seperti pembuatan deskripsi modul, analisis penilaian, dan chatbot asisten.
6.  **Penyimpanan Data**: Semua data (pengguna, siswa, modul, nilai) disimpan dan dikelola secara aman di Supabase PostgreSQL. File modul disimpan di Supabase Storage.
