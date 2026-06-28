// ============================================
// CHIKORLANDO - DELIVERY DASHBOARD
// ============================================

let deliveryBoyId = null;
let isOnline = true;

// Check delivery boy auth
async function checkDeliveryAuth() {
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
        
        deliveryBoyId = user.id;
        
        // Check user role
        const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
            
        if (!data || data.role !== 'delivery') {
            window.location.href = 'index.html';
        } else {
            console.log('✅ Delivery boy logged in:', user.email);
        }
    } catch (error) {
        console.error('Auth error:', error);
        window.location.href = 'index.html';
    }
}

// Load orders for delivery
async function loadDeliveryOrders() {
    try {
        const supabase = window.supabaseClient;
        if (!supabase) return;
        
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .in('status', ['ready', 'delivering'])
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        
        displayDeliveryOrders(data || []);
    } catch (error) {
        console.error('Error loading delivery orders:', error);
    }
}

// Display delivery orders
function displayDeliveryOrders(orders) {
    const container = document.getElementById('deliveryOrders');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #4CAF50;"></i>
                <p style="margin-top: 12px;">No orders for delivery</p>
                <p style="font-size: 12px; margin-top: 4px;">Waiting for new orders...</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="delivery-order">
            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap;">
                <div style="flex: 1;">
                    <h4>${order.customer_name}</h4>
                    <div style="font-size: 13px; color: #666;">
                        <i class="fas fa-phone"></i> ${order.customer_phone}
                    </div>
                    <div style="font-size: 13px; color: #666; margin-top: 4px;">
                        <i class="fas fa-map-marker-alt"></i> ${order.delivery_address}
                    </div>
                    <div style="margin-top: 8px; font-size: 13px;">
                        ${order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
                    </div>
                </div>
                <div style="text-align: right; min-width: 100px;">
                    <div style="font-weight: 700; color: var(--primary-red);">
                        K${order.total_amount.toFixed(2)}
                    </div>
                    <div style="font-size: 12px; color: #999;">
                        ${new Date(order.created_at).toLocaleTimeString()}
                    </div>
                    ${order.status === 'ready' ? `
                        <button onclick="acceptDelivery('${order.id}')" class="action-btn" style="margin-top: 8px;">
                            <i class="fas fa-check"></i> Accept
                        </button>
                    ` : `
                        <button onclick="markDelivered('${order.id}')" class="action-btn" style="margin-top: 8px; background: #4CAF50;">
                            <i class="fas fa-check-circle"></i> Delivered
                        </button>
                    `}
                </div>
            </div>
        </div>
    `).join('');
}

// Accept delivery
async function acceptDelivery(orderId) {
    try {
        const supabase = window.supabaseClient;
        if (!supabase) return;
        
        const { error } = await supabase
            .from('orders')
            .update({ 
                status: 'delivering',
                delivery_boy_id: deliveryBoyId
            })
            .eq('id', orderId);
            
        if (error) throw error;
        
        showToast('Order accepted for delivery!', 'success');
        loadDeliveryOrders();
    } catch (error) {
        console.error('Error accepting delivery:', error);
        showToast('Error accepting order', 'error');
    }
}

// Mark as delivered
async function markDelivered(orderId) {
    try {
        const supabase = window.supabaseClient;
        if (!supabase) return;
        
        const { error } = await supabase
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', orderId);
            
        if (error) throw error;
        
        showToast('Order delivered successfully! 🎉', 'success');
        loadDeliveryOrders();
    } catch (error) {
        console.error('Error marking delivered:', error);
        showToast('Error updating order', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    let bgColor = '#2196F3';
    if (type === 'success') bgColor = '#4CAF50';
    if (type === 'error') bgColor = '#f44336';
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bgColor};
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 500;
        z-index: 1000;
        animation: slideDown 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        max-width: 90%;
        text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Toggle delivery status
function toggleDeliveryStatus() {
    isOnline = !isOnline;
    const badge = document.getElementById('statusBadge');
    if (badge) {
        badge.textContent = isOnline ? 'Online' : 'Offline';
        badge.className = `status-badge ${isOnline ? 'status-online' : 'status-offline'}`;
    }
    
    if (isOnline) {
        loadDeliveryOrders();
        if (!window.deliveryInterval) {
            window.deliveryInterval = setInterval(loadDeliveryOrders, 15000);
        }
    } else {
        clearInterval(window.deliveryInterval);
        window.deliveryInterval = null;
        const container = document.getElementById('deliveryOrders');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-pause-circle" style="font-size: 48px;"></i>
                    <p style="margin-top: 12px;">You are offline</p>
                </div>
            `;
        }
    }
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
    console.log('🚚 Delivery Dashboard Loading...');
    checkDeliveryAuth();
    loadDeliveryOrders();
    
    // Start polling for new orders
    window.deliveryInterval = setInterval(loadDeliveryOrders, 15000);
});

// Make functions global
window.toggleDeliveryStatus = toggleDeliveryStatus;
window.acceptDelivery = acceptDelivery;
window.markDelivered = markDelivered;
window.logout = logout;
