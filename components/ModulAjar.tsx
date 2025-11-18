import React, { useState } from 'react';
import { Module } from '../types';
import { EditIcon, TrashIcon, XIcon, SparklesIcon } from './icons';
import { supabase } from '../config/supabaseClient';
import Swal from 'sweetalert2';
import FileUpload from './FileUpload';
import { getAiClient } from '../config/api';

interface ModulAjarProps {
    modules: Module[];
    refreshData: () => void;
    addNotification: (message: string) => void;
}

const ModulAjar: React.FC<ModulAjarProps> = ({ modules, refreshData, addNotification }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModule, setCurrentModule] = useState<Partial<Module>>({});
    const [moduleFile, setModuleFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleOpenModal = (module: Partial<Module> | null = null) => {
        setCurrentModule(module || {});
        setModuleFile(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentModule({});
        setModuleFile(null);
    };

    const handleFileSelect = (file: File) => {
        // Validation for type and size is now handled by the FileUpload component.
        setModuleFile(file);
    };

    const handleGenerateDescription = async () => {
        if (!currentModule.title) {
            Swal.fire({
                title: 'Judul Diperlukan',
                text: 'Silakan masukkan judul modul terlebih dahulu.',
                icon: 'info',
                background: '#1f2937',
                color: '#e5e7eb'
            });
            return;
        }
        setIsAiLoading(true);
        try {
            const ai = getAiClient();
            const prompt = `Buatkan deskripsi singkat dan menarik untuk modul ajar dengan judul "${currentModule.title}". Deskripsi harus dalam satu paragraf dan tidak lebih dari 50 kata.`;
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            setCurrentModule({ ...currentModule, description: result.text });
        } catch (error: any) {
            Swal.fire({
                title: 'Error AI',
                text: error.message || 'Gagal menghasilkan deskripsi.',
                icon: 'error',
                background: '#1f2937',
                color: '#e5e7eb'
            });
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSaveModule = async () => {
        const { title, description } = currentModule;
        const { data: { user } } = await supabase.auth.getUser();

        if (!title || !user) {
            Swal.fire({
                title: 'Error',
                text: 'Judul modul harus diisi.',
                icon: 'error',
                background: '#1f2937',
                color: '#e5e7eb'
            });
            return;
        }

        if (!currentModule.id && !moduleFile) {
            Swal.fire({
                title: 'Error',
                text: 'File PDF harus diunggah untuk modul baru.',
                icon: 'error',
                background: '#1f2937',
                color: '#e5e7eb'
            });
            return;
        }

        setIsLoading(true);
        try {
            let file_url = currentModule.file_url || '';
            let file_name = currentModule.file_name || '';

            if (moduleFile) {
                const filePath = `modules/${user.id}/${Date.now()}_${moduleFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('matiku_storage')
                    .upload(filePath, moduleFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('matiku_storage').getPublicUrl(filePath);
                file_url = data.publicUrl;
                file_name = moduleFile.name;
            }

            const moduleData = {
                title,
                description,
                file_url,
                file_name,
                due_date: currentModule.due_date,
                teacher_id: user.id
            };

            if (currentModule.id) { // --- EDITING ---
                const { error } = await supabase.from('modules').update(moduleData).eq('id', currentModule.id);
                if (error) throw error;
                addNotification(`Modul '${title}' berhasil diperbarui.`);
            } else { // --- ADDING ---
                const { error } = await supabase.from('modules').insert(moduleData);
                if (error) throw error;
                addNotification(`Modul baru '${title}' berhasil ditambahkan.`);
            }

            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Modul berhasil disimpan!', showConfirmButton: false, timer: 3000, timerProgressBar: true, background: '#1f2937', color: '#e5e7eb' });
            refreshData();
            handleCloseModal();
        } catch (error: any) {
            console.error("Error saving module:", error);
            let text = error.message || 'Gagal menyimpan modul.';
            if (error.message && error.message.includes('violates row-level security policy')) {
                 if (error.message.includes('storage.objects')) {
                     text = 'Gagal mengunggah file karena kebijakan keamanan penyimpanan (RLS). Pastikan Anda telah menjalankan skrip SQL terbaru dari README.md untuk mengkonfigurasi izin penyimpanan dengan benar.';
                } else {
                    text = 'Aksi Anda diblokir oleh kebijakan keamanan database (RLS). Pastikan Anda telah menjalankan skrip SQL dari README.md untuk mengkonfigurasi izin dengan benar.';
                }
            }
            Swal.fire({
                title: 'Error',
                text,
                icon: 'error',
                background: '#1f2937',
                color: '#e5e7eb'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (module: Module) => {
        const result = await Swal.fire({
            title: 'Hapus Modul?',
            text: `Modul "${module.title}" akan dihapus permanen!`,
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
                // Future improvement: Handle cascade deletion of scores in DB
                
                const { error: deleteError } = await supabase.from('modules').delete().eq('id', module.id);
                if (deleteError) throw deleteError;
                
                // Optional: Delete file from storage
                if (module.file_url) {
                    const filePath = module.file_url.split('/matiku_storage/')[1];
                    await supabase.storage.from('matiku_storage').remove([filePath]);
                }

                Swal.fire({ title: 'Dihapus!', text: 'Modul telah dihapus.', icon: 'success', background: '#1f2937', color: '#e5e7eb' });
                addNotification(`Modul '${module.title}' telah dihapus.`);
                refreshData();
            } catch (error: any) {
                console.error("Error deleting module:", error.message);
                Swal.fire({ title: 'Error!', text: error.message || 'Gagal menghapus modul.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
            }
        }
    };

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-medium text-white">Modul Ajar</h3>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    + Tambah Modul Baru
                </button>
            </div>

            <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Judul Modul</th>
                                <th scope="col" className="px-6 py-3">Deskripsi</th>
                                <th scope="col" className="px-6 py-3">File</th>
                                <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map(module => (
                                <tr key={module.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{module.title}</td>
                                    <td className="px-6 py-4 max-w-sm truncate">{module.description}</td>
                                    <td className="px-6 py-4">
                                        <a href={module.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                            {module.file_name}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleOpenModal(module)} className="text-gray-400 hover:text-blue-400 mr-4">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(module)} className="text-gray-400 hover:text-red-400">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                             {modules.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">
                                        Belum ada modul ajar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-white">{currentModule.id ? 'Edit Modul Ajar' : 'Tambah Modul Baru'}</h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="space-y-4">
                            <input type="text" placeholder="Judul Modul" value={currentModule.title || ''} onChange={(e) => setCurrentModule({ ...currentModule, title: e.target.value })} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md" />
                            <div className="relative">
                                <textarea placeholder="Deskripsi Modul..." value={currentModule.description || ''} onChange={(e) => setCurrentModule({ ...currentModule, description: e.target.value })} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md h-32 pr-10" />
                                <button
                                    onClick={handleGenerateDescription}
                                    disabled={isAiLoading}
                                    className="absolute top-2 right-2 p-1 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:bg-purple-800"
                                    title="Buat deskripsi dengan AI"
                                >
                                    {isAiLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Tenggat Waktu (Opsional)</label>
                                <input type="date" value={currentModule.due_date ? currentModule.due_date.split('T')[0] : ''} onChange={(e) => setCurrentModule({ ...currentModule, due_date: e.target.value })} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Upload File (PDF)</label>
                                <FileUpload onFileSelect={handleFileSelect} acceptedTypes="application/pdf" maxSizeMB={5} />
                                {moduleFile && <p className="text-sm text-gray-400 mt-2">File dipilih: {moduleFile.name}</p>}
                                {currentModule.file_name && !moduleFile && <p className="text-sm text-gray-400 mt-2">File saat ini: {currentModule.file_name}</p>}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleSaveModule} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-800">
                                {isLoading ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModulAjar;