import React, { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient';
import Swal from 'sweetalert2';
import { EditIcon } from './icons';

interface PengaturanSiswaProps {
    user: User;
    onProfileUpdate: () => void;
}

const PengaturanSiswa: React.FC<PengaturanSiswaProps> = ({ user, onProfileUpdate }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [username, setUsername] = useState(user.user_metadata.display_name || user.email || '');
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user.user_metadata.avatar_url);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setUsername(user.user_metadata.display_name || user.email || '');
        setPreviewUrl(user.user_metadata.avatar_url);
    }, [user]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const MAX_SIZE_MB = 5;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
            const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

            if (!ACCEPTED_TYPES.includes(file.type)) {
                Swal.fire({
                    title: 'Tipe File Salah',
                    text: 'Hanya file PNG atau JPEG yang didukung.',
                    icon: 'error',
                    background: '#1f2937',
                    color: '#e5e7eb'
                });
                if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
                return;
            }

            if (file.size > MAX_SIZE_BYTES) {
                Swal.fire({
                    title: 'Ukuran File Terlalu Besar',
                    text: `Ukuran file tidak boleh melebihi ${MAX_SIZE_MB} MB.`,
                    icon: 'error',
                    background: '#1f2937',
                    color: '#e5e7eb'
                });
                if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
                return;
            }
            
            setProfileImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setIsLoading(true);

        try {
            let avatar_url = user.user_metadata.avatar_url;
            if (profileImage) {
                const filePath = `profile_pictures/${user.id}`;
                // upsert: true akan menimpa file yang ada, secara efektif menghapus yang lama.
                const { error: uploadError } = await supabase.storage
                    .from('matiku_storage')
                    .upload(filePath, profileImage, { upsert: true });
                if (uploadError) throw uploadError;
                
                const { data: urlData } = supabase.storage.from('matiku_storage').getPublicUrl(filePath);
                avatar_url = `${urlData.publicUrl}?t=${new Date().getTime()}`; // Tambahkan stempel waktu untuk mengatasi cache
            }
            
            // Perbarui metadata pengguna di Supabase Auth
            const { error: userUpdateError } = await supabase.auth.updateUser({
                data: { 
                    display_name: username,
                    avatar_url: avatar_url
                }
            });

            if (userUpdateError) throw userUpdateError;

            // Perbarui username di tabel 'profiles'.
            // Trigger database akan secara otomatis menyinkronkan perubahan ini ke tabel 'students'.
            const { error: profileUpdateError } = await supabase.from('profiles').update({ username: username }).eq('id', user.id);
            if (profileUpdateError) throw profileUpdateError;

            
            setIsEditMode(false);
            Swal.fire({
                title: 'Berhasil!',
                text: 'Profil Anda telah diperbarui.',
                icon: 'success',
                background: '#1f2937',
                color: '#e5e7eb',
                timer: 2000,
                showConfirmButton: false,
                timerProgressBar: true,
            }).then(() => {
                onProfileUpdate();
            });

        } catch (error: any) {
            console.error("Error updating profile:", error.message);
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Gagal memperbarui profil.',
                icon: 'error',
                background: '#1f2937',
                color: '#e5e7eb'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in-up">
            <h3 className="text-3xl font-medium text-white mb-6">Pengaturan Akun</h3>
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                         <img 
                            src={previewUrl || `https://ui-avatars.com/api/?name=${username}&background=0ea5e9&color=fff&size=128`} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-600"
                        />
                        {isEditMode && (
                             <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <EditIcon className="w-5 h-5 text-white" />
                            </button>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/png, image/jpeg"
                        />
                    </div>
                    <div className="w-full">
                         <label className="block text-sm font-medium text-gray-400">Email</label>
                         <input type="email" value={user.email || ''} disabled className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-gray-300 p-2 cursor-not-allowed" />
                    </div>
                    <div className="w-full">
                         <label className="block text-sm font-medium text-gray-400">Username</label>
                         <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={!isEditMode}
                            className={`mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-gray-200 p-2 ${!isEditMode && 'cursor-not-allowed'}`}
                        />
                    </div>
                    <div className="flex justify-end w-full mt-6">
                        {isEditMode ? (
                            <>
                                <button onClick={() => setIsEditMode(false)} className="px-4 py-2 text-gray-300 rounded-md hover:bg-gray-700 mr-2">Batal</button>
                                <button onClick={handleSave} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-800">
                                    {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditMode(true)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                                Edit Profil
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PengaturanSiswa;