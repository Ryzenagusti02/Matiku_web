-- ##################################################################################
-- ## 🚀 SCRIPT SETUP LENGKAP UNTUK MATIKU LMS                                     ##
-- ## PENTING: Ikuti SEMUA 4 langkah di bawah ini secara BERURUTAN. Melewatkan     ##
-- ##          satu langkah akan menyebabkan error pada aplikasi.                  ##
-- ##################################################################################

-- ❗ **MENGATASI ERROR "Bucket not found"** ❗
-- Error ini adalah yang paling umum dan terjadi jika Anda **melewatkan LANGKAH 2**.
-- Anda **HARUS** membuat bucket penyimpanan bernama `matiku_storage` secara manual
-- di dashboard Supabase SEBELUM menjalankan aplikasi.

-- ==================================================================================
-- LANGKAH 1: BUAT TABEL DATABASE
-- ## Jalankan script di bawah ini di Supabase SQL Editor untuk membuat semua      ##
-- ## tabel dan fungsi yang diperlukan.                                           ##
-- ==================================================================================

-- Tabel `profiles` untuk menyimpan data pengguna (guru dan siswa)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  role TEXT,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores user profile data, including their role (guru/siswa).';

-- Tabel `students` untuk menyimpan data siswa yang terhubung dengan guru
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  grade TEXT,
  class TEXT,
  scores jsonb DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.students IS 'Stores student data linked to a specific teacher.';

-- Tabel `modules` untuk materi ajar yang dibuat oleh guru
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.modules IS 'Stores teaching modules created by teachers.';

-- Tabel `notifications` untuk notifikasi guru
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.notifications IS 'Stores notifications for teachers.';

-- Tabel `exams` untuk ujian CBT
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.exams IS 'Stores CBT exam details created by teachers.';

-- Tabel `questions` untuk soal-soal dalam ujian CBT
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options jsonb NOT NULL,
  correct_answer_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.questions IS 'Stores questions for a specific CBT exam.';

-- Tabel `exam_attempts` untuk menyimpan hasil ujian siswa
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_uid uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score REAL,
  answers jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
COMMENT ON TABLE public.exam_attempts IS 'Stores student attempts and results for CBT exams.';

-- Tabel `assignments` untuk penugasan
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  assigned_to_class TEXT NOT NULL, -- Cth: 'VII - A' atau 'all'
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.assignments IS 'Stores assignments created by teachers for specific classes.';

-- Tabel `submissions` untuk pengumpulan tugas siswa
CREATE TABLE IF NOT EXISTS public.submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_uid uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT,
    file_name TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    grade REAL,
    feedback TEXT,
    status TEXT -- Cth: 'Terkumpul', 'Terlambat'
);
COMMENT ON TABLE public.submissions IS 'Stores student submissions for assignments.';

-- Fungsi Helper untuk RLS (Mencegah Rekursi)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_teacher_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT teacher_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_class_info()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  student_class_info TEXT;
BEGIN
  SELECT grade || ' - ' || class INTO student_class_info
  FROM public.students
  WHERE uid = auth.uid();
  RETURN student_class_info;
END;
$$;

-- Fungsi dan Trigger untuk Sinkronisasi Nama Siswa
-- Penjelasan: Fungsi ini akan otomatis memperbarui nama siswa di tabel `students`
-- setiap kali seorang siswa mengubah `username` mereka di tabel `profiles`.
-- Ini memastikan data nama siswa di dashboard guru selalu up-to-date.
CREATE OR REPLACE FUNCTION public.sync_student_name_from_profile()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Cek jika pengguna yang diupdate adalah siswa
  IF OLD.role = 'siswa' THEN
    UPDATE public.students
    SET name = NEW.username
    WHERE uid = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Hapus trigger lama jika ada untuk setup yang bersih
DROP TRIGGER IF EXISTS on_profile_username_update ON public.profiles;

-- Buat trigger baru
CREATE TRIGGER on_profile_username_update
  AFTER UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.sync_student_name_from_profile();
-- Setelah menjalankan script di atas, lanjutkan ke Langkah 2.


-- ==================================================================================
-- LANGKAH 2: 🚨 BUAT BUCKET PENYIMPANAN (WAJIB DILAKUKAN!) 🚨
-- ## Langkah ini krusial untuk fitur upload file (modul, tugas, foto profil).    ##
-- ==================================================================================

-- 1. Buka Dashboard Supabase proyek Anda.
-- 2. Di menu sebelah kiri, klik ikon "Storage".
-- 3. Klik tombol "+ New bucket".
-- 4. Untuk "Bucket name", masukkan **persis**: `matiku_storage`
-- 5. Pastikan toggle "Public bucket" dalam posisi **ON** (Aktif).
-- 6. Klik "Save".
--
-- Setelah bucket 'matiku_storage' berhasil dibuat, lanjutkan ke Langkah 3.


-- ==================================================================================
-- LANGKAH 3: AKTIFKAN ROW LEVEL SECURITY (RLS)
-- ## Amankan data dan file Anda dengan mengaktifkan RLS sebelum menerapkan       ##
-- ## kebijakan di langkah terakhir. Lakukan ini secara manual di dashboard.      ##
-- ==================================================================================

-- 1. Di Dashboard Supabase, klik ikon "Authentication" (gambar kunci) di menu kiri.
-- 2. Klik "Policies" di bawahnya.
-- 3. **Untuk setiap tabel di bawah ini**, klik tombol toggle RLS di sebelahnya untuk mengaktifkannya (dari OFF menjadi ON):
--    - profiles
--    - students
--    - modules
--    - notifications
--    - exams
--    - questions
--    - exam_attempts
--    - assignments
--    - submissions
-- 4. **PENTING (UNTUK STORAGE):** Masih di halaman yang sama, scroll ke atas dan cari dropdown "Schemas". Ganti dari `public` ke `storage`.
-- 5. Klik tabel "objects" yang muncul, lalu aktifkan RLS untuknya juga.
--
-- Setelah RLS aktif untuk semua tabel di atas DAN untuk `storage.objects`, lanjutkan ke Langkah 4.


-- ==================================================================================
-- LANGKAH 4: TERAPKAN KEBIJAKAN KEAMANAN (RLS POLICIES)
-- ## Setelah RLS diaktifkan, jalankan SEMUA script di bawah ini di SQL Editor     ##
-- ## untuk menerapkan aturan keamanan pada data dan file Anda.                   ##
-- ==================================================================================

-- Hapus kebijakan lama untuk memastikan setup yang bersih.
DROP POLICY IF EXISTS "Users can manage their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles." ON public.profiles;
DROP POLICY IF EXISTS "Teachers can update student profiles." ON public.profiles;
DROP POLICY IF EXISTS "Full access for teachers to their students." ON public.students;
DROP POLICY IF EXISTS "Students can view their own data." ON public.students;
DROP POLICY IF EXISTS "Teachers can manage their own modules." ON public.modules;
DROP POLICY IF EXISTS "Teachers can manage their own notifications." ON public.notifications;
DROP POLICY IF EXISTS "Teachers can manage their own exams." ON public.exams;
DROP POLICY IF EXISTS "Students can view exams from their teacher." ON public.exams;
DROP POLICY IF EXISTS "Teachers can manage questions for their exams." ON public.questions;
DROP POLICY IF EXISTS "Students can view questions for their assigned exams." ON public.questions;
DROP POLICY IF EXISTS "Students can manage their own attempts." ON public.exam_attempts;
DROP POLICY IF EXISTS "Teachers can view attempts for their students." ON public.exam_attempts;
DROP POLICY IF EXISTS "Teachers can manage their own assignments." ON public.assignments;
DROP POLICY IF EXISTS "Students can view assignments for their class." ON public.assignments;
DROP POLICY IF EXISTS "Students can manage their own submissions." ON public.submissions;
DROP POLICY IF EXISTS "Teachers can manage submissions for their assignments." ON public.submissions;
DROP POLICY IF EXISTS "Guru dapat mengelola file mereka sendiri" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Siswa dapat mengunggah submisi tugas" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view files" ON storage.objects;

-- Kebijakan untuk Tabel `profiles`
CREATE POLICY "Users can manage their own profile." ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Authenticated users can view profiles." ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Teachers can update student profiles." ON public.profiles FOR UPDATE USING (public.get_my_role() = 'guru' AND role = 'siswa') WITH CHECK (public.get_my_role() = 'guru' AND role = 'siswa');

-- Kebijakan untuk Tabel `students`
CREATE POLICY "Full access for teachers to their students." ON public.students FOR ALL USING (public.get_my_role() = 'guru' AND teacher_id = auth.uid()) WITH CHECK (public.get_my_role() = 'guru' AND teacher_id = auth.uid());
CREATE POLICY "Students can view their own data." ON public.students FOR SELECT USING (public.get_my_role() = 'siswa' AND uid = auth.uid());

-- Kebijakan untuk Tabel `modules`
CREATE POLICY "Teachers can manage their own modules." ON public.modules FOR ALL USING (public.get_my_role() = 'guru' AND teacher_id = auth.uid()) WITH CHECK (public.get_my_role() = 'guru' AND teacher_id = auth.uid());

-- Kebijakan untuk Tabel `notifications`
CREATE POLICY "Teachers can manage their own notifications." ON public.notifications FOR ALL USING (public.get_my_role() = 'guru' AND teacher_id = auth.uid()) WITH CHECK (public.get_my_role() = 'guru' AND teacher_id = auth.uid());

-- Kebijakan untuk Tabel `exams` dan `questions`
CREATE POLICY "Teachers can manage their own exams." ON public.exams FOR ALL USING (public.get_my_role() = 'guru' AND teacher_id = auth.uid()) WITH CHECK (public.get_my_role() = 'guru' AND teacher_id = auth.uid());
CREATE POLICY "Students can view exams from their teacher." ON public.exams FOR SELECT USING (public.get_my_role() = 'siswa' AND teacher_id = public.get_my_teacher_id());
CREATE POLICY "Teachers can manage questions for their exams." ON public.questions FOR ALL USING (public.get_my_role() = 'guru' AND (exam_id IN (SELECT id FROM public.exams WHERE teacher_id = auth.uid()))) WITH CHECK (public.get_my_role() = 'guru' AND (exam_id IN (SELECT id FROM public.exams WHERE teacher_id = auth.uid())));
CREATE POLICY "Students can view questions for their assigned exams." ON public.questions FOR SELECT USING (public.get_my_role() = 'siswa' AND (exam_id IN (SELECT id FROM public.exams WHERE teacher_id = public.get_my_teacher_id())));

-- Kebijakan untuk Tabel `exam_attempts`
CREATE POLICY "Students can manage their own attempts." ON public.exam_attempts FOR ALL USING (public.get_my_role() = 'siswa' AND student_uid = auth.uid()) WITH CHECK (public.get_my_role() = 'siswa' AND student_uid = auth.uid());
CREATE POLICY "Teachers can view attempts for their students." ON public.exam_attempts FOR SELECT USING (public.get_my_role() = 'guru' AND (exam_id IN (SELECT id FROM public.exams WHERE teacher_id = auth.uid())));

-- Kebijakan untuk Tabel `assignments`
CREATE POLICY "Teachers can manage their own assignments." ON public.assignments FOR ALL USING (public.get_my_role() = 'guru' AND teacher_id = auth.uid()) WITH CHECK (public.get_my_role() = 'guru' AND teacher_id = auth.uid());
CREATE POLICY "Students can view assignments for their class." ON public.assignments FOR SELECT USING (public.get_my_role() = 'siswa' AND teacher_id = public.get_my_teacher_id() AND (assigned_to_class = 'all' OR assigned_to_class = public.get_my_class_info()));

-- Kebijakan untuk Tabel `submissions`
CREATE POLICY "Students can manage their own submissions." ON public.submissions FOR ALL USING (public.get_my_role() = 'siswa' AND student_uid = auth.uid()) WITH CHECK (public.get_my_role() = 'siswa' AND student_uid = auth.uid());
CREATE POLICY "Teachers can manage submissions for their assignments." ON public.submissions FOR ALL USING (public.get_my_role() = 'guru' AND assignment_id IN (SELECT id FROM public.assignments WHERE teacher_id = auth.uid())) WITH CHECK (public.get_my_role() = 'guru' AND assignment_id IN (SELECT id FROM public.assignments WHERE teacher_id = auth.uid()));

-- --- Kebijakan untuk Penyimpanan (Storage) ---
-- Skrip di bawah ini akan membuat 4 kebijakan utama untuk bucket `matiku_storage` Anda.

-- KEBIJAKAN 1: KONTROL FILE GURU
-- Penjelasan: Memberikan kontrol penuh (SELECT, INSERT, UPDATE, DELETE) kepada guru HANYA pada
-- file-file yang berada di dalam folder-folder spesifik milik mereka (modules, files, assignments).
-- Ini memastikan guru A tidak dapat mengakses file guru B.
CREATE POLICY "Guru dapat mengelola file mereka sendiri" ON storage.objects FOR ALL
USING (
  bucket_id = 'matiku_storage' AND
  public.get_my_role() = 'guru' AND
  (
    name LIKE ('modules/' || auth.uid()::text || '/%') OR
    name LIKE ('files/' || auth.uid()::text || '/%') OR
    name LIKE ('assignments/' || auth.uid()::text || '/%')
  )
) WITH CHECK (
  bucket_id = 'matiku_storage' AND
  public.get_my_role() = 'guru' AND
  (
    name LIKE ('modules/' || auth.uid()::text || '/%') OR
    name LIKE ('files/' || auth.uid()::text || '/%') OR
    name LIKE ('assignments/' || auth.uid()::text || '/%')
  )
);

-- KEBIJAKAN 2: MANAJEMEN FOTO PROFIL
-- Penjelasan: Kebijakan ini mengizinkan SEMUA pengguna yang terautentikasi (baik guru maupun siswa)
-- untuk mengelola (mengunggah, memperbarui, menghapus) foto profil MEREKA SENDIRI.
-- Foto disimpan dengan path `profile_pictures/{user_id}`, mengisolasi data setiap pengguna.
CREATE POLICY "Users can manage their own profile picture" ON storage.objects FOR ALL
USING (
  bucket_id = 'matiku_storage' AND
  auth.role() = 'authenticated' AND
  name = ('profile_pictures/' || auth.uid()::text)
) WITH CHECK (
  bucket_id = 'matiku_storage' AND
  auth.role() = 'authenticated' AND
  name = ('profile_pictures/' || auth.uid()::text)
);

-- KEBIJAKAN 3: IZIN UPLOAD SISWA
-- Penjelasan: Kebijakan ini SANGAT KETAT. Siswa HANYA diizinkan untuk
-- melakukan aksi INSERT (mengunggah) file ke dalam folder `submissions` pribadi mereka.
-- Mereka tidak bisa melihat, mengubah, atau menghapus file apa pun, bahkan file mereka sendiri,
-- melalui penyimpanan langsung. Ini menjaga integritas data submisi.
CREATE POLICY "Siswa dapat mengunggah submisi tugas" ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'matiku_storage' AND
    public.get_my_role() = 'siswa' AND
    name LIKE ('submissions/' || auth.uid()::text || '/%')
);

-- KEBIJAKAN 4: IZIN MELIHAT FILE
-- Penjelasan: Kebijakan ini mengizinkan semua pengguna yang sudah login (guru dan siswa)
-- untuk melakukan aksi SELECT (melihat/mengunduh) file. Ini PENTING agar siswa dapat
-- mengunduh lampiran tugas yang diunggah guru, dan guru dapat mengunduh submisi siswa.
-- Tanpa kebijakan ini, tautan unduhan tidak akan berfungsi.
CREATE POLICY "Allow authenticated users to view files" ON storage.objects FOR SELECT
USING (
  bucket_id = 'matiku_storage' AND
  auth.role() = 'authenticated'
);

-- ##################################################################################
-- ## SETUP SELESAI                                                                ##
-- ## Anda sekarang siap untuk menjalankan aplikasi Matiku LMS.                    ##
-- ##################################################################################