import React, { useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { Assignment, Submission, Student } from '../types';
import { supabase } from '../config/supabaseClient';
import Swal from 'sweetalert2';
import { EditIcon, TrashIcon, XIcon, EyeIcon } from './icons';
import FileUpload from './FileUpload';

interface PenugasanProps {
    user: User;
    assignments: Assignment[];
    submissions: Submission[];
    students: Student[];
    refreshData: () => void;
    addNotification: (message: string) => void;
}

const Penugasan: React.FC<PenugasanProps> = ({ user, assignments, submissions, students, refreshData, addNotification }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [isSubmissionsModalOpen, setSubmissionsModalOpen] = useState(false);
    const [currentAssignment, setCurrentAssignment] = useState<Partial<Assignment>>({});
    const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const classList = useMemo(() => {
        const classes = new Set(students.map(s => `${s.grade} - ${s.class}`));
        return ['all', ...Array.from(classes).sort()];
    }, [students]);

    const openModal = (assignment: Assignment | null = null) => {
        setCurrentAssignment(assignment || { assigned_to_class: 'all' });
        setAssignmentFile(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setCurrentAssignment({});
    };

    const openSubmissionsModal = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setSubmissionsModalOpen(true);
    };

    const closeSubmissionsModal = () => {
        setSubmissionsModalOpen(false);
        setSelectedAssignment(null);
    };

    const handleSave = async () => {
        const { title, description, due_date, assigned_to_class } = currentAssignment;
        if (!title || !assigned_to_class) {
            Swal.fire('Error', 'Judul dan kelas harus diisi.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            let file_url = currentAssignment.file_url || null;
            let file_name = currentAssignment.file_name || null;

            if (assignmentFile) {
                const filePath = `assignments/${user.id}/${Date.now()}_${assignmentFile.name}`;
                const { error: uploadError } = await supabase.storage.from('matiku_storage').upload(filePath, assignmentFile);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('matiku_storage').getPublicUrl(filePath);
                file_url = data.publicUrl;
                file_name = assignmentFile.name;
            }

            const assignmentData = { title, description, due_date, assigned_to_class, file_url, file_name, teacher_id: user.id };

            if (currentAssignment.id) {
                const { error } = await supabase.from('assignments').update(assignmentData).eq('id', currentAssignment.id);
                if (error) throw error;
                addNotification(`Tugas '${title}' berhasil diperbarui.`);
            } else {
                const { error } = await supabase.from('assignments').insert(assignmentData);
                if (error) throw error;
                addNotification(`Tugas baru '${title}' berhasil ditambahkan.`);
            }

            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Tugas berhasil disimpan!', showConfirmButton: false, timer: 3000 });
            refreshData();
            closeModal();
        } catch (error: any) {
            Swal.fire('Error', error.message || 'Gagal menyimpan tugas.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDelete = async (assignment: Assignment) => {
        Swal.fire({
            title: 'Hapus Tugas?',
            text: `Tugas "${assignment.title}" akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, hapus!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const { error } = await supabase.from('assignments').delete().eq('id', assignment.id);
                    if (error) throw error;
                    if (assignment.file_url) {
                        const filePath = assignment.file_url.split('/matiku_storage/')[1];
                        await supabase.storage.from('matiku_storage').remove([filePath]);
                    }
                    Swal.fire('Dihapus!', 'Tugas telah dihapus.', 'success');
                    addNotification(`Tugas '${assignment.title}' telah dihapus.`);
                    refreshData();
                } catch (error: any) {
                    Swal.fire('Error', error.message || 'Gagal menghapus tugas.', 'error');
                }
            }
        });
    };

    const handleGradeSubmission = async (submission: Submission) => {
        const { value } = await Swal.fire({
            title: `Beri Nilai & Umpan Balik`,
            html: `
                <p class="mb-2 text-left">Siswa: <strong>${students.find(s => s.id === submission.student_id)?.name}</strong></p>
                <a href="${submission.file_url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline mb-4 block">Lihat File Submisi</a>
                <input id="swal-input-grade" class="swal2-input" placeholder="Nilai (0-100)" type="number" min="0" max="100" value="${submission.grade || ''}">
                <textarea id="swal-input-feedback" class="swal2-textarea" placeholder="Tulis umpan balik di sini...">${submission.feedback || ''}</textarea>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            preConfirm: () => {
                const grade = (document.getElementById('swal-input-grade') as HTMLInputElement).value;
                const feedback = (document.getElementById('swal-input-feedback') as HTMLTextAreaElement).value;
                if (!grade) {
                    Swal.showValidationMessage(`Nilai tidak boleh kosong`);
                    return false;
                }
                return { grade: parseFloat(grade), feedback };
            }
        });

        if (value) {
            try {
                const { error } = await supabase.from('submissions').update({ grade: value.grade, feedback: value.feedback }).eq('id', submission.id);
                if (error) throw error;
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Penilaian berhasil disimpan!', showConfirmButton: false, timer: 3000 });
                refreshData();
            } catch (error: any) {
                Swal.fire('Error', error.message || 'Gagal menyimpan penilaian.', 'error');
            }
        }
    };
    
    const filteredSubmissions = useMemo(() => {
        if (!selectedAssignment) return [];
        return submissions.filter(s => s.assignment_id === selectedAssignment.id);
    }, [selectedAssignment, submissions]);

    const studentsForSelectedAssignment = useMemo(() => {
        if (!selectedAssignment) return [];
        if (selectedAssignment.assigned_to_class === 'all') return students;
        return students.filter(s => `${s.grade} - ${s.class}` === selectedAssignment.assigned_to_class);
    }, [selectedAssignment, students]);


    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-medium text-white">Penugasan</h3>
                <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">+ Buat Tugas Baru</button>
            </div>
            <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                        <tr>
                            <th className="px-6 py-3">Judul Tugas</th>
                            <th className="px-6 py-3">Kelas</th>
                            <th className="px-6 py-3">Tenggat</th>
                            <th className="px-6 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map(assignment => (
                            <tr key={assignment.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-white">{assignment.title}</td>
                                <td className="px-6 py-4">{assignment.assigned_to_class === 'all' ? 'Semua Kelas' : assignment.assigned_to_class}</td>
                                <td className="px-6 py-4">{assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('id-ID') : 'N/A'}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openSubmissionsModal(assignment)} className="text-gray-400 hover:text-green-400 mr-4" title="Lihat Submisi"><EyeIcon className="w-5 h-5" /></button>
                                    <button onClick={() => openModal(assignment)} className="text-gray-400 hover:text-blue-400 mr-4" title="Edit"><EditIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(assignment)} className="text-gray-400 hover:text-red-400" title="Hapus"><TrashIcon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                        {assignments.length === 0 && (<tr><td colSpan={4} className="text-center py-8 text-gray-500">Belum ada tugas.</td></tr>)}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-white">{currentAssignment.id ? 'Edit Tugas' : 'Tugas Baru'}</h2>
                            <button onClick={closeModal}><XIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="space-y-4">
                            <input type="text" placeholder="Judul Tugas" value={currentAssignment.title || ''} onChange={e => setCurrentAssignment({ ...currentAssignment, title: e.target.value })} className="w-full p-2 bg-gray-700 rounded-md" />
                            <textarea placeholder="Deskripsi Tugas" value={currentAssignment.description || ''} onChange={e => setCurrentAssignment({ ...currentAssignment, description: e.target.value })} className="w-full p-2 bg-gray-700 rounded-md h-24"></textarea>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" value={currentAssignment.due_date || ''} onChange={e => setCurrentAssignment({ ...currentAssignment, due_date: e.target.value })} className="w-full p-2 bg-gray-700 rounded-md" />
                                <select value={currentAssignment.assigned_to_class || 'all'} onChange={e => setCurrentAssignment({ ...currentAssignment, assigned_to_class: e.target.value })} className="w-full p-2 bg-gray-700 rounded-md">
                                    {classList.map(c => <option key={c} value={c}>{c === 'all' ? 'Semua Kelas' : c}</option>)}
                                </select>
                            </div>
                            <FileUpload onFileSelect={setAssignmentFile} acceptedTypes="application/pdf" maxSizeMB={10} />
                            {assignmentFile && <p className="text-sm text-gray-400">File dipilih: {assignmentFile.name}</p>}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleSave} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-800">{isLoading ? 'Menyimpan...' : 'Simpan'}</button>
                        </div>
                    </div>
                </div>
            )}

            {isSubmissionsModalOpen && selectedAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-white">Submisi Tugas: {selectedAssignment.title}</h2>
                            <button onClick={closeSubmissionsModal}><XIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="overflow-y-auto">
                             <table className="w-full text-sm text-left text-gray-400">
                                <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3">Nama Siswa</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Nilai</th>
                                        <th className="px-6 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsForSelectedAssignment.map(student => {
                                        const submission = filteredSubmissions.find(s => s.student_id === student.id);
                                        return (
                                            <tr key={student.id} className="bg-gray-800 border-b border-gray-700">
                                                <td className="px-6 py-4 font-medium text-white">{student.name}</td>
                                                <td className="px-6 py-4">{submission ? submission.status : 'Belum Mengumpulkan'}</td>
                                                <td className="px-6 py-4 font-bold text-blue-400">{submission?.grade ?? 'N/A'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    {submission ? (
                                                        <button onClick={() => handleGradeSubmission(submission)} className="px-3 py-1 text-sm bg-blue-600 rounded-md hover:bg-blue-700">Nilai/Lihat</button>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">Tidak ada aksi</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Penugasan;