import React, { useState, useMemo } from 'react';
import { BellIcon } from './icons';
import { Notification } from '../types';

interface NotificationDropdownProps {
    notifications: Notification[];
    onOpen: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.read).length;
    }, [notifications]);

    const handleToggle = () => {
        setIsOpen(prev => {
            if (!prev) {
                onOpen();
            }
            return !prev;
        });
    };

    return (
        <div className="relative">
            <button
                onClick={handleToggle}
                className="relative text-gray-400 hover:text-gray-200 focus:outline-none focus:text-gray-200"
            >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 10 ? '10+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 w-80 mt-2 overflow-hidden bg-gray-800 rounded-lg shadow-xl z-20 border border-gray-700"
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <div className="py-2 max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map((notification) => (
                            <div key={notification.id} className="flex items-center px-4 py-3 border-b border-gray-700">
                                <p className="mx-2 text-sm text-gray-300">
                                    {notification.message}
                                </p>
                            </div>
                        )) : (
                             <p className="px-4 py-3 text-sm text-center text-gray-400">Tidak ada notifikasi baru.</p>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <div className="block py-2 font-bold text-center text-white bg-gray-700">
                            Notifikasi
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
