import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient';
import MainLayout from './MainLayout';
import { Student, Module, Notification, Exam, ExamAttempt, Assignment, Submission } from '../types';
import Swal from 'sweetalert2';

interface GuruAppProps {
    user: User;
}

const GuruApp: React.FC<GuruAppProps> = ({ user }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [studentsRes, modulesRes, notificationsRes, examsRes, assignmentsRes] = await Promise.all([
                supabase.from('students').select('*').eq('teacher_id', user.id).order('created_at', { ascending: false }),
                supabase.from('modules').select('*').eq('teacher_id', user.id).order('created_at', { ascending: false }),
                supabase.from('notifications').select('*').eq('teacher_id', user.id).order('created_at', { ascending: false }).limit(20),
                supabase.from('exams').select('*, questions(*)').eq('teacher_id', user.id).order('created_at', { ascending: false }),
                supabase.from('assignments').select('*').eq('teacher_id', user.id).order('created_at', { ascending: false })
            ]);

            if (studentsRes.error) throw studentsRes.error;
            if (modulesRes.error) throw modulesRes.error;
            if (notificationsRes.error) throw notificationsRes.error;
            if (examsRes.error) throw examsRes.error;
            if (assignmentsRes.error) throw assignmentsRes.error;

            const fetchedStudents = studentsRes.data as Student[];

            // --- BEGIN: Student Name Synchronization Logic ---
            // This block ensures that the student names displayed on the teacher's dashboard
            // are always the latest usernames from the student's profile.
            if (fetchedStudents.length > 0) {
                const studentUids = fetchedStudents.map(s => s.uid);
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, username')
                    .in('id', studentUids);

                if (profileError) {
                    console.warn('Could not fetch student profiles for name sync:', profileError.message);
                } else {
                    const profileMap = new Map(profiles.map(p => [p.id, p.username]));
                    const updatesToPerform: Promise<any>[] = [];

                    fetchedStudents.forEach(student => {
                        const profileUsername = profileMap.get(student.uid);
                        if (profileUsername && profileUsername !== student.name) {
                            // The name in 'students' table is outdated.
                            // 1. Optimistically update the local data for immediate UI refresh.
                            student.name = profileUsername;
                            // 2. Queue a database update to sync the data permanently.
                            // FIX: The Supabase query builder returns a "thenable" which is not a full Promise.
                            // `Promise.resolve()` is used to convert it, matching the `updatesToPerform` array's type.
                            updatesToPerform.push(
                                Promise.resolve(supabase.from('students').update({ name: profileUsername }).eq('id', student.id))
                            );
                        }
                    });

                    if (updatesToPerform.length > 0) {
                        console.log(`Syncing names for ${updatesToPerform.length} students.`);
                        // Perform all updates in the background. We don't need to `await` this
                        // for the UI to update, as we've already updated the local data.
                        Promise.all(updatesToPerform).catch(err => {
                            console.error("Error during background student name sync:", err);
                        });
                    }
                }
            }
            // --- END: Student Name Synchronization Logic ---


            setStudents(fetchedStudents);
            setModules(modulesRes.data as Module[]);
            setNotifications(notificationsRes.data as Notification[]);
            setExams(examsRes.data as Exam[]);
            setAssignments(assignmentsRes.data as Assignment[]);

            const examIds = examsRes.data.map(e => e.id);
            if (examIds.length > 0) {
                const { data, error } = await supabase.from('exam_attempts').select('*').in('exam_id', examIds);
                if (error) throw error;
                setExamAttempts(data as ExamAttempt[]);
            } else {
                setExamAttempts([]);
            }

            const assignmentIds = assignmentsRes.data.map(a => a.id);
            if (assignmentIds.length > 0) {
                const { data, error } = await supabase.from('submissions').select('*').in('assignment_id', assignmentIds);
                if (error) throw error;
                setSubmissions(data as Submission[]);
            } else {
                setSubmissions([]);
            }
        } catch (error: any) {
            console.error("Error fetching guru data:", error.message);
            Swal.fire({
                title: 'Gagal Memuat Data',
                text: 'Tidak dapat mengambil data guru. Periksa koneksi internet Anda dan coba lagi.',
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

    const addNotification = useCallback(async (message: string) => {
        if (!user) return;
        try {
            await supabase.from('notifications').insert({ message, read: false, teacher_id: user.id });
            await refreshData();
        } catch (error: any) {
            console.error("Error adding notification:", error.message);
        }
    }, [user, refreshData]);

    const markNotificationsAsRead = useCallback(async () => {
        const unreadNotifIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadNotifIds.length === 0) return;

        const { error } = await supabase.from('notifications').update({ read: true }).in('id', unreadNotifIds);
        if (error) {
            console.error("Error marking notifications as read:", error.message);
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    }, [notifications]);

    const onProfileUpdate = async () => {
        await addNotification('Profil Anda berhasil diperbarui.');
    };

    if (isLoading) {
         return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
                <img src="/favicon.svg" alt="Memuat Matiku LMS" className="w-24 h-24 animate-pulse-logo" />
                <p className="mt-4 text-lg text-gray-400">Memuat data guru...</p>
            </div>
        );
    }

    return (
        <MainLayout
            user={user}
            students={students}
            modules={modules}
            notifications={notifications}
            exams={exams}
            examAttempts={examAttempts}
            assignments={assignments}
            submissions={submissions}
            refreshData={refreshData}
            addNotification={addNotification}
            markNotificationsAsRead={markNotificationsAsRead}
            onProfileUpdate={onProfileUpdate}
        />
    );
};

export default GuruApp;