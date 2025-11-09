import React, { useState } from 'react';
import { Module } from '../types';
import { EditIcon, TrashIcon, XIcon, SparklesIcon } from './icons';
import { supabase } from '../config/firebase'; // Should be renamed
import Swal from 'sweetalert2';
import FileUpload from './FileUpload';
import { ai } from '../config/api';

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
        if (file.type === "application/pdf") {
            setModuleFile(file);
        } else {
            Swal.fire('Error', 'Hanya file PDF yang didukung.', 'error');
        }
    };

    const handleSaveModule = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!currentModule.title || (!moduleFile && !currentModule.id) || !user) {
            Swal.fire({ title: 'Input Tidak Lengkap', text: 'Judul dan file modul harus diisi.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
            return;
        }
        setIsLoading(true);
        try {
            let file_url = currentModule.file_url || '';
            let file_name = currentModule.file_name || '';

            if (moduleFile) {
                const filePath = `modules/${user.id}/${Date.now()}_${moduleFile.name}`;
                const { error: uploadError } = await supabase.storage.from('lms-files').upload(filePath, moduleFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('lms-files').getPublicUrl(filePath);
                file_url = urlData.publicUrl;
                file_name = moduleFile.name;
            }

            const moduleData = {
                title: currentModule.title,
                description: currentModule.description || '',
                file_url: file_url,
                file_name: file_name,
                due_date: currentModule.due_date || null,
                teacher_id: user.id,
            };

            if (currentModule.id) {
                const { error } = await supabase.from('modules').update(moduleData).eq('id', currentModule.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('modules').insert(moduleData);
                if (error) throw error;
            }

            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Modul berhasil ${currentModule.id ? 'diperbarui' : 'disimpan'}.`, showConfirmButton: false, timer: 3000, timerProgressBar: true, background: '#1f2937', color: '#e5e7eb' });
            addNotification(`Modul '${moduleData.title}' telah ${currentModule.id ? 'diperbarui' : 'ditambahkan'}.`);
            refreshData();
            handleCloseModal();
        } catch (error: any) {
            console.error("Error saving module:", error.message);
            Swal.fire({ title: 'Error', text: error.message || 'Gagal menyimpan modul.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
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
            background: '#1f2937',
            color: '#e5e7eb'
        });
        if (result.isConfirmed) {
            try {
                const { error } = await supabase.from('modules').delete().eq('id', module.id);
                if (error) throw error;

                if (module.file_url) {
                    const filePath = module.file_url.split('/lms-files/')[1];
                    await supabase.storage.from('lms-files').remove([filePath]);
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
    
    const handleGenerateWithAi = async () => {
        if (!currentModule.title) {
             Swal.fire({ title: 'Judul Diperlukan', text: 'Harap isi judul modul terlebih dahulu untuk membuat deskripsi.', icon: 'info', background: '#1f2937', color: '#e5e7eb' });
             return;
        }
        setIsAiLoading(true);
        try {
            const prompt = `Buatkan deskripsi materi ajar yang ringkas dan padat untuk judul "${currentModule.title}". Cukup jelaskan inti materinya saja dalam 3 paragraf. Jangan gunakan format tebal, miring, atau markdown lainnya.`;
            const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setCurrentModule(prev => ({ ...prev, description: result.text }));
        } catch (error) {
            console.error("AI generation failed:", error);
            Swal.fire({ title: 'Error AI', text: 'Gagal menghasilkan deskripsi.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="animate-fade-in-up">
            <h3 className="text-3xl font-medium text-white mb-6">Modul Ajar</h3>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-end items-center mb-4">
                    <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        + Tambah Modul Baru
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map(module => (
                        <div key={module.id} className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col justify-between">
                            <div>
                                <h4 className="text-lg font-semibold text-white truncate">{module.title}</h4>
                                <p className="text-sm text-gray-400 mt-1 h-10 overflow-hidden">{module.description}</p>
                            </div>
                            <div className="mt-4">
                                <a href={module.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline block truncate">
                                    {module.file_name}
                                </a>
                                {module.due_date && <p className="text-xs text-yellow-400 mt-1">Tenggat: {new Date(module.due_date).toLocaleDateString('id-ID')}</p>}
                                <div className="flex justify-end items-center mt-2">
                                    <button onClick={() => handleOpenModal(module)} className="text-gray-400 hover:text-blue-400 mr-2">
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(module)} className="text-gray-400 hover:text-red-400">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-white">{currentModule.id ? 'Edit Modul' : 'Tambah Modul Baru'}</h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="space-y-4">
                            <input type="text" placeholder="Judul Modul" value={currentModule.title || ''} onChange={(e) => setCurrentModule({ ...currentModule, title: e.target.value })} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md" />
                            <div className="relative">
                                <textarea placeholder="Deskripsi Singkat" value={currentModule.description || ''} onChange={(e) => setCurrentModule({ ...currentModule, description: e.target.value })} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md" rows={4}></textarea>
                                <button onClick={handleGenerateWithAi} disabled={isAiLoading} className="absolute bottom-2 right-2 p-1.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:bg-purple-800">
                                    {isAiLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-4 h-4"/>}
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Tenggat Waktu (Opsional)</label>
                                <input type="date" value={currentModule.due_date || ''} onChange={(e) => setCurrentModule({ ...currentModule, due_date: e.target.value })} className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md" />
                            </div>
                            <FileUpload onFileSelect={handleFileSelect} acceptedTypes="application/pdf" />
                            {moduleFile && <p className="text-sm text-gray-400">File dipilih: {moduleFile.name}</p>}
                            {!moduleFile && currentModule.file_name && <p className="text-sm text-gray-400">File saat ini: {currentModule.file_name}</p>}
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