import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from './config/supabaseClient';
import Swal from 'sweetalert2';

import AuthPage from './components/AuthPage';
import GuruApp from './components/GuruApp';
import SiswaApp from './components/SiswaApp';
import VerificationSuccessPage from './components/VerificationSuccessPage';
import { UserRole } from './types';

const AppContent: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (!currentUser) {
                setUserRole(null);
                setIsLoading(false);
                return;
            }

            try {
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
                        setIsLoading(false);
                        return;
                    }

                    const role = selectedRole ? 'guru' : 'siswa';

                    if (!profile) {
                        let username = (currentUser.user_metadata?.display_name?.toLowerCase().replace(/\s/g, '') || `user${Date.now()}`).slice(0, 15);
                        
                        const generateUniqueUsername = async (baseUsername: string): Promise<string> => {
                            let uniqueUsername = baseUsername;
                            let isUnique = false;
                            for (let i = 0; i < 5 && !isUnique; i++) {
                                const { data } = await supabase.from('profiles').select('id').eq('username', uniqueUsername).single();
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
                
                setUserRole(profile.role);

            } catch (error: any) {
                console.error("Error during auth state change:", error.message);
                Swal.fire('Error Kritis', `Terjadi masalah saat memuat profil Anda: ${error.message}. Anda akan dikeluarkan.`, 'error');
                await supabase.auth.signOut();
            } finally {
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (isLoading || (user && !userRole)) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
                <img src="/favicon.svg" alt="Memuat Matiku LMS" className="w-24 h-24 animate-pulse-logo" />
                <p className="mt-4 text-lg text-gray-400">Memuat data pengguna...</p>
            </div>
        );
    }

    if (!user) {
        return <AuthPage />;
    }

    if (userRole === 'guru') {
        return <GuruApp user={user} />;
    }

    if (userRole === 'siswa') {
        return <SiswaApp user={user} />;
    }

    return null;
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