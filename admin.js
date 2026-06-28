import { supabaseClient } from './config.js';

// Check if user is admin
async function checkAdminAuth() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Check user role
    const { data } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
        
    if (!data || data.role !== 'admin') {
        window.location.href = 'index.html';
    }
}

// Load orders
async function loadOrders() {
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        updateStats(data);
        displayOrders(data);
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Update statistics
function updateStats(orders) {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
    const completed = orders.filter(o => o.status === 'delivered').length;
    
    document.getElementById('totalOrders').textContent = total;
    document.getElementById('pendingOrders').textContent = pending;
    document.getElementById('completedOrders').textContent = completed;
}

// Display orders
function displayOrders(orders) {
    const container = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No orders yet</p>';
        return;
    }
    
    container.innerHTML = orders.slice(0, 10).map(order => `
        <div class="order-item">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${order.customer_name}</strong>
                    <div style="font-size: 12px; color: #666;">${order.customer_phone}</div>
                </div>
                <div>
                    <span class="order-status status-${order.status}">${order.status}</span>
                    <span style="font-weight: 700; color: var(--primary-red); margin-left: 8px;">K${order.total_amount.toFixed(2)}</span>
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
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadOrders();
    
    // Refresh every 30 seconds
    setInterval(loadOrders, 30000);
});