import React, { useState } from 'react';
import { KeyIcon } from './icons';

interface ApiKeyManagerProps {
    onKeySelected: () => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeySelected }) => {
    const [apiKey, setApiKey] = useState('');

    const handleSaveKey = () => {
        if (apiKey.trim()) {
            localStorage.setItem('gemini_api_key', apiKey.trim());
            onKeySelected();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
            <div className="w-full max-w-lg p-8 text-center bg-gray-800 rounded-lg shadow-lg border border-gray-700 animate-fade-in-up">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 mb-4">
                    <KeyIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Masukkan Kunci API Gemini Anda</h1>
                <p className="mt-2 text-gray-400">
                    Untuk menggunakan fitur AI, Anda perlu memasukkan Kunci API Google Anda. Kunci Anda akan disimpan dengan aman di browser Anda.
                </p>
                <div className="mt-6 text-left">
                    <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-400 mb-1">
                        Kunci API Google
                    </label>
                    <input
                        id="api-key-input"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Tempelkan kunci API Anda di sini"
                        className="w-full px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={handleSaveKey}
                    disabled={!apiKey.trim()}
                    className="w-full mt-6 px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-blue-800 disabled:cursor-not-allowed"
                >
                    Simpan dan Lanjutkan
                </button>
                <p className="mt-4 text-xs text-gray-500">
                    Tidak punya kunci? Dapatkan dari <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.
                </p>
            </div>
        </div>
    );
};

export default ApiKeyManager;
