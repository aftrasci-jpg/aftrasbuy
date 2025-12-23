// Main logic for the catalog page

let allProducts = [];
let allCategories = [];

let carouselImages = [];
let currentSlide = 0;
let carouselInterval;

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);

                // Request notification permission
                requestNotificationPermission();

                // Check if app is installed
                checkInstallPrompt();
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show custom install button
    showInstallButton();
});

// Notification permission request
async function requestNotificationPermission() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('Notification permission granted');

            // Subscribe to push notifications (only if VAPID key is configured)
            const vapidKey = 'YOUR_PUBLIC_VAPID_KEY';
            if (vapidKey !== 'YOUR_PUBLIC_VAPID_KEY') {
                subscribeToNotifications();
            } else {
                console.log('Push notifications disabled - VAPID key not configured');
            }
        } else {
            console.log('Notification permission denied');
        }
    }
}

// Subscribe to push notifications
async function subscribeToNotifications() {
    const vapidKey = 'YOUR_PUBLIC_VAPID_KEY';
    if (vapidKey === 'YOUR_PUBLIC_VAPID_KEY') {
        console.log('Push notifications disabled - VAPID key not configured');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });

        console.log('Push notification subscription:', subscription);

        // Send subscription to server
        await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscription)
        });

    } catch (error) {
        console.error('Push subscription failed:', error);
    }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Show install button
function showInstallButton() {
    const installButton = document.createElement('button');
    installButton.id = 'installButton';
    installButton.innerHTML = '📱 Installer l\'app';
    installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #F28C28;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 50px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(242, 140, 40, 0.3);
        z-index: 1000;
        transition: all 0.3s ease;
    `;

    installButton.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();

            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
                installButton.remove();
            });
        }
    });

    // Hover effects
    installButton.addEventListener('mouseenter', () => {
        installButton.style.transform = 'scale(1.05)';
        installButton.style.boxShadow = '0 6px 20px rgba(242, 140, 40, 0.4)';
    });

    installButton.addEventListener('mouseleave', () => {
        installButton.style.transform = 'scale(1)';
        installButton.style.boxShadow = '0 4px 15px rgba(242, 140, 40, 0.3)';
    });

    document.body.appendChild(installButton);

    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (installButton.parentNode) {
            installButton.remove();
        }
    }, 10000);
}

// Check if app is already installed
function checkInstallPrompt() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
        console.log('App is running in standalone mode');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadProducts();
    await loadCarousel();
    await loadLogo();

    // Handle URL parameters for agent assignment
    const urlParams = new URLSearchParams(window.location.search);
    const agentSlug = urlParams.get('agent');
    if (agentSlug) {
        localStorage.setItem('assigned_agent', agentSlug);
    }

    // Setup event listeners
    setupEventListeners();
});

async function loadCarousel() {
    try {
        const response = await fetch('/api/carousel');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }
        carouselImages = await response.json();
        if (carouselImages && carouselImages.length > 0) {
            initCarousel();
        } else {
            // Hide carousel if no images
            document.getElementById('heroCarousel').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading carousel:', error);
        // Create fallback carousel with static images
        carouselImages = [
            {
                title: 'Bienvenue sur notre catalogue',
                description: 'Découvrez notre sélection de produits',
                image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop',
                link_url: '#products'
            },
            {
                title: 'Produits de qualité',
                description: 'Électronique et mobilier haut de gamme',
                image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
                link_url: '#categories'
            }
        ];
        initCarousel();
    }
}

function initCarousel() {
    const slidesContainer = document.getElementById('carouselSlides');
    const indicatorsContainer = document.getElementById('carouselIndicators');

    slidesContainer.innerHTML = '';
    indicatorsContainer.innerHTML = '';

    carouselImages.forEach((image, index) => {
        // Create slide
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.style.backgroundImage = `url(${image.image_url})`;

        const content = document.createElement('div');
        content.className = 'carousel-content';

        content.innerHTML = `
            <h2>${image.title || ''}</h2>
            <p>${image.description || ''}</p>
            ${image.link_url ? `<a href="${image.link_url}" class="btn">En savoir plus</a>` : ''}
        `;

        slide.appendChild(content);
        slidesContainer.appendChild(slide);

        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
        indicator.onclick = () => goToSlide(index);
        indicatorsContainer.appendChild(indicator);
    });

    // Start auto-play
    startCarousel();
}

function startCarousel() {
    carouselInterval = setInterval(() => {
        nextSlide();
    }, 5000); // Change slide every 5 seconds
}

function stopCarousel() {
    clearInterval(carouselInterval);
}

function nextSlide() {
    goToSlide((currentSlide + 1) % carouselImages.length);
}

function prevSlide() {
    goToSlide((currentSlide - 1 + carouselImages.length) % carouselImages.length);
}

function goToSlide(index) {
    currentSlide = index;
    const slidesContainer = document.getElementById('carouselSlides');
    const indicators = document.querySelectorAll('.carousel-indicator');

    // Update slide position
    slidesContainer.style.transform = `translateX(-${index * 100}%)`;

    // Update indicators
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });

    // Reset auto-play timer
    stopCarousel();
    startCarousel();
}

// Pause carousel on hover
document.getElementById('heroCarousel').addEventListener('mouseenter', stopCarousel);
document.getElementById('heroCarousel').addEventListener('mouseleave', startCarousel);

async function loadLogo() {
    try {
        const response = await fetch('/api/settings/site_logo');
        if (response.ok) {
            const data = await response.json();
            const logoUrl = data.value;

            const logoContainer = document.getElementById('siteLogo');
            if (logoUrl) {
                logoContainer.innerHTML = `<a href="/"><img src="${logoUrl}" alt="Logo"></a>`;
            } else {
                logoContainer.innerHTML = ''; // No logo defined
            }
        }
    } catch (error) {
        console.error('Error loading logo:', error);
        // Silently fail - no logo will be shown
    }
}

async function loadCategories() {
    allCategories = await ApiService.fetchCategories();
    const categoryFilter = document.getElementById('categoryFilter');

    allCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

async function loadProducts(categoryId = null) {
    showLoading();

    allProducts = await ApiService.fetchProducts();

    if (categoryId) {
        allProducts = allProducts.filter(product => product.category_id === categoryId);
    }

    displayProducts(allProducts);
    hideLoading();
}

function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    const noResults = document.getElementById('noResults');

    container.innerHTML = '';

    if (products.length === 0) {
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    products.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x200?text=No+Image';

    card.innerHTML = `
        <img src="${imageUrl}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-description">${product.short_description || product.description}</div>
            <div class="product-price" id="price-${product.id}">Prix: ${calculateDynamicPrice(product, 1)} FCFA</div>
            <div class="quantity-selector">
                <button onclick="decreaseQuantity('${product.id}')">-</button>
                <input type="number" id="qty-${product.id}" value="1" min="1" onchange="updatePrice('${product.id}')">
                <button onclick="increaseQuantity('${product.id}')">+</button>
            </div>
            <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">Ajouter au panier</button>
        </div>
    `;

    return card;
}

function calculateDynamicPrice(product, quantity) {
    return CartManager.calculatePrice(product, quantity);
}

function updatePrice(productId) {
    const product = allProducts.find(p => p.id === productId);
    const quantityInput = document.getElementById(`qty-${productId}`);
    const quantity = parseInt(quantityInput.value) || 1;
    const priceElement = document.getElementById(`price-${productId}`);

    const price = calculateDynamicPrice(product, quantity);
    priceElement.textContent = `Prix: ${price} FCFA`;
}

function increaseQuantity(productId) {
    const input = document.getElementById(`qty-${productId}`);
    input.value = parseInt(input.value) + 1;
    updatePrice(productId);
}

function decreaseQuantity(productId) {
    const input = document.getElementById(`qty-${productId}`);
    const currentValue = parseInt(input.value);
    if (currentValue > 1) {
        input.value = currentValue - 1;
        updatePrice(productId);
    }
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    const quantityInput = document.getElementById(`qty-${productId}`);
    const quantity = parseInt(quantityInput.value) || 1;

    CartManager.addItem(product, quantity);

    // Reset quantity to 1
    quantityInput.value = 1;
    updatePrice(productId);

    // Show feedback
    alert(`${quantity} x ${product.name} ajouté(s) au panier !`);
}

function setupEventListeners() {
    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.addEventListener('change', (e) => {
        const categoryId = e.target.value;
        loadProducts(categoryId || null);
    });
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

    if (!searchTerm) {
        displayProducts(allProducts);
        return;
    }

    const filteredProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.short_description?.toLowerCase().includes(searchTerm)
    );

    displayProducts(filteredProducts);
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('productsContainer').innerHTML = '';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}
