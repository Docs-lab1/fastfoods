// ============================================
// CHIKORLANDO RESTAURANT - CONFIGURATION
// ============================================

// Supabase Configuration
const SUPABASE_URL = 'https://prsgpaqbokothjsqclyv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByc2dwYXFib2tvdGhqc3FjbHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjQ2NzIsImV4cCI6MjA5ODI0MDY3Mn0.9aQAYye-50gwbK0V84RS8p_nS75bfr9fkG27c6QPODY';

// Check if Supabase is available
if (typeof supabase === 'undefined') {
    console.error('❌ Supabase library not loaded!');
} else {
    console.log('✅ Supabase library loaded');
}

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

// Make available globally
window.supabaseClient = supabaseClient;
window.GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY;

console.log('✅ Chikorlando Config loaded!');
console.log('🔗 Supabase URL:', SUPABASE_URL);
console.log('🔑 Supabase Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
