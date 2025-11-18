import React, { useState } from 'react';
import { MenuIcon, SettingsIcon, LogoutIcon, XIcon } from './icons';
import NotificationDropdown from './NotificationDropdown';
import { Notification } from '../types';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient';
import Swal from 'sweetalert2';

interface HeaderProps {
    user: User | null;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    setCurrentPage: (page: string) => void;
    isScrolled: boolean;
    notifications: Notification[];
    onOpenNotifications: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, isSidebarOpen, setIsSidebarOpen, setCurrentPage, isScrolled, notifications, onOpenNotifications }) => {
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
    
    const displayName = user?.user_metadata?.display_name || user?.email;
    const photoURL = user?.user_metadata?.avatar_url;

    return (
        <header className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 transition-all duration-300 ${isScrolled ? 'bg-gray-800/80 backdrop-blur-sm shadow-lg' : 'bg-gray-800 border-b border-gray-700'}`}>
            <div className="flex items-center">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="text-gray-400 focus:outline-none lg:hidden mr-4"
                >
                    {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </button>
                <div className="flex items-center">
                    <img src="/favicon.svg" alt="Matiku LMS Logo" className="w-8 h-8"/>
                    <span className="ml-3 text-xl font-semibold text-white hidden sm:block">Matiku LMS</span>
                </div>
            </div>

            <div className="flex items-center">
                <NotificationDropdown notifications={notifications} onOpen={onOpenNotifications}/>

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
                             <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('pengaturan'); setIsProfileOpen(false); }} className="flex items-center px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white">
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
    );
};

export default Header;