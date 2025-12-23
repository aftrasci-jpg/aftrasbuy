// Checkout logic for cart page

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});

async function loadCart() {
    const cartItems = CartManager.getCartItems();

    const cartContainer = document.getElementById('cartContainer');
    const cartSummary = document.getElementById('cartSummary');
    const emptyCart = document.getElementById('emptyCart');

    if (cartItems.length === 0) {
        cartContainer.innerHTML = '';
        cartSummary.innerHTML = '';
        emptyCart.style.display = 'block';

        // Add test items for demonstration
        addTestItemsToCart();

        return;
    }

    emptyCart.style.display = 'none';
    // Note: checkoutSection is now handled by modal, no need to show it here

    // Display cart items
    cartContainer.innerHTML = cartItems.map(item => createCartItemHTML(item)).join('');

    // Display summary
    const total = CartManager.getTotal();
    const costDetails = CartManager.getTotalCostDetails();

    const realTotalCost = total + costDetails.taxes + costDetails.transport + costDetails.dedouanement;

    cartSummary.innerHTML = `
        <h3>Récapitulatif</h3>
        <p>Total produits: ${total.toFixed(2)} FCFA</p>
        <p>Coûts réels (taxes + transport + dédouanement):</p>
        <ul>
            <li>Taxes: ${costDetails.taxes.toFixed(2)} FCFA</li>
            <li>Transport: ${costDetails.transport.toFixed(2)} FCFA</li>
            <li>Dédouanement: ${costDetails.dedouanement.toFixed(2)} FCFA</li>
        </ul>
        <p><strong>Coût réel total: ${realTotalCost.toFixed(2)} FCFA</strong></p>
        <button id="proceedToCheckoutBtn" class="checkout-btn">📋 Procéder au checkout</button>
    `;

    // Setup checkout button
    const checkoutBtn = document.getElementById('proceedToCheckoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', showCheckoutForm);
    }

    // Setup modal event listeners
    const modal = document.getElementById('checkoutModal');
    const modalClose = modal.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancelCheckoutBtn');

    if (modalClose) {
        modalClose.addEventListener('click', closeCheckoutModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCheckoutModal);
    }

    // Setup form submit event
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cartItems = CartManager.getCartItems();
            await processCheckoutWithForm(cartItems);
        });
    }

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCheckoutModal();
        }
    });
}

function createCartItemHTML(item) {
    return `
        <div class="cart-item">
            <img src="${item.image || 'https://via.placeholder.com/80x80?text=No+Image'}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price.toFixed(2)} FCFA x ${item.quantity} = ${(item.price * item.quantity).toFixed(2)} FCFA</div>
            </div>
            <div class="cart-item-controls">
                <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                <input type="number" value="${item.quantity}" min="1" onchange="updateCartQuantity('${item.id}', this.value)">
                <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                <button onclick="removeFromCart('${item.id}')" style="background: #dc3545; color: white;">Supprimer</button>
            </div>
        </div>
    `;
}

function updateCartQuantity(productId, newQuantity) {
    if (newQuantity < 1) return;

    CartManager.updateQuantity(productId, parseInt(newQuantity));
    loadCart(); // Reload cart display
}

function removeFromCart(productId) {
    // Find the product in cart to show details in modal
    const cartItems = CartManager.getCartItems();
    const item = cartItems.find(item => item.id === productId);

    if (item) {
        showDeleteModal(item);
    }
}

function showDeleteModal(item) {
    document.getElementById('deleteProductImage').src = item.image;
    document.getElementById('deleteProductName').textContent = item.name;
    document.getElementById('deleteProductPrice').textContent = `${item.price.toFixed(2)} FCFA x ${item.quantity}`;

    document.getElementById('deleteModal').style.display = 'flex';

    // Setup event listeners
    document.getElementById('cancelDeleteBtn').onclick = () => closeDeleteModal();
    document.getElementById('confirmDeleteBtn').onclick = () => confirmDelete(item.id);

    // Close modal events
    document.querySelector('#deleteModal .modal-close').onclick = () => closeDeleteModal();
    document.getElementById('deleteModal').onclick = (e) => {
        if (e.target === document.getElementById('deleteModal')) {
            closeDeleteModal();
        }
    };
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

function confirmDelete(productId) {
    CartManager.removeItem(productId);
    closeDeleteModal();
    loadCart();
}

function showCartView() {
    // Hide checkout modal, show cart
    document.getElementById('checkoutModal').style.display = 'none';
    document.getElementById('cartContainer').style.display = 'block';
    document.getElementById('cartSummary').style.display = 'block';
}

function showCheckoutForm() {
    // Show checkout modal
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.add('show');
        document.getElementById('checkoutForm').reset();
    }
}

function closeCheckoutModal() {
    // Hide checkout modal
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

async function processCheckoutWithForm(cartItems) {
    if (cartItems.length === 0) return;

    // Collect form data
    const customerData = {
        firstName: document.getElementById('customerFirstName').value.trim(),
        lastName: document.getElementById('customerLastName').value.trim(),
        phone: document.getElementById('customerPhone').value.trim(),
        phoneCode: document.getElementById('customerPhoneCode').value.trim(),
        country: document.getElementById('customerCountry').value,
        city: document.getElementById('customerCity').value.trim()
    };

    // Validate required fields
    if (!customerData.firstName || !customerData.lastName || !customerData.phone || !customerData.country || !customerData.city) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }

    // Validate phone format based on country
    const phoneData = getCountryPhoneData(customerData.country);
    const fullPhoneNumber = customerData.phoneCode + customerData.phone;

    if (!validatePhoneNumber(fullPhoneNumber, phoneData)) {
        alert(`Le numéro de téléphone n'est pas valide pour ${customerData.country}.\nFormat attendu: ${phoneData.code} suivi de ${phoneData.length} chiffres.`);
        return;
    }

    // Update phone with full international format
    customerData.phone = fullPhoneNumber;

    // Get WhatsApp number (agent or site)
    const assignedAgentSlug = localStorage.getItem('assigned_agent');
    let whatsappNumber = null;

    if (assignedAgentSlug) {
        const agent = await ApiService.getAgentBySlug(assignedAgentSlug);
        if (agent) {
            whatsappNumber = agent.whatsapp_number;
        }
    }

    if (!whatsappNumber) {
        whatsappNumber = await ApiService.getSiteWhatsapp();
    }

    if (!whatsappNumber) {
        alert('Erreur: Aucun numéro WhatsApp configuré. Contactez le support.');
        return;
    }

    // Generate WhatsApp message with customer data
    const message = generateCompleteWhatsAppMessage(cartItems, customerData);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Clear cart after checkout
    CartManager.clearCart();
    alert('Commande envoyée avec succès ! Redirection vers WhatsApp...');

    // Redirect to catalog
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

async function handleCheckout() {
    // This function is kept for backward compatibility
    // Now we use the form-based checkout
    showCheckoutForm();
}

function generateCompleteWhatsAppMessage(cartItems, customerData) {
    const total = CartManager.getTotal();
    const costDetails = CartManager.getTotalCostDetails();
    const totalCosts = costDetails.taxes + costDetails.transport + costDetails.dedouanement;
    const realTotalCost = total + totalCosts; // Total produits + taxes + transport + dédouanement

    // Header with customer info
    let message = `🛒 Nouvelle commande - ${customerData.firstName} ${customerData.lastName}\n\n`;

    // Customer information
    message += `👤 INFORMATIONS CLIENT:\n`;
    message += `• Prénom: ${customerData.firstName}\n`;
    message += `• Nom: ${customerData.lastName}\n`;
    message += `• Téléphone: ${customerData.phone}\n`;
    message += `• Pays: ${customerData.country}\n`;
    message += `• Ville: ${customerData.city}\n`;

    message += `\n📦 ARTICLES COMMANDÉS:\n`;

    // Cart items
    cartItems.forEach(item => {
        message += `• ${item.name} x${item.quantity} - ${item.price.toFixed(2)} FCFA\n`;
    });

    // Totals
    message += `\n💰 TOTAL PRODUITS: ${total.toFixed(2)} FCFA`;

    // Cost details
    message += `\n📊 COÛTS RÉELS (taxes + transport + dédouanement):`;
    message += `\n• Taxes: ${costDetails.taxes.toFixed(2)} FCFA`;
    message += `\n• Transport: ${costDetails.transport.toFixed(2)} FCFA`;
    message += `\n• Dédouanement: ${costDetails.dedouanement.toFixed(2)} FCFA`;
    message += `\n• Total coûts réels: ${totalCosts.toFixed(2)} FCFA`;

    // Grand total
    message += `\n💵 COÛT RÉEL TOTAL: ${realTotalCost.toFixed(2)} FCFA`;

    message += `\n\n✅ Commande prête pour traitement !`;

    return message;
}

function getDeliveryMethodLabel(method) {
    const labels = {
        'standard': 'Livraison standard (3-5 jours)',
        'express': 'Livraison express (1-2 jours)',
        'pickup': 'Retrait en magasin'
    };
    return labels[method] || method;
}

function addTestItemsToCart() {
    // Add test products to demonstrate the cart
    const testProducts = [
        {
            id: 'test-1',
            name: 'Ordinateur Portable Gaming',
            price: 1200,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100&h=100&fit=crop',
            cost_details: { taxes: 120, transport: 80, dedouanement: 60 }
        },
        {
            id: 'test-2',
            name: 'Smartphone Android',
            price: 350,
            quantity: 2,
            image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&h=100&fit=crop',
            cost_details: { taxes: 35, transport: 25, dedouanement: 20 }
        }
    ];

    // Add each test product to cart
    testProducts.forEach(product => {
        CartManager.addItem(product, product.quantity);
    });

    // Reload cart after adding test items
    setTimeout(() => {
        loadCart();
    }, 100);
}

function generateWhatsAppMessage(cartItems) {
    const total = CartManager.getTotal();
    const costDetails = CartManager.getTotalCostDetails();
    const totalCosts = costDetails.taxes + costDetails.transport + costDetails.dedouanement;
    const realTotalCost = total + totalCosts;

    let message = '🛒 Nouvelle commande:\n\n';

    cartItems.forEach(item => {
        message += `• ${item.name} x${item.quantity} - ${item.price.toFixed(2)} FCFA\n`;
    });

    message += `\n💰 Total produits: ${total.toFixed(2)} FCFA`;
    message += `\n📊 Coûts réels (taxes + transport + dédouanement): ${totalCosts.toFixed(2)} FCFA`;
    message += `\n💵 Coût réel total: ${realTotalCost.toFixed(2)} FCFA`;

    return message;
}

// Phone number utilities
const countryPhoneData = {
    'Côte d\'Ivoire': { code: '+225', length: 10, example: '0102030405' },
    'Sénégal': { code: '+221', length: 9, example: '701234567' },
    'Mali': { code: '+223', length: 8, example: '12345678' },
    'Burkina Faso': { code: '+226', length: 8, example: '12345678' },
    'Niger': { code: '+227', length: 8, example: '12345678' },
    'Togo': { code: '+228', length: 8, example: '12345678' },
    'Bénin': { code: '+229', length: 8, example: '12345678' },
    'Ghana': { code: '+233', length: 9, example: '123456789' },
    'Guinée': { code: '+224', length: 9, example: '123456789' },
    'France': { code: '+33', length: 9, example: '123456789' },
    'USA': { code: '+1', length: 10, example: '2125551234' },
    'Canada': { code: '+1', length: 10, example: '4165551234' },
    'Royaume-Uni': { code: '+44', length: 10, example: '07123456789' }
};

function getCountryPhoneData(country) {
    return countryPhoneData[country] || { code: '+225', length: 10, example: '0102030405' };
}

function validatePhoneNumber(phoneNumber, phoneData) {
    // Check if phone starts with correct country code
    if (!phoneNumber.startsWith(phoneData.code)) {
        return false;
    }

    // Remove country code and check remaining digits
    const localNumber = phoneNumber.substring(phoneData.code.length);

    // Check if local number has correct length and contains only digits
    return localNumber.length === phoneData.length && /^\d+$/.test(localNumber);
}

// Initialize phone field when modal opens
document.addEventListener('DOMContentLoaded', () => {
    // Setup country change listener for phone auto-fill
    const countrySelect = document.getElementById('customerCountry');
    const phoneCodeInput = document.getElementById('customerPhoneCode');
    const phoneInput = document.getElementById('customerPhone');
    const phoneHelp = document.getElementById('phoneHelp');

    if (countrySelect && phoneCodeInput && phoneInput && phoneHelp) {
        // Set default to Côte d'Ivoire
        updatePhoneFields('Côte d\'Ivoire');

        countrySelect.addEventListener('change', (e) => {
            updatePhoneFields(e.target.value);
        });
    }
});

function updatePhoneFields(country) {
    const phoneData = getCountryPhoneData(country);
    const phoneCodeInput = document.getElementById('customerPhoneCode');
    const phoneInput = document.getElementById('customerPhone');
    const phoneHelp = document.getElementById('phoneHelp');

    if (phoneCodeInput && phoneInput && phoneHelp) {
        phoneCodeInput.value = phoneData.code;
        phoneInput.placeholder = phoneData.example;
        phoneInput.maxLength = phoneData.length;
        phoneInput.value = ''; // Clear current value when country changes
        phoneHelp.textContent = `Exemple: ${phoneData.example} (${phoneData.length} chiffres)`;
    }
}
