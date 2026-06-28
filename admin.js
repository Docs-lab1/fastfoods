// ============================================
// CHIKORLANDO - ADMIN DASHBOARD
// ============================================

// Check if user is admin
async function checkAdminAuth() {
    try {
        const supabase = window.supabaseClient;
        if (!supabase) {
            console.error('Supabase not initialized');
            window.location.href = 'index.html';
            return;
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        // Check user role
        const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
            
        if (!data || data.role !== 'admin') {
            window.location.href = 'index.html';
        } else {
            console.log('✅ Admin logged in:', user.email);
        }
    } catch (error) {
        console.error('Auth error:', error);
        window.location.href = 'index.html';
    }
}

// Load orders
async function loadOrders() {
    try {
        const supabase = window.supabaseClient;
        if (!supabase) return;
        
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        updateStats(data || []);
        displayOrders(data || []);
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersList').innerHTML = `
            <p style="text-align: center; color: #f44336; padding: 20px;">
                <i class="fas fa-exclamation-circle"></i> Error loading orders
            </p>
        `;
    }
}

// Update statistics
function updateStats(orders) {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
    const completed = orders.filter(o => o.status === 'delivered').length;
    
    const totalEl = document.getElementById('totalOrders');
    const pendingEl = document.getElementById('pendingOrders');
    const completedEl = document.getElementById('completedOrders');
    
    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (completedEl) completedEl.textContent = completed;
}

// Display orders
function displayOrders(orders) {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: #999; padding: 20px;">
                <i class="fas fa-shopping-cart"></i> No orders yet
            </p>
        `;
        return;
    }
    
    container.innerHTML = orders.slice(0, 10).map(order => `
        <div class="order-item">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <div>
                    <strong>${order.customer_name}</strong>
                    <div style="font-size: 12px; color: #666;">${order.customer_phone}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span class="order-status status-${order.status}">${order.status}</span>
                    <span style="font-weight: 700; color: var(--primary-red);">K${order.total_amount.toFixed(2)}</span>
                </div>
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                ${order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
            </div>
            <div style="font-size: 11px; color: #999; margin-top: 4px;">
                ${new Date(order.created_at).toLocaleString()}
            </div>
        </div>
    `).join('');
}

// Logout
async function logout() {
    try {
        const supabase = window.supabaseClient;
        if (supabase) {
            await supabase.auth.signOut();
        }
    } catch (e) {
        console.error('Logout error:', e);
    }
    window.location.href = 'index.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Admin Dashboard Loading...');
    checkAdminAuth();
    loadOrders();
    
    // Refresh every 30 seconds
    setInterval(loadOrders, 30000);
});

// Make functions global
window.logout = logout;
