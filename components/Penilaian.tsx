import React, { useState } from 'react';
import { Student, Module, Score } from '../types';
import { EditIcon, TrashIcon, XIcon, SparklesIcon } from './icons';
import { supabase } from '../config/firebase'; // Should be renamed
import { ai } from '../config/api';
import Swal from 'sweetalert2';

interface PenilaianProps {
    students: Student[];
    modules: Module[];
    refreshData: () => void;
    addNotification: (message: string) => void;
}

const Penilaian: React.FC<PenilaianProps> = ({ students, modules, refreshData, addNotification }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [isAiModalOpen, setAiModalOpen] = useState(false);
    const [currentScore, setCurrentScore] = useState<Partial<Score>>({});
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aiRecommendation, setAiRecommendation] = useState('');

    const handleOpenModal = (studentId: string | null = null, score: Score | null = null) => {
        if (score && studentId) {
            setCurrentScore(score);
            setSelectedStudentId(studentId);
        } else {
            setCurrentScore({ score: 80 }); // Default score
            setSelectedStudentId(students[0]?.id || '');
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setCurrentScore({});
        setSelectedStudentId('');
    };

    const handleDelete = async (studentId: string, materiId: string) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;
        
        const result = await Swal.fire({
            title: 'Hapus Penilaian?',
            text: `Penilaian untuk ${student.name} pada materi ini akan dihapus.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal',
            background: '#1f2937', color: '#e5e7eb'
        });

        if (result.isConfirmed) {
            try {
                const newScores = { ...student.scores };
                delete newScores[materiId];

                const { error } = await supabase.from('students').update({ scores: newScores }).eq('id', studentId);
                if (error) throw error;

                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Penilaian dihapus!', showConfirmButton: false, timer: 3000, timerProgressBar: true, background: '#1f2937', color: '#e5e7eb' });
                addNotification(`Penilaian untuk ${student.name} telah dihapus.`);
                refreshData();
            } catch (error: any) {
                Swal.fire({ title: 'Error!', text: error.message || 'Gagal menghapus penilaian.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
            }
        }
    };
    
    const handleSave = async () => {
        if (!selectedStudentId || !currentScore.materiId || !currentScore.analysis || currentScore.score === undefined) {
            Swal.fire({ title: 'Input Tidak Lengkap', text: 'Semua kolom harus diisi.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
            return;
        }
        
        setIsLoading(true);
        const student = students.find(s => s.id === selectedStudentId)!;
        const module = modules.find(m => m.id === currentScore.materiId)!;
        
        try {
            const scoreData: Score = {
                id: currentScore.materiId,
                materiId: currentScore.materiId,
                materi: module.title,
                analysis: currentScore.analysis,
                score: currentScore.score,
                date: new Date().toISOString(),
                summary: '', // To be filled by AI
                recommendation: '', // To be filled by AI
            };

            const newScores = {
                ...student.scores,
                [currentScore.materiId]: scoreData,
            };

            const { error } = await supabase.from('students').update({ scores: newScores }).eq('id', selectedStudentId);
            if (error) throw error;


            addNotification(`Penilaian untuk ${student.name} pada materi '${module.title}' berhasil disimpan.`);
            refreshData();
            handleCloseModal();
            
            const prompt = `Seorang siswa mendapatkan skor ${scoreData.score} untuk materi "${scoreData.materi}". Analisis guru adalah: "${scoreData.analysis}". Berdasarkan skor dan analisis ini, berikan rekomendasi singkat dan actionable untuk siswa dalam beberapa paragraf. Jangan gunakan format tebal atau miring.`;
            const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setAiRecommendation(result.text);
            setAiModalOpen(true);

        } catch (error: any) {
            console.error("Error saving assessment:", error.message);
            Swal.fire({ title: 'Error', text: error.message || 'Gagal menyimpan penilaian.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-medium text-white">Penilaian Siswa</h3>
                <button onClick={() => handleOpenModal()} disabled={students.length === 0 || modules.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                    + Nilai Baru
                </button>
            </div>
            <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama Siswa</th>
                                <th scope="col" className="px-6 py-3">Materi Penilaian</th>
                                <th scope="col" className="px-6 py-3">Skor</th>
                                <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.flatMap(student => 
                                student.scores ? Object.values(student.scores).map(score => (
                                    <tr key={`${student.id}-${score.materiId}`} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{student.name}</td>
                                        <td className="px-6 py-4">{score.materi}</td>
                                        <td className="px-6 py-4 font-semibold text-blue-400">{score.score}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleOpenModal(student.id, score)} className="text-gray-400 hover:text-blue-400 mr-4"><EditIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete(student.id, score.materiId)} className="text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                )) : []
                            )}
                             {students.every(s => !s.scores || Object.keys(s.scores).length === 0) && (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">Belum ada data penilaian.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {isModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-semibold text-white mb-4">{currentScore.id ? 'Edit Penilaian' : 'Input Penilaian Baru'}</h2>
                        <div className="space-y-4">
                            <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} disabled={!!currentScore.id} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md disabled:opacity-50">
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select value={currentScore.materiId || ''} onChange={(e) => setCurrentScore({ ...currentScore, materiId: e.target.value })} disabled={!!currentScore.id} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md disabled:opacity-50">
                                 <option value="" disabled>Pilih Materi</option>
                                {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                            </select>
                             <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Skor (0-100)</label>
                                <input type="number" min="0" max="100" value={currentScore.score || ''} onChange={(e) => setCurrentScore({ ...currentScore, score: parseInt(e.target.value) })} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md" />
                            </div>
                            <textarea placeholder="Analisis Kualitatif Guru..." value={currentScore.analysis || ''} onChange={(e) => setCurrentScore({ ...currentScore, analysis: e.target.value })} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md h-32" />
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={handleCloseModal} className="px-4 py-2 text-gray-300 rounded-md hover:bg-gray-700">Batal</button>
                            <button onClick={handleSave} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-800">{isLoading ? 'Menyimpan...' : 'Simpan'}</button>
                        </div>
                    </div>
                 </div>
            )}
            
            {isAiModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-white flex items-center"><SparklesIcon className="w-6 h-6 mr-2 text-purple-400" /> Rekomendasi AI</h2>
                            <button onClick={() => setAiModalOpen(false)} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-md min-h-[200px]">
                            <pre className="text-gray-300 whitespace-pre-wrap font-sans">{aiRecommendation || 'Memuat...'}</pre>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setAiModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Tutup</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Penilaian;