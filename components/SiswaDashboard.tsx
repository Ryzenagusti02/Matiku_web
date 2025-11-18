import React, { useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient';
import Swal from 'sweetalert2';
import { Student, Assessment, Exam, ExamAttempt, Assignment, Submission } from '../types';
import StatCard from './StatCard';
import { ClipboardCheckIcon, StarIcon, FileTextIcon, XIcon, ClipboardListIcon, SettingsIcon, LogoutIcon, ArrowLeftIcon } from './icons';
import UjianSiswa from './UjianSiswa';
import FileUpload from './FileUpload';
import TutorAiSiswa from './TutorAiSiswa';
import PengaturanSiswa from './PengaturanSiswa';

interface SiswaDashboardProps {
    user: User;
    studentData: Student | undefined;
    exams: Exam[];
    attempts: ExamAttempt[];
    assignments: Assignment[];
    submissions: Submission[];
    refreshData: () => void;
}

const SiswaDashboard: React.FC<SiswaDashboardProps> = ({ user, studentData, exams, attempts, assignments, submissions, refreshData }) => {
    const [takingExam, setTakingExam] = useState<Exam | null>(null);
    const [currentTab, setCurrentTab] = useState<'dashboard' | 'aiTutor' | 'pengaturan'>('dashboard');
    const [isSubmissionModalOpen, setSubmissionModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [fileToSubmit, setFileToSubmit] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

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
                window.location.reload(); // Force reload to ensure redirect to AuthPage
            }
        });
    };

    const academicSummary = useMemo(() => {
        if (!studentData || !studentData.scores) {
            return { average: 'N/A', highest: 'N/A' };
        }
        const scores = Object.values(studentData.scores).map((s: Assessment) => s.score);
        if (scores.length === 0) {
            return { average: 'N/A', highest: 'N/A' };
        }
        const average = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        const highest = Math.max(...scores);
        return { average, highest: highest.toString() };
    }, [studentData]);

    const startExam = (exam: Exam) => {
        Swal.fire({
            title: `Mulai Ujian: ${exam.title}?`,
            html: `Waktu pengerjaan: <b>${exam.duration_minutes} menit</b>.<br/>Waktu akan dimulai saat Anda menekan tombol 'Mulai'. Pastikan koneksi Anda stabil.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Mulai!',
            cancelButtonText: 'Batal',
            background: '#1f2937', color: '#e5e7eb'
        }).then((result) => {
            if (result.isConfirmed) {
                setTakingExam(exam);
            }
        });
    };
    
    const handleFinishExam = () => {
        setTakingExam(null);
        refreshData();
    }

    const openSubmissionModal = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setFileToSubmit(null);
        setSubmissionModalOpen(true);
    };

    const closeSubmissionModal = () => {
        setSubmissionModalOpen(false);
        setSelectedAssignment(null);
    };

    const handleFileSelect = (file: File) => {
        setFileToSubmit(file);
    };

    const handleSubmitAssignment = async () => {
        if (!fileToSubmit || !selectedAssignment || !studentData) return;

        setIsUploading(true);
        try {
            const filePath = `submissions/${studentData.uid}/${selectedAssignment.id}/${fileToSubmit.name}`;
            const { error: uploadError } = await supabase.storage.from('matiku_storage').upload(filePath, fileToSubmit, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('matiku_storage').getPublicUrl(filePath);
            
            const submissionData = {
                assignment_id: selectedAssignment.id,
                student_id: studentData.id,
                student_uid: studentData.uid,
                file_url: urlData.publicUrl,
                file_name: fileToSubmit.name,
                status: new Date() > new Date(selectedAssignment.due_date!) ? 'Terlambat' : 'Terkumpul'
            };

            const { error: insertError } = await supabase.from('submissions').insert(submissionData);
            if (insertError) throw insertError;

            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Tugas berhasil dikumpulkan!', showConfirmButton: false, timer: 3000, timerProgressBar: true, background: '#1f2937', color: '#e5e7eb' });
            refreshData();
            closeSubmissionModal();

        } catch (error: any) {
            Swal.fire({ title: 'Error', text: error.message || 'Gagal mengumpulkan tugas.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
        } finally {
            setIsUploading(false);
        }
    };
    
    const showResultModal = (submission: Submission) => {
        Swal.fire({
            title: `Hasil Tugas`,
            html: `
                <div class="text-left">
                    <p class="mb-2"><strong class="text-gray-400">Nilai:</strong> <span class="text-xl font-bold text-blue-400">${submission.grade || 'Belum Dinilai'}</span></p>
                    <p><strong class="text-gray-400">Umpan Balik Guru:</strong></p>
                    <p class="p-2 bg-gray-700 rounded-md mt-1 whitespace-pre-wrap">${submission.feedback || 'Tidak ada umpan balik.'}</p>
                </div>
            `,
            background: '#1f2937', color: '#e5e7eb',
        });
    }
    
    const handleProfileUpdate = () => {
        refreshData();
        setCurrentTab('dashboard');
    };

    if (takingExam && studentData) {
        return <UjianSiswa exam={takingExam} student={studentData} onFinish={handleFinishExam} />;
    }
    
    const displayName = user.user_metadata?.display_name || user.email;
    const photoURL = user.user_metadata?.avatar_url;

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
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Terkumpul': return 'bg-green-500';
            case 'Terlambat': return 'bg-yellow-500';
            case 'Dinilai': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    const renderMainContent = () => {
        if (currentTab === 'pengaturan') {
            return (
                <div className="animate-fade-in-up">
                    <div className="mb-6">
                        <button
                            onClick={() => setCurrentTab('dashboard')}
                            className="flex items-center px-4 py-2 text-sm text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                        >
                            <ArrowLeftIcon className="w-5 h-5 mr-2" />
                            Kembali ke Dashboard
                        </button>
                    </div>
                    <PengaturanSiswa user={user} onProfileUpdate={handleProfileUpdate} />
                </div>
            );
        }
        
        return (
            <>
                <div className="border-b border-gray-700 mb-6">
                    <nav className="flex space-x-4">
                        <button onClick={() => setCurrentTab('dashboard')} className={`px-3 py-2 font-medium text-lg rounded-t-lg ${currentTab === 'dashboard' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                            Dashboard
                        </button>
                        <button onClick={() => setCurrentTab('aiTutor')} className={`px-3 py-2 font-medium text-lg rounded-t-lg ${currentTab === 'aiTutor' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                            Tutor AI
                        </button>
                    </nav>
                </div>
                {currentTab === 'dashboard' ? (
                    <div className="animate-fade-in-up">
                        <h1 className="text-3xl font-bold text-white mb-6">Halo, {displayName}!</h1>
                        
                        <h2 className="text-2xl font-semibold text-white mb-4">Ringkasan Akademik</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                            <StatCard title="Tugas Terkumpul" value={`${submissions.length}`}><ClipboardListIcon className="w-8 h-8 text-white"/></StatCard>
                            <StatCard title="Ujian Diikuti" value={`${attempts.length}`}><FileTextIcon className="w-8 h-8 text-white"/></StatCard>
                            <StatCard title="Rata-rata Nilai" value={academicSummary.average}><ClipboardCheckIcon className="w-8 h-8 text-white"/></StatCard>
                            <StatCard title="Nilai Tertinggi" value={academicSummary.highest}><StarIcon className="w-8 h-8 text-white"/></StatCard>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                <h3 className="text-xl font-semibold text-white mb-4">Daftar Penugasan</h3>
                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {assignments.length > 0 ? assignments.map(assignment => {
                                        const submission = submissions.find(s => s.assignment_id === assignment.id);
                                        let status = "Belum Mengumpulkan";
                                        if (submission) {
                                            status = submission.grade ? 'Dinilai' : submission.status;
                                        }
                                        return (
                                            <div key={assignment.id} className="bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                                <div className="mb-3 sm:mb-0">
                                                    <h4 className="text-lg font-semibold text-white">{assignment.title}</h4>
                                                    <p className="text-sm text-yellow-400 mt-1">Tenggat: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('id-ID') : 'Tidak ada'}</p>
                                                     {assignment.file_name && <a href={assignment.file_url!} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-300 hover:underline">Lihat Lampiran</a>}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${getStatusBadge(status)}`}>{status}</span>
                                                    {!submission ? (
                                                        <button onClick={() => openSubmissionModal(assignment)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Kumpulkan</button>
                                                    ) : (
                                                        <button onClick={() => showResultModal(submission)} className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500">Lihat Hasil</button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }) : <p className="text-sm text-gray-500">Tidak ada tugas yang diberikan.</p>}
                                </div>
                            </div>

                            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                <h3 className="text-xl font-semibold text-white mb-4">Ujian Tersedia</h3>
                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {exams.length > 0 ? exams.map(exam => {
                                        const attempt = attempts.find(a => a.exam_id === exam.id);
                                        return (
                                            <div key={exam.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <h4 className="text-lg font-semibold text-white">{exam.title}</h4>
                                                    <p className="text-sm text-gray-400 mt-1">Durasi: {exam.duration_minutes} menit</p>
                                                </div>
                                                <div>
                                                    {attempt ? (
                                                        <div className="text-center">
                                                            <p className="text-sm text-gray-300">Skor Anda:</p>
                                                            <p className="text-xl font-bold text-green-400">{attempt.score.toFixed(1)}</p>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => startExam(exam)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Mulai Ujian</button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }) : <p className="text-sm text-gray-500">Tidak ada ujian yang tersedia saat ini.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <TutorAiSiswa />
                )}
            </>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
            <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center">
                    <img src="/favicon.svg" alt="Matiku LMS Logo" className="w-8 h-8"/>
                    <span className="ml-3 text-xl font-semibold text-white">Matiku LMS - Siswa</span>
                </div>
                <div className="flex items-center">
                    <div className="relative ml-4">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center focus:outline-none"
                        >
                            <span className="mr-2 text-sm font-medium text-gray-300">{displayName}</span>
                            <img
                                className="w-8 h-8 rounded-full object-cover"
                                src={photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=0ea5e9&color=fff`}
                                alt="User Avatar"
                            />
                        </button>
                        
                        {isProfileOpen && (
                             <div
                                onMouseLeave={() => setIsProfileOpen(false)}
                                className="absolute right-0 w-48 mt-2 py-2 bg-gray-800 rounded-md shadow-xl z-20 border border-gray-700"
                             >
                                 <a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('pengaturan'); setIsProfileOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white">
                                     <SettingsIcon className="w-5 h-5 mr-2" />
                                     Pengaturan Akun
                                 </a>
                                 <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="flex items-center px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white">
                                     <LogoutIcon className="w-5 h-5 mr-2" />
                                     Keluar
                                 </a>
                             </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6">
                {renderMainContent()}
            </main>
            
            {isSubmissionModalOpen && selectedAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-white">Kumpulkan Tugas: {selectedAssignment.title}</h2>
                            <button onClick={closeSubmissionModal} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">Unggah file tugas Anda. Pastikan file dalam format PDF.</p>
                        <div className="space-y-4">
                            <FileUpload onFileSelect={handleFileSelect} acceptedTypes="application/pdf" maxSizeMB={10} />
                            {fileToSubmit && <p className="text-sm text-gray-400 mt-2">File dipilih: {fileToSubmit.name}</p>}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleSubmitAssignment} disabled={isUploading || !fileToSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-800">
                                {isUploading ? 'Mengunggah...' : 'Kumpulkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiswaDashboard;