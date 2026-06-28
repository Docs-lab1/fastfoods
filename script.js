import { supabaseClient } from './config.js';

// Global variables
let cart = [];
let currentMenuItems = [];
let currentCategory = 'all';
let map = null;
let marker = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadMenuItems();
    setupEventListeners();
    loadCartFromStorage();
});

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

        const { data, error } = await query;
        
        if (error) throw error;
        
        currentMenuItems = data;
        displayMenuItems(data);
    } catch (error) {
        console.error('Error loading menu:', error);
        showToast('Error loading menu items', 'error');
        // Use sample data if Supabase fails
        displaySampleMenu();
    } finally {
        showLoading(false);
    }
}

// Display sample menu (fallback)
function displaySampleMenu() {
    const sampleItems = [
        { id: 1, name: 'Grilled Chicken', description: 'With special sauce', price: 150, category: 'main', icon: '🍗' },
        { id: 2, name: 'Beef Stew', description: 'Tender beef with vegetables', price: 180, category: 'main', icon: '🥩' },
        { id: 3, name: 'Fish Fry', description: 'Crispy fried fish', price: 120, category: 'main', icon: '🐟' },
        { id: 4, name: 'Spring Rolls', description: 'Crispy vegetable rolls', price: 60, category: 'appetizer', icon: '🌯' },
        { id: 5, name: 'Samosa', description: 'Spiced potato filling', price: 40, category: 'appetizer', icon: '🥟' },
        { id: 6, name: 'Fresh Juice', description: 'Seasonal fruits', price: 35, category: 'drinks', icon: '🧃' },
        { id: 7, name: 'Soda', description: 'Assorted flavors', price: 25, category: 'drinks', icon: '🥤' },
        { id: 8, name: 'Chocolate Cake', description: 'Rich chocolate', price: 50, category: 'dessert', icon: '🍰' }
    ];
    
    const filtered = currentCategory === 'all' 
        ? sampleItems 
        : sampleItems.filter(item => item.category === currentCategory);
    
    displayMenuItems(filtered);
}

// Display menu items in grid
function displayMenuItems(items) {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    
    if (items.length === 0) {
        grid.innerHTML = `
            <div class="no-items">
                <i class="fas fa-utensils"></i>
                <p>No items available in this category</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = items.map(item => `
        <div class="menu-item" data-id="${item.id}">
            <div class="menu-item-image">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : 
                  `<span style="font-size: 40px;">${item.icon || '🍽️'}</span>`}
            </div>
            <div class="menu-item-content">
                <h4>${item.name}</h4>
                <p>${item.description || ''}</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">K${item.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart('${item.id}', '${item.name}', ${item.price})">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Add to cart
function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    
    updateCartUI();
    saveCartToStorage();
    showToast(`${name} added to cart!`, 'success');
}

// Update cart UI
function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
    
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart" style="font-size: 48px; color: #ccc;"></i>
                <p style="color: #999; margin-top: 8px;">Your cart is empty</p>
            </div>
        `;
        document.getElementById('cartTotal').textContent = 'K0.00';
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
    document.getElementById('cartTotal').textContent = `K${total.toFixed(2)}`;
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

// Toggle cart
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    sidebar.classList.toggle('open');
}

// Proceed to checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }
    
    toggleCart();
    document.getElementById('checkoutModal').classList.add('show');
    initializeMap();
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
            zoom: 15,
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
            draggable: true
        });
        
        // Update address when marker is dragged
        marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            getAddressFromCoords(pos.lat(), pos.lng());
        });
    }
}

// Get current location
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported', 'error');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            
            if (map && marker) {
                const pos = { lat: latitude, lng: longitude };
                map.setCenter(pos);
                marker.setPosition(pos);
                getAddressFromCoords(latitude, longitude);
            }
            
            showToast('Location updated!', 'success');
        },
        (error) => {
            showToast('Error getting location', 'error');
            console.error(error);
        },
        { enableHighAccuracy: true }
    );
}

// Get address from coordinates
function getAddressFromCoords(lat, lng) {
    // Reverse geocoding using Google Maps API
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };
    
    geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
            document.getElementById('deliveryAddress').value = results[0].formatted_address;
        }
    });
}

// Place order
async function placeOrder(event) {
    event.preventDefault();
    
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const address = document.getElementById('deliveryAddress').value;
    
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
            items: cart,
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
        document.getElementById('checkoutForm').reset();
        
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
        <div class="toast-content">
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Navigation
function navigateTo(page) {
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    
    // Handle navigation
    switch(page) {
        case 'home':
            // Show home content
            break;
        case 'menu':
            // Show menu
            break;
        case 'orders':
            // Show orders
            break;
        case 'profile':
            // Show profile
            break;
    }
}

// Show menu
function showMenu() {
    document.getElementById('menuSection').scrollIntoView({ behavior: 'smooth' });
}

// Close modal
function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCartFromStorage() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCartUI();
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
    document.getElementById('checkoutForm').addEventListener('submit', placeOrder);
    
    // Close modal on overlay click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
}

// Add toast styles
const toastStyles = `
    .toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 12px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        max-width: 90%;
        animation: slideDown 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .toast.success { background: #4CAF50; }
    .toast.error { background: #f44336; }
    .toast.info { background: #2196F3; }
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    .no-items {
        text-align: center;
        padding: 40px;
        color: #999;
        grid-column: 1 / -1;
    }
    .no-items i { font-size: 48px; margin-bottom: 12px; }
    .empty-cart {
        text-align: center;
        padding: 40px 0;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);