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
    
    // Clear local storage
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('cart');
    localStorage.removeItem('cartCount');
    
    // Redirect to login
    window.location.href = 'login.html';
}

// Make logout globally available
window.logout = logout;
