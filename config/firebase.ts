import { createClient } from '@supabase/supabase-js';

// Updated with the new Supabase project credentials.
const supabaseUrl = process.env.URL_SUPABASE;
const supabaseAnonKey = process.env.ANON_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL and Anon Key are not configured. The application will not function correctly.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
