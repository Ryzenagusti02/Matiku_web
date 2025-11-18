
import React from 'react';
import StatCard from './StatCard';
import Calendar from './Calendar';
import StudentActivity from './StudentActivity';
import { UsersIcon, BookOpenIcon, ClipboardCheckIcon, BarChartIcon } from './icons';
import { Student } from '../types';

interface DashboardProps {
    totalSiswa: number;
    totalModul: number;
    penilaianSelesai: string;
    rataRataNilai: string;
    students: Student[];
}

const Dashboard: React.FC<DashboardProps> = ({ totalSiswa, totalModul, penilaianSelesai, rataRataNilai, students }) => {
    return (
        <div className="animate-fade-in-up">
            <h3 className="text-3xl font-medium text-white">Dashboard</h3>
            <div className="mt-4">
                <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Total Siswa" value={totalSiswa.toString()}>
                        <UsersIcon className="w-8 h-8 text-white" />
                    </StatCard>
                    <StatCard title="Modul Ajar" value={totalModul.toString()}>
                        <BookOpenIcon className="w-8 h-8 text-white" />
                    </StatCard>
                    <StatCard title="Penilaian Selesai" value={penilaianSelesai}>
                        <ClipboardCheckIcon className="w-8 h-8 text-white" />
                    </StatCard>
                    <StatCard title="Rata-rata Nilai" value={rataRataNilai}>
                        <BarChartIcon className="w-8 h-8 text-white" />
                    </StatCard>
                </div>
            </div>
            <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <Calendar />
                </div>
                <div>
                    <StudentActivity students={students} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
