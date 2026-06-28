// ============================================
// CHIKORLANDO RESTAURANT - MAIN SCRIPT
// ============================================

// Global variables
let cart = [];
let currentCategory = 'all';
let map = null;
let marker = null;
let userLocation = null;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Chikorlando App Initializing...');
    loadCartFromStorage();
    updateCartUI();
    loadMenuItems();
    
    // Setup form submit
    const form = document.getElementById('checkoutForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            placeOrder(e);
        });
    }
});

// Load menu items from Supabase
async function loadMenuItems(category = 'all') {
    try {
        showLoading(true);
        const supabase = window.supabaseClient;
        
        if (!supabase) {
            console.error('❌ Supabase not initialized!');
            showToast('Error: Supabase not configured', 'error');
            displayMenuItems([]);
            return;
        }
        
        let query = supabase
            .from('menu_items')
            .select('*')
            .eq('available', true);

        if (category !== 'all') {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('name');
        
        if (error) throw error;
        
        console.log(`✅ Loaded ${data?.length || 0} menu items`);
        displayMenuItems(data || []);
    } catch (error) {
        console.error('Error loading menu:', error);
        showToast('Error loading menu items', 'error');
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
                <p style="color: #999; margin-top: 12px;">No items available</p>
                <button onclick="loadMenuItems()" style="margin-top: 12px; background: var(--primary-red); color: white; border: none; padding: 8px 20px; border-radius: 50px; cursor: pointer;">
                    <i class="fas fa-refresh"></i> Retry
                </button>
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
        const itemId = item.id;
        const itemName = item.name;
        const itemPrice = parseFloat(item.price);
        
        return `
        <div class="menu-item" data-id="${itemId}">
            <div class="menu-item-image">
                <span style="font-size: 48px;">${emoji}</span>
            </div>
            <div class="menu-item-content">
                <h4>${itemName}</h4>
                <p>${item.description || 'Delicious meal'}</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">K${itemPrice.toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart('${itemId}', '${itemName}', ${itemPrice})">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
}

// Add to cart function
function addToCart(id, name, price) {
    console.log('🛒 Adding to cart:', name, price);
    
    // Check if item already in cart
    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.quantity += 1;
        console.log(`✅ ${name} quantity updated to ${existing.quantity}`);
    } else {
        cart.push({ id, name, price, quantity: 1 });
        console.log(`✅ ${name} added to cart`);
    }
    
    updateCartUI();
    saveCartToStorage();
    showToast(`${name} added to cart! 🛒`, 'success');
    
    // Update cart count in localStorage
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    localStorage.setItem('cartCount', totalItems);
}

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

// Update quantity
function updateQuantity(id, change) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    
    updateCartUI();
    saveCartToStorage();
}

// Filter category
function filterCategory(category, btn) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    currentCategory = category;
    loadMenuItems(category);
}

// Toggle cart
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
        console.log('🛒 Cart toggled:', sidebar.classList.contains('open') ? 'open' : 'closed');
    }
}

// Proceed to checkout
function proceedToCheckout() {
    console.log('🛒 Proceeding to checkout...');
    
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }
    
    toggleCart();
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.add('show');
        console.log('✅ Checkout modal opened');
        initializeMap();
    }
}

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
        
        marker.addListener('dragend', function() {
            const pos = marker.getPosition();
            getAddressFromCoords(pos.lat(), pos.lng());
        });
    } else {
        console.warn('⚠️ Google Maps not loaded');
    }
}

// Get current location
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported', 'error');
        return;
    }
    
    showToast('Getting your location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
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
        function(error) {
            console.error('Geolocation error:', error);
            showToast('Error getting location. Please enter address manually.', 'error');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// Get address from coordinates
function getAddressFromCoords(lat, lng) {
    if (typeof google === 'undefined' || !google.maps) {
        return;
    }
    
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };
    
    geocoder.geocode({ location: latlng }, function(results, status) {
        if (status === 'OK' && results && results[0]) {
            const addressEl = document.getElementById('deliveryAddress');
            if (addressEl) addressEl.value = results[0].formatted_address;
        }
    });
}

// Place order
async function placeOrder(event) {
    event.preventDefault();
    console.log('📦 Placing order...');
    
    const name = document.getElementById('customerName')?.value;
    const phone = document.getElementById('customerPhone')?.value;
    const address = document.getElementById('deliveryAddress')?.value;
    
    if (!name || !phone || !address) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const supabase = window.supabaseClient;
        
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
        
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
        
        console.log('📦 Order data:', orderData);
        
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select();
            
        if (error) throw error;
        
        // Save customer name for orders page
        localStorage.setItem('customerName', name);
        
        showToast('Order placed successfully! 🎉', 'success');
        console.log('✅ Order placed successfully!');
        
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
        showToast('Error placing order: ' + error.message, 'error');
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
    
    let bgColor = '#2196F3';
    let icon = 'ℹ️';
    if (type === 'success') { bgColor = '#4CAF50'; icon = '✅'; }
    if (type === 'error') { bgColor = '#f44336'; icon = '❌'; }
    
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
        font-size: 14px;
    `;
    toast.textContent = `${icon} ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Show menu
function showMenu() {
    document.getElementById('menuSection')?.scrollIntoView({ behavior: 'smooth' });
}

// Close modal
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('💾 Cart saved to localStorage:', cart.length, 'items');
}

// Load cart from localStorage
function loadCartFromStorage() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
            console.log('📂 Cart loaded from localStorage:', cart.length, 'items');
        } catch (e) {
            cart = [];
            console.warn('⚠️ Error loading cart, resetting');
        }
    } else {
        cart = [];
        console.log('📂 No saved cart found');
    }
}

// Make functions globally accessible
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.toggleCart = toggleCart;
window.proceedToCheckout = proceedToCheckout;
window.getCurrentLocation = getCurrentLocation;
window.placeOrder = placeOrder;
window.closeModal = closeModal;
window.showMenu = showMenu;
window.filterCategory = filterCategory;
window.loadMenuItems = loadMenuItems;

console.log('🍽️ Chikorlando Restaurant App Loaded Successfully!');
console.log('📋 Available functions:', Object.keys(window).filter(k => k.includes('addToCart') || k.includes('toggle') || k.includes('proceed')));
