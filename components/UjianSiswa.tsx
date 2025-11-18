import React, { useState, useEffect, useCallback } from 'react';
import { Exam, Question, Student, ExamAttempt } from '../types';
import { supabase } from '../config/supabaseClient';
import Swal from 'sweetalert2';

interface UjianSiswaProps {
    exam: Exam;
    student: Student;
    onFinish: () => void;
}

const UjianSiswa: React.FC<UjianSiswaProps> = ({ exam, student, onFinish }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [key: string]: number }>({});
    const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [view, setView] = useState<'taking' | 'result'>('taking');
    const [finalAttempt, setFinalAttempt] = useState<ExamAttempt | null>(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .eq('exam_id', exam.id);
            if (error) {
                Swal.fire('Error', 'Gagal memuat soal ujian.', 'error');
                onFinish();
            } else {
                setQuestions(data as Question[]);
            }
            setIsLoading(false);
        };
        fetchQuestions();
    }, [exam.id, onFinish]);

    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        let correctCount = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct_answer_index) {
                correctCount++;
            }
        });
        const score = (correctCount / questions.length) * 100;
        
        const attemptData = {
            exam_id: exam.id,
            student_id: student.id,
            student_uid: student.uid,
            score: score,
            answers: answers,
            completed_at: new Date().toISOString(),
        };

        try {
            const { data, error } = await supabase.from('exam_attempts').insert(attemptData).select().single();
            if (error) throw error;
            setFinalAttempt(data as ExamAttempt);
            setView('result');
        } catch (error: any) {
            Swal.fire('Error', error.message || 'Gagal mengirimkan jawaban.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    }, [answers, exam, student, questions]);

    useEffect(() => {
        if (view === 'taking' && !isLoading) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [view, isLoading, handleSubmit]);

    const handleAnswerSelect = (questionId: string, optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    if (isLoading) {
        return <div className="text-center p-10">Memuat soal...</div>;
    }
    
    if (view === 'result' && finalAttempt) {
        return (
             <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100 p-6 animate-fade-in-up">
                <h1 className="text-3xl font-bold text-white mb-2">Hasil Ujian: {exam.title}</h1>
                <p className="text-lg text-gray-400 mb-6">Skor Akhir Anda: <span className="text-2xl font-bold text-green-400">{finalAttempt.score.toFixed(1)}</span></p>
                <div className="flex-grow bg-gray-800 p-6 rounded-lg overflow-y-auto">
                    {questions.map((q, index) => {
                        const userAnswer = answers[q.id];
                        const isCorrect = userAnswer === q.correct_answer_index;
                        return (
                            <div key={q.id} className="mb-6 pb-4 border-b border-gray-700">
                                <p className="text-gray-300 mb-3">{index + 1}. {q.question_text}</p>
                                <div className="space-y-2">
                                    {q.options.map((opt, oIndex) => {
                                        let optionClass = 'border-gray-600';
                                        if (oIndex === q.correct_answer_index) optionClass = 'border-green-500 bg-green-500/20';
                                        if (oIndex === userAnswer && !isCorrect) optionClass = 'border-red-500 bg-red-500/20';
                                        return (
                                            <div key={oIndex} className={`p-3 border rounded-md ${optionClass}`}>
                                                {oIndex === userAnswer && (isCorrect ? '✓ ' : '✗ ')}
                                                {opt}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                 <div className="mt-6 text-center">
                    <button onClick={onFinish} className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>
        );
    }
    
    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100 p-6">
            <header className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">{exam.title}</h1>
                <div className="text-lg font-semibold bg-red-600 px-4 py-2 rounded-md">
                    Sisa Waktu: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
                </div>
            </header>

            <div className="flex-grow bg-gray-800 p-6 rounded-lg flex flex-col">
                <div className="mb-4">
                    <p className="text-sm text-gray-400">Soal {currentQuestionIndex + 1} dari {questions.length}</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto">
                    <p className="text-xl mb-6">{currentQuestion?.question_text}</p>
                    <div className="space-y-3">
                        {currentQuestion?.options.map((option, index) => (
                            <label key={index} className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${answers[currentQuestion.id] === index ? 'border-blue-500 bg-blue-900/50' : 'border-gray-600 hover:bg-gray-700'}`}>
                                <input
                                    type="radio"
                                    name={`question_${currentQuestion.id}`}
                                    className="hidden"
                                    checked={answers[currentQuestion.id] === index}
                                    onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                                />
                                {String.fromCharCode(65 + index)}. {option}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <footer className="mt-6 flex justify-between items-center">
                <button 
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-3 bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                    Sebelumnya
                </button>
                {currentQuestionIndex === questions.length - 1 ? (
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-3 bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
                        {isSubmitting ? 'Mengirim...' : 'Selesaikan Ujian'}
                    </button>
                ) : (
                    <button 
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        className="px-6 py-3 bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        Selanjutnya
                    </button>
                )}
            </footer>
        </div>
    );
};

export default UjianSiswa;