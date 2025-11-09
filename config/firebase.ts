import { createClient } from '@supabase/supabase-js';

// Updated with the new Supabase project credentials.
const supabaseUrl = 'https://fawlluodyubddwzvsevo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhd2xsdW9keXViZGR3enZzZXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjI3NzcsImV4cCI6MjA3ODE5ODc3N30.nb8cQfnCazoniwRNC-ibfWBhsn03Gey5fnBAGGFY0Es';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL and Anon Key are not configured. The application will not function correctly.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
