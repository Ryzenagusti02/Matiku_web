import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from './config/firebase'; // Note: Should be renamed to './config/supabase'

import AuthPage from './components/AuthPage';
import MainLayout from './components/MainLayout';
import SiswaDashboard from './components/SiswaDashboard';
import VerificationSuccessPage from './components/VerificationSuccessPage';
import { Student, Module, Notification, UserRole } from './types';
import Swal from 'sweetalert2';

const AppContent: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Teacher-specific state
    const [students, setStudents] = useState<Student[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    // Student-specific state
    const [studentData, setStudentData] = useState<Student | undefined>(undefined);
    const [teacherModules, setTeacherModules] = useState<Module[]>([]);

    const fetchGuruData = async (currentUser: User) => {
        const { data: studentsData, error: studentsError } = await supabase.from('students').select('*').eq('teacher_id', currentUser.id).order('created_at', { ascending: false });
        if (studentsError) throw studentsError;
        setStudents(studentsData as Student[]);

        const { data: modulesData, error: modulesError } = await supabase.from('modules').select('*').eq('teacher_id', currentUser.id).order('created_at', { ascending: false });
        if (modulesError) throw modulesError;
        setModules(modulesData as Module[]);
        
        const { data: notificationsData, error: notificationsError } = await supabase.from('notifications').select('*').eq('teacher_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
        if (notificationsError) throw notificationsError;
        setNotifications(notificationsData as Notification[]);
    };

    const fetchSiswaData = async (currentUser: User, userProfile: any) => {
        const teacherUid = userProfile?.teacher_id;
        if (teacherUid) {
            const { data: studentProfile, error: studentError } = await supabase.from('students').select('*').eq('uid', currentUser.id).eq('teacher_id', teacherUid).single();
            if (studentError) console.error("Error fetching student data:", studentError.message);
            if (studentProfile) {
                setStudentData(studentProfile as Student);
            }

            const { data: modulesData, error: modulesError } = await supabase.from('modules').select('*').eq('teacher_id', teacherUid).order('created_at', { ascending: false });
            if (modulesError) throw modulesError;
            setTeacherModules(modulesData as Module[]);
        }
    };
    
    const refreshData = useCallback(async (currentUser: User | null, profile?: any) => {
        if (!currentUser) return;

        let userProfile = profile;
        if (!userProfile) {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
            if (error || !data) {
                console.error("CRITICAL: User profile not found for UID:", currentUser.id);
                await supabase.auth.signOut();
                return;
            }
            userProfile = data;
        }
        
        const role = userProfile.role;
        setUserRole(role);

        if (role === 'guru') {
            await fetchGuruData(currentUser);
        } else if (role === 'siswa') {
            await fetchSiswaData(currentUser, userProfile);
        }
    }, []);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setIsLoading(true);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            
            try {
                if (currentUser) {
                    let { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
                    
                    if (!profile || !profile.role) {
                        const { value: selectedRole } = await Swal.fire({
                            title: 'Pilih Peran Anda',
                            text: 'Daftar sebagai Guru atau Siswa untuk melanjutkan.',
                            icon: 'info',
                            showDenyButton: true,
                            confirmButtonText: 'Saya Guru',
                            denyButtonText: 'Saya Siswa',
                            confirmButtonColor: '#3085d6',
                            denyButtonColor: '#3085d6',
                            background: '#1f2937', color: '#e5e7eb',
                            allowOutsideClick: false, allowEscapeKey: false,
                        });

                         if (selectedRole === undefined) {
                            await supabase.auth.signOut();
                            return;
                        }
                        
                        const role = selectedRole ? 'guru' : 'siswa';

                        if (!profile) {
                            let username = (currentUser.user_metadata?.display_name?.toLowerCase().replace(/\s/g, '') || `user${Date.now()}`).slice(0, 15);
                            
                            const generateUniqueUsername = async (baseUsername: string): Promise<string> => {
                                let uniqueUsername = baseUsername;
                                let isUnique = false;
                                for (let i = 0; i < 5 && !isUnique; i++) {
                                    const { data, error } = await supabase.from('profiles').select('id').eq('username', uniqueUsername).single();
                                    if (error && error.code !== 'PGRST116') throw error;
                                    if (!data) {
                                        isUnique = true;
                                    } else {
                                        uniqueUsername = `${baseUsername.slice(0, 10)}${Math.floor(1000 + Math.random() * 9000)}`;
                                    }
                                }
                                if (!isUnique) throw new Error('Gagal membuat username unik.');
                                return uniqueUsername;
                            };
                            
                            const finalUsername = await generateUniqueUsername(username);

                            const { data: newProfile, error: insertError } = await supabase.from('profiles').insert({
                                id: currentUser.id, email: currentUser.email, username: finalUsername, role: role
                            }).select().single();

                            if (insertError) throw insertError;
                            profile = newProfile;

                        } else {
                            const { data: updatedProfile, error: updateError } = await supabase.from('profiles').update({ role }).eq('id', currentUser.id).select().single();
                             if (updateError) throw updateError;
                             profile = updatedProfile;
                        }
                    }

                    await refreshData(currentUser, profile);

                } else {
                    setUserRole(null);
                    setStudents([]);
                    setModules([]);
                    setNotifications([]);
                    setStudentData(undefined);
                    setTeacherModules([]);
                }
            } catch (error: any) {
                console.error("Error during auth state change:", error.message);
                Swal.fire('Error Kritis', `Terjadi masalah saat memuat profil Anda: ${error.message}. Anda akan dikeluarkan.`, 'error');
                await supabase.auth.signOut();
            } finally {
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [refreshData]);

    const addNotification = useCallback(async (message: string) => {
        if (!user || userRole !== 'guru') return;
        try {
            await supabase.from('notifications').insert({ message, read: false, teacher_id: user.id });
            await refreshData(user);
        } catch (error: any) {
            console.error("Error adding notification:", error.message);
        }
    }, [user, userRole, refreshData]);

    const markNotificationsAsRead = useCallback(async () => {
         if (!user || userRole !== 'guru') return;
        const unreadNotifIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadNotifIds.length === 0) return;

        const { error } = await supabase.from('notifications').update({ read: true }).in('id', unreadNotifIds);
        if (error) {
            console.error("Error marking notifications as read:", error.message);
        } else {
            setNotifications(prev => prev.map(n => ({...n, read: true})));
        }
    }, [user, userRole, notifications]);
    
    const onProfileUpdate = async () => {
       if (user) {
         await addNotification('Profil Anda berhasil diperbarui.');
       }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
                <img src="/favicon.svg" alt="Memuat Matiku LMS" className="w-24 h-24 animate-pulse-logo" />
                <p className="mt-4 text-lg text-gray-400">Memuat...</p>
            </div>
        );
    }

    if (!user) {
        return <AuthPage />;
    }
    
    if (userRole === 'siswa') {
        return <SiswaDashboard user={user} studentData={studentData} modules={teacherModules} />;
    }

    if (userRole === 'guru') {
        return <MainLayout 
            user={user} 
            students={students} 
            modules={modules} 
            notifications={notifications}
            refreshData={() => refreshData(user)}
            addNotification={addNotification}
            markNotificationsAsRead={markNotificationsAsRead}
            onProfileUpdate={onProfileUpdate}
        />;
    }
    
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
            <img src="/favicon.svg" alt="Memuat Matiku LMS" className="w-24 h-24 animate-pulse-logo" />
            <p className="mt-4 text-lg text-gray-400">Memuat data pengguna...</p>
        </div>
    );
};


const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/verification-success" element={<VerificationSuccessPage />} />
      <Route path="*" element={<AppContent />} />
    </Routes>
  );
};


export default App;
