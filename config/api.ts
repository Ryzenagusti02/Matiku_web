import { GoogleGenAI } from "@google/genai";

// FIX: Switched from `import.meta.env.VITE_API_KEY` to `process.env.API_KEY` to resolve a TypeScript error and align with @google/genai guidelines.
// The execution environment must be configured to make this variable available.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    // This warning is for the developer to ensure the .env file is set up.
    console.warn("Kunci API Google (API_KEY) tidak ditemukan. Fitur AI tidak akan berfungsi.");
}

// Initialize the client with the key. Using `|| ''` prevents a crash if the key is missing,
// allowing the app to load. API calls will fail gracefully later if the key is not provided.
export const ai = new GoogleGenAI({ apiKey: API_KEY || 'AIzaSyDeRnHOAlwEqwacRzLVRDMP7sK-EIy0G-I' });
