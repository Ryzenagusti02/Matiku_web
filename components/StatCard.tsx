import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    children: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, children }) => {
    return (
        <div className="flex items-center p-4 bg-gray-800 rounded-lg shadow-lg">
            <div className="p-3 mr-4 text-blue-500 bg-blue-600 rounded-full">
                {children}
            </div>
            <div>
                <p className="mb-2 text-sm font-medium text-gray-400">
                    {title}
                </p>
                <p className="text-lg font-semibold text-white">
                    {value}
                </p>
            </div>
        </div>
    );
};

export default StatCard;