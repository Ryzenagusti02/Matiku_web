import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { Student, Module, Assessment, Notification, Exam, ExamAttempt, Assignment, Submission } from '../types';

import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import DataSiswa from './DataSiswa';
import ModulAjar from './ModulAjar';
import UjianCbt from './UjianCbt';
import Penilaian from './Penilaian';
import Analitik from './Analitik';
import AiAssistantPage from './AiAssistantPage';
import Pengaturan from './Pengaturan';
import ManajemenFile from './ManajemenFile';
import Penugasan from './Penugasan';

interface MainLayoutProps {
    user: User;
    students: Student[];
    modules: Module[];
    notifications: Notification[];
    exams: Exam[];
    examAttempts: ExamAttempt[];
    assignments: Assignment[];
    submissions: Submission[];
    refreshData: () => void;
    addNotification: (message: string) => void;
    markNotificationsAsRead: () => void;
    onProfileUpdate: () => Promise<void>;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
    user, 
    students, 
    modules, 
    notifications,
    exams,
    examAttempts,
    assignments,
    submissions,
    refreshData, 
    addNotification, 
    markNotificationsAsRead,
    onProfileUpdate 
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isScrolled, setIsScrolled] = useState(false);
    const mainContentRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const mainEl = mainContentRef.current;
        const handleScroll = () => {
            if (mainEl) {
                setIsScrolled(mainEl.scrollTop > 10);
            }
        };

        mainEl?.addEventListener('scroll', handleScroll);
        return () => {
            mainEl?.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleProfileUpdateAndRedirect = async () => {
        await onProfileUpdate();
        setCurrentPage('dashboard');
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                const penilaianSelesai = students.reduce((acc, s) => acc + (s.scores ? Object.keys(s.scores).length : 0), 0);
                const allScores = students.flatMap(s => (s.scores ? Object.values(s.scores).map((assessment: Assessment) => assessment.score) : []));
                const rataRataNilai = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : 'N/A';
                return <Dashboard 
                    totalSiswa={students.length} 
                    totalModul={modules.length}
                    penilaianSelesai={`${penilaianSelesai}`}
                    rataRataNilai={rataRataNilai}
                    students={students}
                />;
            case 'data-siswa':
                return <DataSiswa students={students} refreshData={refreshData} addNotification={addNotification} />;
            case 'modul-ajar':
                return <ModulAjar modules={modules} refreshData={refreshData} addNotification={addNotification} />;
            case 'penugasan':
                return <Penugasan 
                    user={user}
                    assignments={assignments}
                    submissions={submissions}
                    students={students}
                    refreshData={refreshData}
                    addNotification={addNotification}
                />;
            case 'manajemen-file':
                return <ManajemenFile user={user} />;
            case 'ujian-cbt':
                return <UjianCbt exams={exams} students={students} examAttempts={examAttempts} refreshData={refreshData} addNotification={addNotification} />;
            case 'penilaian':
                return <Penilaian students={students} modules={modules} refreshData={refreshData} addNotification={addNotification} />;
            case 'analitik':
                return <Analitik students={students} modules={modules} />;
            case 'ai-assistant':
                return <AiAssistantPage />;
            case 'pengaturan':
                return <Pengaturan user={user} onProfileUpdate={handleProfileUpdateAndRedirect} />;
            default:
                return <Dashboard 
                    totalSiswa={students.length} 
                    totalModul={modules.length}
                    penilaianSelesai="0"
                    rataRataNilai="0"
                    students={students}
                />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    user={user} 
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen} 
                    setCurrentPage={setCurrentPage} 
                    isScrolled={isScrolled} 
                    notifications={notifications}
                    onOpenNotifications={markNotificationsAsRead}
                />
                <main ref={mainContentRef} className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-6">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;