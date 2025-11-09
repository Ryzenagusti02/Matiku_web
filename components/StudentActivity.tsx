import React from 'react';
import { Student } from '../types';
import { UsersIcon } from './icons';

interface StudentActivityProps {
    students: Student[];
}

const StudentActivity: React.FC<StudentActivityProps> = ({ students }) => {
    // Sort students by creation date (newest first) and take the top 5
    const recentStudents = students
        .sort((a, b) => (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0))
        .slice(0, 5);

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full">
            <div className="flex items-center mb-4">
                <UsersIcon className="w-6 h-6 text-blue-400"/>
                <h4 className="ml-2 text-xl text-gray-200 font-semibold">Aktivitas Siswa Terbaru</h4>
            </div>
            <div className="space-y-4">
                {recentStudents.length > 0 ? (
                    recentStudents.map(student => (
                        <div key={student.id} className="flex items-center justify-between text-sm">
                            <p className="text-gray-300">{student.name}</p>
                            <p className="text-gray-500">
                                {student.created_at ? new Date(student.created_at).toLocaleDateString('id-ID') : 'N/A'}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-4">Belum ada siswa yang ditambahkan.</p>
                )}
            </div>
        </div>
    );
};

export default StudentActivity;
