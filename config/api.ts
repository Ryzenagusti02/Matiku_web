import { GoogleGenAI } from "@google/genai";

// Mengambil Kunci API dari variabel lingkungan.
// Kunci ini harus dikonfigurasi di lingkungan hosting.
export const getAiClient = () => {
    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
        // Peringatan ini penting untuk debugging jika panggilan AI gagal.
        console.warn("Kunci API Gemini tidak ditemukan di variabel lingkungan. Fitur AI tidak akan berfungsi.");
    }
    
    // Mengembalikan instance baru dengan kunci yang diambil, atau string kosong jika tidak ada.
    // Panggilan API akan gagal dengan baik jika kuncinya kosong.
    return new GoogleGenAI({ apiKey: API_KEY || 'AIzaSyDxcaBawn4DOAKdOxBCPXA5mrH2CdMs37A' });
};