// API functions for communicating with the backend

const API_BASE = window.location.origin;

class ApiService {
    static async fetchProducts() {
        try {
            const response = await fetch(`${API_BASE}/api/products`);
            if (!response.ok) throw new Error('Failed to fetch products');
            return await response.json();
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    static async fetchCategories() {
        try {
            const response = await fetch(`${API_BASE}/api/categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            return await response.json();
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }

    static async getAgentBySlug(slug) {
        try {
            const response = await fetch(`${API_BASE}/api/agents/slug/${slug}`);
            if (!response.ok) throw new Error('Agent not found');
            return await response.json();
        } catch (error) {
            console.error('Error fetching agent:', error);
            return null;
        }
    }

    static async getSiteWhatsapp() {
        try {
            const response = await fetch(`${API_BASE}/api/settings/site_whatsapp`);
            if (!response.ok) throw new Error('Site WhatsApp not configured');
            const data = await response.json();
            return data.value;
        } catch (error) {
            console.error('Error fetching site WhatsApp:', error);
            return null;
        }
    }
}

// Note: We'll add the agents route for public access by slug
// For now, assume it's added to server.js
