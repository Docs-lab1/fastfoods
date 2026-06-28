// ============================================
// CHIKORLANDO - LOGOUT FUNCTION
// ============================================

async function logout() {
    try {
        const supabase = window.supabaseClient;
        if (supabase) {
            await supabase.auth.signOut();
        }
    } catch (e) {
        console.error('Logout error:', e);
    }
    
    // Clear all local storage
    localStorage.clear();
    
    // Redirect to login
    window.location.href = 'login.html';
}

// Make logout globally available
window.logout = logout;

console.log('🔓 Logout function ready');
