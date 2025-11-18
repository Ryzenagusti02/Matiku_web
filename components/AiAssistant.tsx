import React, { useState } from 'react';
import { SparklesIcon } from './icons';
import { getAiClient } from '../config/api';

const AiAssistant: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) return;

        setIsLoading(true);
        setError('');
        setResponse('');

        try {
            const ai = getAiClient();
            // FIX: Updated model to gemini-2.5-flash for better performance on basic text tasks.
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Anda adalah asisten AI untuk guru. Jawab pertanyaan ini dengan singkat dan jelas untuk konteks pendidikan: ${prompt}`,
            });
            setResponse(result.text);
        } catch (err) {
            setError('Gagal mendapatkan respons dari AI. Silakan coba lagi.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full flex flex-col">
            <div className="flex items-center mb-4">
                <SparklesIcon className="w-6 h-6 text-blue-400" />
                <h4 className="ml-2 text-xl text-gray-200 font-semibold">Asisten AI</h4>
            </div>
            <p className="text-gray-400 text-sm mb-4">
                Tanyakan apa saja untuk membantu proses belajar mengajar Anda.
            </p>
            <div className="flex-grow overflow-y-auto p-3 bg-gray-900 rounded-md mb-4 min-h-[150px]">
                {isLoading && <p className="text-gray-400">Memproses...</p>}
                {error && <p className="text-red-400">{error}</p>}
                {response && <p className="text-gray-300 whitespace-pre-wrap">{response}</p>}
                {!isLoading && !response && !error && (
                    <p className="text-gray-500 text-center mt-8">Jawaban AI akan muncul di sini.</p>
                )}
            </div>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Contoh: Buatkan 3 soal pilihan ganda tentang fotosintesis"
                    className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt}
                    className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-800 transition-colors"
                >
                    {isLoading ? 'Loading...' : 'Tanya AI'}
                </button>
            </form>
        </div>
    );
};

export default AiAssistant;