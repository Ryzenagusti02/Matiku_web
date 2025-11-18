export type UserRole = 'guru' | 'siswa' | null;

export interface Profile {
  id: string; // auth.users.id
  email?: string;
  username?: string;
  role: UserRole;
  teacher_id?: string | null; // profiles.id of the teacher
  created_at?: string;
}

export interface Assessment {
  id?: string;
  materiId: string;
  materi: string;
  analysis: string;
  score: number;
  summary: string;
  recommendation: string;
  date: string; // ISO 8601 string
}

export interface Student {
  id: string; // UUID of the row in the 'students' table
  name: string;
  grade: string;
  class: string;
  scores?: { [key: string]: Assessment };
  created_at?: string; // ISO 8601 string
  uid: string; // The student's auth UID (from profiles table)
}

export interface Module {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  due_date?: string;
  created_at: string; // ISO 8601 string
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string; // ISO 8601 string
}

// --- CBT Exam Types ---

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
}

export interface Exam {
  id: string;
  teacher_id: string;
  title: string;
  duration_minutes: number;
  created_at: string;
  questions?: Question[]; // Optional: for holding questions when fetched together
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  student_uid: string;
  score: number;
  answers: { [questionId: string]: number }; // questionId -> selectedOptionIndex
  started_at: string;
  completed_at: string | null;
}

// --- Assignment Types ---

export interface Assignment {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  due_date: string | null;
  assigned_to_class: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  student_uid: string;
  file_url: string;
  file_name: string;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  status: string; // 'Terkumpul' or 'Terlambat'
}