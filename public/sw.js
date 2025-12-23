const CACHE_NAME = 'aftras-buy-v3';
const urlsToCache = [
  '/',
  '/css/style.css',
  '/js/main.js',
  '/js/api.js',
  '/js/cart.js',
  '/js/checkout.js',
  '/manifest.json',
  '/icon.svg',
  '/cart.html',
  '/contact.html'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker caching resources.');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        // Clone the request for fetch
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if response is valid
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Background sync for offline orders
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-orders') {
    event.waitUntil(syncOrders());
  }
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification AFTRAS-Buy',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Voir les produits',
        icon: '/icon.svg'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AFTRAS-Buy', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

async function syncOrders() {
  try {
    // Get stored orders from IndexedDB or localStorage
    const orders = await getStoredOrders();

    for (const order of orders) {
      await sendOrderToServer(order);
    }

    // Clear stored orders after successful sync
    await clearStoredOrders();

    // Show success notification
    self.registration.showNotification('AFTRAS-Buy', {
      body: 'Commandes synchronisées avec succès !',
      icon: '/icon.svg'
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for order sync (to be implemented)
async function getStoredOrders() {
  // Implementation would depend on your storage method
  return [];
}

async function sendOrderToServer(order) {
  // Implementation would depend on your API
  return fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(order)
  });
}

async function clearStoredOrders() {
  // Clear stored orders after successful sync
}
