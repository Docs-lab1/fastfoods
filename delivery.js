import { supabaseClient } from './config.js';

let deliveryBoyId = null;
let isOnline = true;

// Check delivery boy auth
async function checkDeliveryAuth() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    deliveryBoyId = user.id;
    
    // Check user role
    const { data } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
        
    if (!data || data.role !== 'delivery') {
        window.location.href = 'index.html';
    }
}

// Load orders for delivery
async function loadDeliveryOrders() {
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .in('status', ['ready', 'delivering'])
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        
        displayDeliveryOrders(data);
    } catch (error) {
        console.error('Error loading delivery orders:', error);
    }
}

// Display delivery orders
function displayDeliveryOrders(orders) {
    const container = document.getElementById('deliveryOrders');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #4CAF50;"></i>
                <p style="margin-top: 12px;">No orders for delivery</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="delivery-order">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h4>${order.customer_name}</h4>
                    <div style="font-size: 13px; color: #666;">
                        <i class="fas fa-phone"></i> ${order.customer_phone}
                    </div>
                    <div style="font-size: 13px; color: #666; margin-top: 4px;">
                        <i class="fas fa-map-marker-alt"></i> ${order.delivery_address}
                    </div>
                    <div style="margin-top: 8px;">
                        ${order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
                    </div>
                </div>
                <div style="text-align: right;">
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
        const { error } = await supabaseClient
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
        const { error } = await supabaseClient
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

// Toggle delivery status
function toggleDeliveryStatus() {
    isOnline = !isOnline;
    const badge = document.getElementById('statusBadge');
    badge.textContent = isOnline ? 'Online' : 'Offline';
    badge.className = `status-badge ${isOnline ? 'status-online' : 'status-offline'}`;
    
    if (isOnline) {
        loadDeliveryOrders();
        // Start polling
        if (!window.deliveryInterval) {
            window.deliveryInterval = setInterval(loadDeliveryOrders, 15000);
        }
    } else {
        clearInterval(window.deliveryInterval);
        window.deliveryInterval = null;
        document.getElementById('deliveryOrders').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-pause-circle" style="font-size: 48px;"></i>
                <p style="margin-top: 12px;">You are offline</p>
            </div>
        `;
    }
}

// Logout
async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkDeliveryAuth();
    loadDeliveryOrders();
    
    // Start polling for new orders
    window.deliveryInterval = setInterval(loadDeliveryOrders, 15000);
});