import React, { useState } from 'react';
import { getAiClient } from '../config/api';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AiAssistantPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const ai = getAiClient();
            // FIX: Updated model to gemini-2.5-flash for better performance on basic text tasks.
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Anda adalah asisten AI untuk guru di platform LMS Matiku. Jawab pertanyaan berikut: ${currentInput}`,
            });
            const aiMessage: Message = { sender: 'ai', text: result.text };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Error calling AI:", error);
            const errorMessage: Message = { sender: 'ai', text: 'Maaf, terjadi kesalahan. Coba lagi nanti.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in-up">
            <h3 className="text-3xl font-medium text-white mb-4">AI Assistant</h3>
            <div className="bg-gray-800 rounded-lg shadow-lg flex flex-col h-[75vh]">
                <div className="flex-1 p-6 overflow-y-auto">
                    {messages.length === 0 && (
                         <div className="text-center text-gray-500 h-full flex items-center justify-center">
                            Mulai percakapan dengan mengetik di bawah.
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                            <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex justify-start mb-4">
                             <div className="max-w-lg p-3 rounded-lg bg-gray-700 text-gray-200">
                                <p className="animate-pulse">AI is thinking...</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-700">
                    <div className="flex">
                        <input
                            type="text"
                            className="flex-1 p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Tanya apa saja..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-800"
                        >
                            Kirim
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiAssistantPage;