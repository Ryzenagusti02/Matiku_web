import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient';
import SiswaDashboard from './SiswaDashboard';
import { Student, Exam, ExamAttempt, Assignment, Submission } from '../types';
import Swal from 'sweetalert2';

interface SiswaAppProps {
    user: User;
}

const SiswaApp: React.FC<SiswaAppProps> = ({ user }) => {
    const [studentData, setStudentData] = useState<Student | undefined>(undefined);
    const [teacherExams, setTeacherExams] = useState<Exam[]>([]);
    const [studentExamAttempts, setStudentExamAttempts] = useState<ExamAttempt[]>([]);
    const [studentAssignments, setStudentAssignments] = useState<Assignment[]>([]);
    const [studentSubmissions, setStudentSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('teacher_id')
                .eq('id', user.id)
                .single();
            
            if (profileError || !userProfile) throw new Error("Could not fetch user profile.");

            const teacherUid = userProfile.teacher_id;
            if (teacherUid) {
                const { data: studentProfile, error: studentError } = await supabase.from('students').select('*').eq('uid', user.id).eq('teacher_id', teacherUid).single();
                if (studentError) console.error("Error fetching student data:", studentError.message);
                
                let studentClassInfo = '';
                if (studentProfile) {
                    setStudentData(studentProfile as Student);
                    studentClassInfo = `${studentProfile.grade} - ${studentProfile.class}`;
                }

                const [examsRes, attemptsRes, assignmentsRes, submissionsRes] = await Promise.all([
                    supabase.from('exams').select('*').eq('teacher_id', teacherUid).order('created_at', { ascending: false }),
                    supabase.from('exam_attempts').select('*').eq('student_uid', user.id),
                    supabase.from('assignments').select('*').eq('teacher_id', teacherUid).or(`assigned_to_class.eq.all,assigned_to_class.eq.${studentClassInfo}`).order('due_date', { ascending: true }),
                    supabase.from('submissions').select('*').eq('student_uid', user.id),
                ]);

                if (examsRes.error) throw examsRes.error;
                if (attemptsRes.error) throw attemptsRes.error;
                if (assignmentsRes.error) throw assignmentsRes.error;
                if (submissionsRes.error) throw submissionsRes.error;

                setTeacherExams(examsRes.data as Exam[]);
                setStudentExamAttempts(attemptsRes.data as ExamAttempt[]);
                setStudentAssignments(assignmentsRes.data as Assignment[]);
                setStudentSubmissions(submissionsRes.data as Submission[]);
            }
        } catch (error: any) {
            console.error("Error fetching siswa data:", error.message);
            Swal.fire({
                title: 'Gagal Memuat Data',
                text: 'Tidak dapat mengambil data siswa. Periksa koneksi internet Anda dan coba lagi.',
                icon: 'error',
                background: '#1f2937',
                color: '#e5e7eb'
            });
        } finally {
            setIsLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
                <img src="/favicon.svg" alt="Memuat Matiku LMS" className="w-24 h-24 animate-pulse-logo" />
                <p className="mt-4 text-lg text-gray-400">Memuat data siswa...</p>
            </div>
        );
    }

    return (
        <SiswaDashboard
            user={user}
            studentData={studentData}
            exams={teacherExams}
            attempts={studentExamAttempts}
            assignments={studentAssignments}
            submissions={studentSubmissions}
            refreshData={refreshData}
        />
    );
};

export default SiswaApp;