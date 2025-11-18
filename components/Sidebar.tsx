import React from 'react';
import { HomeIcon, BookOpenIcon, UsersIcon, ClipboardCheckIcon, BarChartIcon, SparklesIcon, FileTextIcon, FolderIcon, ClipboardListIcon } from './icons';

interface SidebarProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{
    pageName: string;
    currentPage: string;
    onClick: (page: string) => void;
    icon: React.ReactNode;
    label: string;
}> = ({ pageName, currentPage, onClick, icon, label }) => {
    const isActive = currentPage === pageName;
    return (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onClick(pageName);
            }}
            className={`flex items-center px-4 py-2 mt-5 text-gray-400 transition-colors duration-200 transform rounded-md hover:bg-gray-700 hover:text-gray-200 ${isActive ? 'bg-blue-600 text-white' : ''}`}
        >
            {icon}
            <span className="mx-4 font-medium">{label}</span>
        </a>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isSidebarOpen, setIsSidebarOpen }) => {
    
    const handleNavClick = (page: string) => {
        setCurrentPage(page);
        setIsSidebarOpen(false); // Close sidebar on navigation
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-20 bg-black opacity-50 transition-opacity lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
                onClick={() => setIsSidebarOpen(false)}
            ></div>

            <div className={`fixed inset-y-0 left-0 z-30 w-64 px-4 py-5 overflow-y-auto bg-gray-800 border-r border-gray-700 transform lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out`}>

                <nav className="mt-2 flex-grow">
                    <NavLink pageName="dashboard" currentPage={currentPage} onClick={handleNavClick} icon={<HomeIcon className="w-6 h-6" />} label="Dashboard" />
                    <NavLink pageName="data-siswa" currentPage={currentPage} onClick={handleNavClick} icon={<UsersIcon className="w-6 h-6" />} label="Data Siswa" />
                    <NavLink pageName="modul-ajar" currentPage={currentPage} onClick={handleNavClick} icon={<BookOpenIcon className="w-6 h-6" />} label="Modul Ajar" />
                    <NavLink pageName="penugasan" currentPage={currentPage} onClick={handleNavClick} icon={<ClipboardListIcon className="w-6 h-6" />} label="Penugasan" />
                    <NavLink pageName="manajemen-file" currentPage={currentPage} onClick={handleNavClick} icon={<FolderIcon className="w-6 h-6" />} label="Manajemen File" />
                    <NavLink pageName="ujian-cbt" currentPage={currentPage} onClick={handleNavClick} icon={<FileTextIcon className="w-6 h-6" />} label="Ujian CBT" />
                    <NavLink pageName="penilaian" currentPage={currentPage} onClick={handleNavClick} icon={<ClipboardCheckIcon className="w-6 h-6" />} label="Penilaian" />
                    <NavLink pageName="analitik" currentPage={currentPage} onClick={handleNavClick} icon={<BarChartIcon className="w-6 h-6" />} label="Analitik" />
                    <NavLink pageName="ai-assistant" currentPage={currentPage} onClick={handleNavClick} icon={<SparklesIcon className="w-6 h-6" />} label="Asisten AI" />
                </nav>
            </div>
        </>
    );
};

export default Sidebar;