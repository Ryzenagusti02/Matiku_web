
import React, { useState } from 'react';

const Calendar: React.FC = () => {
    const [date, setDate] = useState(new Date());
    const [animationClass, setAnimationClass] = useState('animate-fade-in');

    const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const changeMonth = (direction: 'prev' | 'next') => {
        setAnimationClass(direction === 'next' ? 'animate-fade-out-left' : 'animate-fade-out-right');
        
        setTimeout(() => {
            setDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + (direction === 'next' ? 1 : -1), 1));
            setAnimationClass(direction === 'next' ? 'animate-slide-in-right' : 'animate-slide-in-left');
        }, 150);
    };

    const renderHeader = () => (
        <div className="flex items-center justify-between mb-4">
            <button 
                onClick={() => changeMonth('prev')}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <h3 className="text-xl font-semibold text-white">
                {monthNames[date.getMonth()]} {date.getFullYear()}
            </h3>
            <button 
                onClick={() => changeMonth('next')}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
        </div>
    );
    
    const renderCalendarBody = () => {
        const month = date.getMonth();
        const year = date.getFullYear();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        const cells = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push(<div key={`blank-${i}`} className="p-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            cells.push(
                <div key={day} className="flex justify-center items-center h-10">
                    <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full text-sm
                        ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-200 hover:bg-gray-700'}
                        transition-colors cursor-pointer
                    `}>
                        {day}
                    </div>
                </div>
            );
        }

        return (
            <div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-400">
                    {daysOfWeek.map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">{cells}</div>
            </div>
        );
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg overflow-hidden">
            {renderHeader()}
            <div key={date.getMonth()} className={animationClass}>
                {renderCalendarBody()}
            </div>
        </div>
    );
};

export default Calendar;