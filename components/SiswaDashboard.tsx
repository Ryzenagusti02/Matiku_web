import React, { useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/firebase'; // Should be renamed
import Swal from 'sweetalert2';
import { Student, Module, Score } from '../types';
import StatCard from './StatCard';
import { ClipboardCheckIcon, BookOpenIcon, StarIcon } from './icons';


interface SiswaDashboardProps {
    user: User;
    studentData: Student | undefined;
    modules: Module[];
}

const SiswaDashboard: React.FC<SiswaDashboardProps> = ({ user, studentData, modules }) => {

    const handleLogout = () => {
        Swal.fire({
            title: 'Anda yakin ingin keluar?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, keluar!',
            cancelButtonText: 'Batal',
            background: '#1f2937',
            color: '#e5e7eb'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await supabase.auth.signOut();
            }
        });
    };

    const academicSummary = useMemo(() => {
        if (!studentData || !studentData.scores) {
            return { average: 'N/A', completed: 0, highest: 'N/A' };
        }
        const scores = Object.values(studentData.scores).map((s: Score) => s.score);
        if (scores.length === 0) {
            return { average: 'N/A', completed: 0, highest: 'N/A' };
        }
        const average = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        const completed = scores.length;
        const highest = Math.max(...scores);
        return { average, completed, highest: highest.toString() };
    }, [studentData]);

    const upcomingTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return modules
            .filter(m => m.due_date && new Date(m.due_date) >= today)
            .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
    }, [modules]);
    
    const displayName = user.user_metadata?.display_name || user.email;


    if (!studentData) {
         return (
             <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
                <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
                    <div className="flex items-center">
                        <img src="/favicon.svg" alt="Matiku LMS Logo" className="w-8 h-8"/>
                        <span className="ml-3 text-xl font-semibold text-white">Matiku LMS - Siswa</span>
                    </div>
                     <div className="flex items-center">
                        <span className="mr-4 text-sm font-medium text-gray-300">{displayName}</span>
                        <button onClick={handleLogout} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">Keluar</button>
                    </div>
                </header>
                <main className="flex-1 p-6 flex items-center justify-center">
                    <div className="text-center bg-gray-800 p-8 rounded-lg">
                        <h2 className="text-2xl font-bold text-white">Selamat Datang, {displayName}!</h2>
                        <p className="text-gray-400 mt-2">Anda belum terdaftar di kelas manapun. Harap hubungi guru Anda.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
            <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center">
                    <img src="/favicon.svg" alt="Matiku LMS Logo" className="w-8 h-8"/>
                    <span className="ml-3 text-xl font-semibold text-white">Matiku LMS - Siswa</span>
                </div>
                <div className="flex items-center">
                    <span className="mr-4 text-sm font-medium text-gray-300">{displayName}</span>
                     <button onClick={handleLogout} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
                        Keluar
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 animate-fade-in-up">
                <h1 className="text-3xl font-bold text-white mb-6">Halo, {displayName}!</h1>

                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">Ringkasan Akademik</h2>
                     <div className="grid gap-6 md:grid-cols-3">
                        <StatCard title="Rata-rata Nilai" value={academicSummary.average}><ClipboardCheckIcon className="w-8 h-8 text-white"/></StatCard>
                        <StatCard title="Modul Selesai" value={academicSummary.completed.toString()}><BookOpenIcon className="w-8 h-8 text-white"/></StatCard>
                        <StatCard title="Nilai Tertinggi" value={academicSummary.highest}><StarIcon className="w-8 h-8 text-white"/></StatCard>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-semibold text-white mb-4">Tugas Mendatang</h3>
                            <div className="space-y-3">
                                {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                                    <div key={task.id} className="p-3 bg-gray-700 rounded-md">
                                        <p className="font-semibold text-gray-200">{task.title}</p>
                                        <p className="text-sm text-yellow-400">Tenggat: {new Date(task.due_date!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                )) : <p className="text-sm text-gray-500">Tidak ada tugas mendatang.</p>}
                            </div>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-semibold text-white mb-4">Hasil Penilaian</h3>
                            <div className="space-y-2">
                               {studentData.scores && Object.keys(studentData.scores).length > 0 ? Object.values(studentData.scores).map((score: Score) => (
                                   <div key={score.materiId} className="flex justify-between items-center text-sm p-2 bg-gray-700 rounded-md">
                                        <span className="text-gray-300">{score.materi}</span>
                                        <span className="font-semibold text-blue-400">{score.score}</span>
                                   </div>
                               )) : <p className="text-sm text-gray-500">Belum ada penilaian.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold text-white mb-4">Daftar Modul Ajar</h3>
                        <div className="space-y-4">
                            {modules.map(module => (
                                <div key={module.id} className="bg-gray-700 p-4 rounded-lg">
                                    <h4 className="text-lg font-semibold text-white">{module.title}</h4>
                                    <p className="text-sm text-gray-400 mt-1">{module.description}</p>
                                    <div className="mt-3">
                                        <a href={module.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:underline">
                                            Lihat PDF: {module.file_name}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SiswaDashboard;
