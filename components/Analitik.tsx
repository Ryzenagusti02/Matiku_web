import React, { useState, useMemo } from 'react';
import { Student, Assessment } from '../types';

interface AnalitikProps {
  students: Student[];
  modules: any[]; // modules is passed but not directly used in this logic
}

const Analitik: React.FC<AnalitikProps> = ({ students }) => {
    const [selectedClass, setSelectedClass] = useState('all');

    const classList = useMemo(() => {
        const classes = new Set(students.map(s => `${s.grade} - ${s.class}`));
        return ['all', ...Array.from(classes).sort()];
    }, [students]);

    const filteredStudents = useMemo(() => {
        if (selectedClass === 'all') {
            return students;
        }
        return students.filter(s => `${s.grade} - ${s.class}` === selectedClass);
    }, [students, selectedClass]);

    const getAverageScore = (scores: Student['scores']) => {
        if (!scores || Object.keys(scores).length === 0) return 0;
        const allScores = Object.values(scores).map((s: Assessment) => s.score);
        return allScores.reduce((a, b) => a + b, 0) / allScores.length;
    };

    const studentPerformance = useMemo(() => {
        return filteredStudents.map(student => ({
            name: student.name,
            average: getAverageScore(student.scores)
        })).sort((a,b) => b.average - a.average);
    }, [filteredStudents]);

    const materiAverage = useMemo(() => {
        const materiPerformance: { [key: string]: { scores: number[], count: number } } = {};
        filteredStudents.forEach(student => {
            if (student.scores) {
                Object.values(student.scores).forEach((assessment: Assessment) => {
                    if (!materiPerformance[assessment.materi]) {
                        materiPerformance[assessment.materi] = { scores: [], count: 0 };
                    }
                    materiPerformance[assessment.materi].scores.push(assessment.score);
                    materiPerformance[assessment.materi].count++;
                });
            }
        });
        
        return Object.entries(materiPerformance).map(([materi, data]) => ({
            name: materi,
            average: data.scores.reduce((a,b) => a+b, 0) / data.count
        })).sort((a,b) => b.average - a.average);
    }, [filteredStudents]);

    const Chart: React.FC<{title: string, data: {name: string, average: number}[]}> = ({title, data}) => (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full">
            <h4 className="text-xl text-gray-200 font-semibold mb-4">{title}</h4>
            <div className="space-y-4">
                {data.map(item => (
                    <div key={item.name} className="flex items-center">
                        <span className="w-1/3 text-gray-300 truncate pr-4">{item.name}</span>
                        <div className="w-2/3 bg-gray-700 rounded-full h-4">
                             <div 
                                className="bg-blue-500 h-4 rounded-full text-xs text-white flex items-center justify-end pr-2 animate-grow-width"
                                style={{ '--target-width': `${item.average}%` } as React.CSSProperties}
                            >
                                {item.average > 10 && item.average.toFixed(1)}
                            </div>
                        </div>
                    </div>
                ))}
                {data.length === 0 && <p className="text-gray-500 text-center">Data tidak tersedia untuk filter ini.</p>}
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h3 className="text-3xl font-medium text-white mb-4 sm:mb-0">Analitik Pembelajaran</h3>
                <div className="sm:ml-auto">
                     <label className="text-sm font-medium text-gray-400 mr-2">Filter Kelas:</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md"
                    >
                        {classList.map(c => (
                            <option key={c} value={c}>
                                {c === 'all' ? 'Semua Kelas' : c}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
             <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-8 lg:space-y-0" key={selectedClass}>
                <Chart title="Performa Siswa (Nilai Rata-rata)" data={studentPerformance} />
                <Chart title="Performa Materi (Nilai Rata-rata)" data={materiAverage} />
            </div>
        </div>
    );
};

export default Analitik;