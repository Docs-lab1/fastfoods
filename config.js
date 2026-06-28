// ============================================
// CHIKORLANDO RESTAURANT - CONFIGURATION
// ============================================

// Supabase Configuration
const SUPABASE_URL = 'https://prsgpaqbokothjsqclyv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByc2dwYXFib2tvdGhqc3FjbHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjQ2NzIsImV4cCI6MjA5ODI0MDY3Mn0.9aQAYye-50gwbK0V84RS8p_nS75bfr9fkG27c6QPODY';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Google Maps API Key (Get from Google Cloud Console)
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

// Export for use in other files
export { supabaseClient, GOOGLE_MAPS_API_KEY };
