# Chikorlando Restaurant & Take Away

A complete food ordering and delivery application for Chikorlando Restaurant in Kasama District.

## Features
- 🍽️ Browse menu with categories
- 🛒 Add items to cart
- 📍 Real-time location using Google Maps
- 👨‍💼 Admin dashboard for order management
- 🚚 Delivery boy interface
- 📱 Mobile-optimized with Airtel-like design
- 🔴 Professional red theme

## Technologies Used
- HTML5, CSS3, JavaScript
- Supabase (Database & Authentication)
- Google Maps API
- Font Awesome Icons

## Setup Instructions

### 1. Supabase Setup
1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Run the SQL schema from the database section above
4. Enable authentication with email/password

### 2. Google Maps API
1. Go to Google Cloud Console
2. Enable Maps JavaScript API and Geocoding API
3. Generate an API key
4. Add your domain to allowed referrers

### 3. Configuration
Update `config.js` with your credentials:
```javascript
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
const GOOGLE_MAPS_API_KEY = 'your-google-maps-api-key'; 