// Fix: Replaced placeholder content with a functional authentication component to resolve module and reference errors.
import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import Swal from 'sweetalert2';
import { EyeIcon, EyeOffIcon, LogInIcon, UserPlusIcon, GoogleIcon } from './icons';

const AuthPage: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    const handleViewChange = (newView: boolean) => {
        if (isLoginView === newView) return;

        setIsAnimatingOut(true);
        setTimeout(() => {
            setIsLoginView(newView);
            // Clear form fields on view change
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setIsAnimatingOut(false);
        }, 300); // Match animation duration
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) {
            Swal.fire({
                title: 'Error Login Google',
                text: error.message,
                icon: 'error',
                background: '#1f2937',
                color: '#e5e7eb'
            });
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (isLoginView) {
            // Login logic
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                Swal.fire({
                    title: 'Login Gagal',
                    text: error.message,
                    icon: 'error',
                    background: '#1f2937',
                    color: '#e5e7eb'
                });
            }
        } else {
            // Register logic
            if (password !== confirmPassword) {
                Swal.fire({
                    title: 'Error Pendaftaran',
                    text: 'Password dan konfirmasi password tidak cocok.',
                    icon: 'error',
                    background: '#1f2937',
                    color: '#e5e7eb'
                });
                setIsLoading(false);
                return;
            }
            const { error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/verification-success`
                }
            });
            if (error) {
                 Swal.fire({
                    title: 'Pendaftaran Gagal',
                    text: error.message,
                    icon: 'error',
                    background: '#1f2937',
                    color: '#e5e7eb'
                });
            } else {
                 Swal.fire({
                    title: 'Pendaftaran Berhasil',
                    text: 'Silakan cek email Anda untuk verifikasi.',
                    icon: 'success',
                    background: '#1f2937',
                    color: '#e5e7eb'
                });
                handleViewChange(true); // Switch to login view after successful registration
            }
        }
        setIsLoading(false);
    };

    const passwordInput = (
        value: string,
        setter: (val: string) => void,
        show: boolean,
        showSetter: (val: boolean) => void,
        placeholder: string,
        id: string,
        label: string,
    ) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    id={id}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    required
                    className="w-full px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="button"
                    onClick={() => showSetter(!show)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-200"
                >
                    {show ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );

    const formContent = (
        <div className={`${isAnimatingOut ? 'animate-fade-out-form' : 'animate-fade-in-form'}`}>
            <h2 className="text-2xl font-bold text-center">
                {isLoginView ? 'Selamat Datang Kembali!' : 'Buat Akun Baru'}
            </h2>
            
            <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Alamat Email"
                        required
                        className="w-full px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                {passwordInput(password, setPassword, showPassword, setShowPassword, 'Password', 'password', isLoginView ? 'Password' : 'Buat Password')}
                {!isLoginView && (
                    passwordInput(confirmPassword, setConfirmPassword, showConfirmPassword, setShowConfirmPassword, 'Konfirmasi Password', 'confirmPassword', 'Konfirmasi Password')
                )}
                
                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center px-4 py-2 text-lg font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-800 transition-colors">
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        isLoginView ? <><LogInIcon className="w-5 h-5 mr-2" /> Login</> : <><UserPlusIcon className="w-5 h-5 mr-2" /> Daftar</>
                    )}
                </button>
            </form>

            <div className="relative flex items-center justify-center">
                <div className="absolute inset-x-0 h-px bg-gray-700"></div>
                <span className="relative px-4 text-sm text-gray-400 bg-gray-800">Atau</span>
            </div>

            <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full flex items-center justify-center px-4 py-2 space-x-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 transition-colors">
                <GoogleIcon className="w-6 h-6" />
                <span>{isLoginView ? 'Masuk dengan Google' : 'Daftar dengan Google'}</span>
            </button>

             <p className="text-sm text-center text-gray-400">
                {isLoginView ? "Belum punya akun? " : "Sudah punya akun? "}
                <button onClick={() => handleViewChange(!isLoginView)} className="font-medium text-blue-400 hover:underline">
                     {isLoginView ? "Daftar di sini" : "Login di sini"}
                </button>
            </p>
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="flex items-center mb-8 animate-zoom-in-fade">
                 <img src="/favicon.svg" alt="Matiku LMS Logo" className="w-12 h-12"/>
                 <span className="ml-4 text-3xl font-bold">Matiku LMS</span>
            </div>
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg animate-zoom-in-fade" style={{animationDelay: '100ms'}}>
                <div className="flex border-b border-gray-700">
                    <button onClick={() => handleViewChange(true)} className={`flex-1 py-2 text-lg font-medium transition-colors focus:outline-none ${isLoginView ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        Login
                    </button>
                    <button onClick={() => handleViewChange(false)} className={`flex-1 py-2 text-lg font-medium transition-colors focus:outline-none ${!isLoginView ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        Daftar
                    </button>
                </div>
                
                <div className="min-h-[390px] flex flex-col justify-center">
                    {formContent}
                </div>
            </div>
        </div>
    );
};

export default AuthPage;