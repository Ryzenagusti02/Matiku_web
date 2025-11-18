import React, { useState, useEffect } from 'react';
import { getAiClient } from '../config/api';

interface AiRecommendationModalProps {
    isOpen: boolean;
    onClose: () => void;
    assessmentTitle: string;
}

const AiRecommendationModal: React.FC<AiRecommendationModalProps> = ({ isOpen, onClose, assessmentTitle }) => {
    const [recommendation, setRecommendation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const fetchRecommendation = async () => {
                try {
                    const ai = getAiClient();
                    const prompt = `
                        Sebagai seorang ahli pedagogi, berikan rekomendasi tindak lanjut untuk siswa bernama "${assessmentTitle}". 
                        Fokus pada area yang perlu ditingkatkan dan berikan saran aktivitas atau materi tambahan yang konkret.
                        Contoh hasil:
                        - Beberapa siswa masih kesulitan dengan konsep variabel.
                        Rekomendasi:
                        1. Sesi review tambahan fokus pada konsep variabel.
                        2. Berikan soal latihan interaktif dari modul "Aljabar Menyenangkan".
                        3. Tugaskan proyek kecil membuat model matematika sederhana.
                    `;
                    // FIX: Updated model to gemini-2.5-flash for better performance on basic text tasks.
                    const result = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: prompt
                    });
                    setRecommendation(result.text);
                } catch (error) {
                    console.error("Error fetching AI recommendation:", error);
                    setRecommendation('Gagal memuat rekomendasi. Silakan coba lagi.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchRecommendation();
        }
    }, [isOpen, assessmentTitle]);

    return isOpen ? (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center animate-fade-in">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-white">Rekomendasi AI untuk "{assessmentTitle}"</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>
                <div className="min-h-[200px] bg-gray-900 p-4 rounded-md">
                    {isLoading ? (
                        <p className="text-gray-400 animate-pulse">Memuat rekomendasi...</p>
                    ) : (
                        <div className="text-gray-300 whitespace-pre-wrap">{recommendation}</div>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    ) : null;
};

export default AiRecommendationModal;