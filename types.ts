export type UserRole = 'guru' | 'siswa' | null;

export interface Score {
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
  scores?: { [key: string]: Score };
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
