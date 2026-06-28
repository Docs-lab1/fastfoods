import { supabaseClient } from './config.js';

// Global variables
let cart = [];
let currentMenuItems = [];
let currentCategory = 'all';
let map = null;
let marker = null;
let userLocation = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadMenuItems();
    setupEventListeners();
    loadCartFromStorage();
    
    // Check if user is logged in
    checkAuth();
});

// Check authentication
async function checkAuth() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            console.log('User logged in:', user.email);
        }
    } catch (error) {
        console.log('Not logged in');
    }
}

// Load menu items from Supabase
async function loadMenuItems(category = 'all') {
    try {
        showLoading(true);
        let query = supabaseClient
            .from('menu_items')
            .select('*')
            .eq('available', true);

        if (category !== 'all') {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('name');
        
        if (error) throw error;
        
        currentMenuItems = data || [];
        displayMenuItems(data || []);
    } catch (error) {
        console.error('Error loading menu:', error);
        showToast('Error loading menu items', 'error');
        // Show empty state
        displayMenuItems([]);
    } finally {
        showLoading(false);
    }
}

// Display menu items in grid
function displayMenuItems(items) {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    
    if (!items || items.length === 0) {
        grid.innerHTML = `
            <div class="no-items" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-utensils" style="font-size: 48px; color: #ccc;"></i>
                <p style="color: #999; margin-top: 12px;">No items available in this category</p>
            </div>
        `;
        return;
    }
    
    const emojiMap = {
        'Grilled Chicken': '🍗',
        'Beef Stew': '🥩',
        'Fish Fry': '🐟',
        'Vegetable Pasta': '🍝',
        'Spring Rolls': '🌯',
        'Samosa': '🥟',
        'Garlic Bread': '🍞',
        'Fresh Juice': '🧃',
        'Soda': '🥤',
        'Milkshake': '🥛',
        'Chocolate Cake': '🍰',
        'Ice Cream': '🍦'
    };
    
    grid.innerHTML = items.map(item => {
        const emoji = emojiMap[item.name] || '🍽️';
        return `
        <div class="menu-item" data-id="${item.id}">
            <div class="menu-item-image">
                <span style="font-size: 48px;">${emoji}</span>
            </div>
            <div class="menu-item-content">
                <h4>${item.name}</h4>
                <p>${item.description || 'Delicious meal'}</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">K${parseFloat(item.price).toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart('${item.id}', '${item.name}', ${parseFloat(item.price)})">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
}

// Add to cart function (make it global)
window.addToCart = function(id, name, price) {
    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    
    updateCartUI();
    saveCartToStorage();
    showToast(`${name} added to cart! 🛒`, 'success');
};

// Update cart UI
function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = count;
    
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart" style="text-align: center; padding: 40px 0;">
                <i class="fas fa-shopping-cart" style="font-size: 48px; color: #ccc;"></i>
                <p style="color: #999; margin-top: 8px;">Your cart is empty</p>
            </div>
        `;
        const totalEl = document.getElementById('cartTotal');
        if (totalEl) totalEl.textContent = 'K0.00';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">K${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = `K${total.toFixed(2)}`;
}

// Update quantity (make it global)
window.updateQuantity = function(id, change) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    
    updateCartUI();
    saveCartToStorage();
};

// Toggle cart
window.toggleCart = function() {
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar) sidebar.classList.toggle('open');
};

// Proceed to checkout
window.proceedToCheckout = function() {
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }
    
    toggleCart();
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.add('show');
    initializeMap();
};

// Initialize Google Map
function initializeMap() {
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;
    
    // Default location (Kasama District)
    const defaultLocation = { lat: -10.2117, lng: 31.1818 };
    
    if (typeof google !== 'undefined' && google.maps) {
        map = new google.maps.Map(mapContainer, {
            center: defaultLocation,
            zoom: 14,
            styles: [
                {
                    featureType: 'all',
                    elementType: 'geometry',
                    stylers: [{ color: '#f5f5f5' }]
                }
            ]
        });
        
        marker = new google.maps.Marker({
            position: defaultLocation,
            map: map,
            draggable: true,
            animation: google.maps.Animation.DROP
        });
        
        // Update address when marker is dragged
        marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            getAddressFromCoords(pos.lat(), pos.lng());
        });
    }
}

// Get current location
window.getCurrentLocation = function() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported', 'error');
        return;
    }
    
    showToast('Getting your location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            userLocation = { lat: latitude, lng: longitude };
            
            if (map && marker) {
                const pos = { lat: latitude, lng: longitude };
                map.setCenter(pos);
                map.setZoom(16);
                marker.setPosition(pos);
                getAddressFromCoords(latitude, longitude);
            }
            
            showToast('Location updated! 📍', 'success');
        },
        (error) => {
            console.error('Geolocation error:', error);
            showToast('Error getting location. Please enter address manually.', 'error');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
};

// Get address from coordinates
function getAddressFromCoords(lat, lng) {
    if (typeof google === 'undefined' || !google.maps) {
        return;
    }
    
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };
    
    geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
            const addressEl = document.getElementById('deliveryAddress');
            if (addressEl) addressEl.value = results[0].formatted_address;
        }
    });
}

// Place order
async function placeOrder(event) {
    event.preventDefault();
    
    const name = document.getElementById('customerName')?.value;
    const phone = document.getElementById('customerPhone')?.value;
    const address = document.getElementById('deliveryAddress')?.value;
    
    if (!name || !phone || !address) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const orderData = {
            customer_name: name,
            customer_phone: phone,
            delivery_address: address,
            latitude: userLocation?.lat || null,
            longitude: userLocation?.lng || null,
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            total_amount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'pending'
        };
        
        const { data, error } = await supabaseClient
            .from('orders')
            .insert([orderData])
            .select();
            
        if (error) throw error;
        
        showToast('Order placed successfully! 🎉', 'success');
        
        // Clear cart and close modal
        cart = [];
        updateCartUI();
        saveCartToStorage();
        closeModal('checkoutModal');
        
        // Reset form
        const form = document.getElementById('checkoutForm');
        if (form) form.reset();
        
    } catch (error) {
        console.error('Error placing order:', error);
        showToast('Error placing order. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Show/hide loading
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content" style="display: flex; align-items: center; gap: 8px;">
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Navigation
window.navigateTo = function(page) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(btn => btn.classList.remove('active'));
    const clickedBtn = event?.target?.closest('.nav-item');
    if (clickedBtn) clickedBtn.classList.add('active');
    
    // Handle navigation logic here
    switch(page) {
        case 'home':
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
        case 'menu':
            document.getElementById('menuSection')?.scrollIntoView({ behavior: 'smooth' });
            break;
        case 'orders':
            showToast('Orders feature coming soon!', 'info');
            break;
        case 'profile':
            showToast('Profile feature coming soon!', 'info');
            break;
    }
};

// Show menu
window.showMenu = function() {
    document.getElementById('menuSection')?.scrollIntoView({ behavior: 'smooth' });
};

// Close modal
window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
};

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCartFromStorage() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
            updateCartUI();
        } catch (e) {
            cart = [];
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Category filter
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.dataset.category;
            currentCategory = category;
            loadMenuItems(category);
        });
    });
    
    // Checkout form
    const form = document.getElementById('checkoutForm');
    if (form) form.addEventListener('submit', placeOrder);
    
    // Close modal on overlay click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
}
