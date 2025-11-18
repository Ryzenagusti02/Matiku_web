import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { FileObject } from '@supabase/storage-js';
import { supabase } from '../config/supabaseClient';
import Swal from 'sweetalert2';
import { TrashIcon, XIcon } from './icons';
import FileUpload from './FileUpload';

interface ManajemenFileProps {
    user: User;
}

const ManajemenFile: React.FC<ManajemenFileProps> = ({ user }) => {
    const [files, setFiles] = useState<FileObject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);

    const FOLDER_PATH = `files/${user.id}`;

    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase.storage
            .from('matiku_storage')
            .list(FOLDER_PATH, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) {
            console.error('Error fetching files:', error);
            Swal.fire({ title: 'Error', text: 'Gagal memuat daftar file.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
            setFiles([]);
        } else {
            setFiles(data || []);
        }
        setIsLoading(false);
    }, [FOLDER_PATH]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleUpload = async () => {
        if (!fileToUpload) {
            Swal.fire({ title: 'Error', text: 'Silakan pilih file untuk diunggah.', icon: 'error', background: '#1f2937', color: '#e5e7eb' });
            return;
        }
        setIsUploading(true);
        const filePath = `${FOLDER_PATH}/${fileToUpload.name}`;
        
        const { error } = await supabase.storage
            .from('matiku_storage')
            .upload(filePath, fileToUpload, { upsert: true }); // Use upsert to allow overwriting

        if (error) {
            console.error('Error uploading file:', error);
            Swal.fire({ title: 'Error', text: `Gagal mengunggah file: ${error.message}`, icon: 'error', background: '#1f2937', color: '#e5e7eb' });
        } else {
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'File berhasil diunggah!', showConfirmButton: false, timer: 3000, timerProgressBar: true, background: '#1f2937', color: '#e5e7eb' });
            setUploadModalOpen(false);
            setFileToUpload(null);
            await fetchFiles();
        }
        setIsUploading(false);
    };
    
    const handleDelete = async (fileName: string) => {
        const result = await Swal.fire({
            title: 'Hapus File?',
            text: `File "${fileName}" akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal',
            background: '#1f2937', color: '#e5e7eb'
        });

        if (result.isConfirmed) {
            const filePath = `${FOLDER_PATH}/${fileName}`;
            const { error } = await supabase.storage.from('matiku_storage').remove([filePath]);
            
            if (error) {
                console.error('Error deleting file:', error);
                Swal.fire({ title: 'Error', text: `Gagal menghapus file: ${error.message}`, icon: 'error', background: '#1f2937', color: '#e5e7eb' });
            } else {
                Swal.fire({ title: 'Dihapus!', text: 'File telah berhasil dihapus.', icon: 'success', background: '#1f2937', color: '#e5e7eb' });
                await fetchFiles();
            }
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const getPublicUrl = (fileName: string) => {
        return supabase.storage.from('matiku_storage').getPublicUrl(`${FOLDER_PATH}/${fileName}`).data.publicUrl;
    };

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-medium text-white">Manajemen File</h3>
                <button onClick={() => setUploadModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    + Unggah File Baru
                </button>
            </div>

            <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama File</th>
                                <th scope="col" className="px-6 py-3">Ukuran</th>
                                <th scope="col" className="px-6 py-3">Terakhir Diubah</th>
                                <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Memuat file...</td></tr>
                            ) : files.length > 0 ? (
                                files.map(file => (
                                    <tr key={file.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                            <a href={getPublicUrl(file.name)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                {file.name}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">{formatBytes(file.metadata?.size ?? 0)}</td>
                                        <td className="px-6 py-4">{file.updated_at ? new Date(file.updated_at).toLocaleString('id-ID') : 'N/A'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDelete(file.name)} className="text-gray-400 hover:text-red-400">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Belum ada file yang diunggah.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-white">Unggah File Baru</h2>
                            <button onClick={() => setUploadModalOpen(false)} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="space-y-4">
                            <FileUpload onFileSelect={(file) => setFileToUpload(file)} acceptedTypes="application/pdf" maxSizeMB={10} />
                            {fileToUpload && <p className="text-sm text-gray-400 mt-2">File dipilih: {fileToUpload.name}</p>}
                            <p className="text-xs text-gray-500">Jika file dengan nama yang sama sudah ada, file tersebut akan ditimpa.</p>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleUpload} disabled={isUploading || !fileToUpload} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-800">
                                {isUploading ? 'Mengunggah...' : 'Unggah'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManajemenFile;