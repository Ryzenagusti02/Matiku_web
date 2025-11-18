import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheckIcon } from './icons';

const VerificationSuccessPage: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/');
        }, 3000); // Redirect after 3 seconds

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="w-full max-w-md p-8 text-center bg-gray-800 rounded-lg shadow-lg animate-zoom-in-fade">
                <ClipboardCheckIcon className="w-16 h-16 mx-auto text-green-400" />
                <h1 className="mt-4 text-3xl font-bold text-white">Verifikasi Berhasil!</h1>
                <p className="mt-2 text-gray-400">
                    Akun Anda telah berhasil diverifikasi. Anda akan diarahkan ke halaman login...
                </p>
                <div className="mt-6 w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full animate-progress"></div>
                </div>
            </div>
        </div>
    );
};

// Add progress bar animation to index.html for this component
const style = document.createElement('style');
style.innerHTML = `
    @keyframes progress-bar {
        from { width: 0%; }
        to { width: 100%; }
    }
    .animate-progress {
        animation: progress-bar 3s linear forwards;
    }
`;
document.head.appendChild(style);

export default VerificationSuccessPage;
