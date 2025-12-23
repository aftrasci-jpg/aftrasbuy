// Cart management with localStorage

class CartManager {
    static CART_KEY = 'catalog_cart';

    static getCart() {
        const cart = localStorage.getItem(this.CART_KEY);
        return cart ? JSON.parse(cart) : [];
    }

    static saveCart(cart) {
        localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
        this.updateCartCount();
    }

    static addItem(product, quantity = 1) {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: this.calculatePrice(product, quantity),
                quantity: quantity,
                image: product.images[0] || '',
                cost_details: product.cost_details
            });
        }

        this.saveCart(cart);
    }

    static updateQuantity(productId, quantity) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === productId);

        if (item) {
            item.quantity = quantity;
            // Recalculate price based on new quantity
            // Note: This assumes we have the full product data, but for simplicity we'll keep current price
            this.saveCart(cart);
        }
    }

    static removeItem(productId) {
        const cart = this.getCart();
        const filteredCart = cart.filter(item => item.id !== productId);
        this.saveCart(filteredCart);
    }

    static clearCart() {
        localStorage.removeItem(this.CART_KEY);
        this.updateCartCount();
    }

    static getTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    static getTotalCostDetails() {
        const cart = this.getCart();
        const totalCosts = { taxes: 0, transport: 0, dedouanement: 0 };

        cart.forEach(item => {
            if (item.cost_details) {
                totalCosts.taxes += (item.cost_details.taxes || 0) * item.quantity;
                totalCosts.transport += (item.cost_details.transport || 0) * item.quantity;
                totalCosts.dedouanement += (item.cost_details.dedouanement || 0) * item.quantity;
            }
        });

        return totalCosts;
    }

    static calculatePrice(product, quantity) {
        // Find the appropriate price tier based on quantity
        const pricing = product.pricing || [];
        const tier = pricing
            .filter(p => quantity >= p.min_qty && quantity <= p.max_qty)
            .sort((a, b) => b.min_qty - a.min_qty)[0]; // Get the highest matching tier

        return tier ? tier.price : (pricing[0]?.price || 0);
    }

    static updateCartCount() {
        const cart = this.getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }
    }

    static getCartItems() {
        return this.getCart();
    }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    CartManager.updateCartCount();
});
