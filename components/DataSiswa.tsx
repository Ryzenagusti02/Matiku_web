import React, { useState } from 'react';
import { Student } from '../types';
import { EditIcon, TrashIcon, XIcon } from './icons';
import { supabase } from '../config/supabaseClient';
import Swal from 'sweetalert2';

interface DataSiswaProps {
    students: Student[];
    refreshData: () => void;
    addNotification: (message: string) => void;
}

const DataSiswa: React.FC<DataSiswaProps> = ({ students, refreshData, addNotification }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStudent, setCurrentStudent] = useState<Partial<Student>>({});
    const [studentEmail, setStudentEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const gradeLevels = ['VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

    const handleOpenModal = (student: Partial<Student> | null = null) => {
        setCurrentStudent(student || { grade: 'VII', class: 'A' });
        setStudentEmail('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentStudent({});
        setStudentEmail('');
    };
    
    const handleClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentStudent({ ...currentStudent, class: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') });
    };

    const handleSaveStudent = async () => {
        const { grade, class: studentClass } = currentStudent;
        const { data: { user } } = await supabase.auth.getUser();

        if (!grade || !studentClass || !user) {
            Swal.fire({ title: 'Error', text: 'Tingkat dan Kelas harus diisi.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
            return;
        }

        if (!currentStudent.id && !studentEmail.trim()) {
            Swal.fire({ title: 'Error', text: 'Email siswa harus diisi saat menambah siswa baru.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
            return;
        }
        
        setIsLoading(true);
        try {
            if (currentStudent.id) { // --- EDITING ---
                const { error } = await supabase.from('students').update({ grade, class: studentClass }).eq('id', currentStudent.id);
                if (error) throw error;
                addNotification(`Data siswa '${currentStudent.name}' berhasil diperbarui.`);
            } else { // --- ADDING ---
                const emailToAdd = studentEmail.toLowerCase().trim();
                const { data: studentProfile, error: profileError } = await supabase.from('profiles').select('*').eq('email', emailToAdd).single();
                
                if (profileError || !studentProfile) {
                    throw new Error(`Siswa dengan email '${studentEmail}' tidak ditemukan. Pastikan siswa telah mendaftar dengan email tersebut.`);
                }
                if (studentProfile.role !== 'siswa') {
                    throw new Error(`Akun dengan email '${studentEmail}' bukan merupakan akun siswa.`);
                }
                if (studentProfile.teacher_id) {
                    throw new Error(`Siswa dengan email '${studentEmail}' sudah terdaftar di kelas lain.`);
                }

                const newStudentData = {
                    uid: studentProfile.id,
                    name: studentProfile.username, // Use username for display name
                    grade: grade,
                    class: studentClass,
                    scores: {},
                    teacher_id: user.id,
                };
                const { error: insertError } = await supabase.from('students').insert(newStudentData);
                if (insertError) throw insertError;
                
                const { error: updateError } = await supabase.from('profiles').update({ teacher_id: user.id }).eq('id', studentProfile.id);
                if (updateError) throw updateError;
                
                addNotification(`Siswa baru '${newStudentData.name}' telah ditambahkan.`);
            }
            
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Siswa berhasil ${currentStudent.id ? 'diperbarui' : 'ditambahkan'}.`, showConfirmButton: false, timer: 3000, timerProgressBar: true, background: '#1f2937', color: '#e5e7eb' });
            refreshData();
            handleCloseModal();
        } catch (error: any) {
            console.error("Error saving student:", error.message);
            let text = error.message || 'Gagal menyimpan data siswa.';
            if (error.message && error.message.includes('violates row-level security policy')) {
                text = 'Aksi Anda diblokir oleh kebijakan keamanan database (RLS). Pastikan Anda telah menjalankan skrip SQL dari README.md untuk mengkonfigurasi izin dengan benar.';
            }
            Swal.fire({ title: 'Error', text, icon: 'error', background: '#1f2937', color: '#e5e7eb' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (student: Student) => {
        const result = await Swal.fire({
            title: 'Hapus Siswa?',
            text: `Data siswa "${student.name}" akan dihapus permanen dari kelas Anda!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal',
            background: '#1f2937',
            color: '#e5e7eb'
        });

        if (result.isConfirmed) {
            try {
                const { error: deleteError } = await supabase.from('students').delete().eq('id', student.id);
                if (deleteError) throw deleteError;
                
                if (student.uid) {
                    const { error: updateError } = await supabase.from('profiles').update({ teacher_id: null }).eq('id', student.uid);
                    if (updateError) throw updateError;
                }
                Swal.fire({ title: 'Dihapus!', text: 'Data siswa telah dihapus.', icon: 'success', background: '#1f2937', color: '#e5e7eb' });
                addNotification(`Siswa '${student.name}' telah dihapus dari kelas Anda.`);
                refreshData();
            } catch (error: any) {
                console.error("Error deleting student:", error.message);
                Swal.fire({ title: 'Error!', text: error.message || 'Gagal menghapus data siswa.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
            }
        }
    };

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-medium text-white">Data Siswa</h3>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    + Tambah Siswa Baru
                </button>
            </div>

            <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama Siswa</th>
                                <th scope="col" className="px-6 py-3">Tingkat</th>
                                <th scope="col" className="px-6 py-3">Kelas</th>
                                <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{student.name}</td>
                                    <td className="px-6 py-4">{student.grade}</td>
                                    <td className="px-6 py-4">{student.class}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleOpenModal(student)} className="text-gray-400 hover:text-blue-400 mr-4">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(student)} className="text-gray-400 hover:text-red-400">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                             {students.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">
                                        Belum ada data siswa.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-white">{currentStudent.id ? 'Edit Data Siswa' : 'Tambah Siswa ke Kelas'}</h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="space-y-4">
                            {!currentStudent.id ? (
                                <input type="email" placeholder="Email Siswa" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md" />
                            ) : <p className="text-gray-300">Nama Siswa: <span className="font-semibold">{currentStudent.name}</span></p>}
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Tingkat</label>
                                    <select value={currentStudent.grade || ''} onChange={(e) => setCurrentStudent({ ...currentStudent, grade: e.target.value })} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md">
                                        {gradeLevels.map(level => <option key={level} value={level}>{level}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Kelas</label>
                                    <input type="text" placeholder="Cth: A" value={currentStudent.class || ''} onChange={handleClassChange} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md" maxLength={3} />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleSaveStudent} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-800">
                                {isLoading ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataSiswa;