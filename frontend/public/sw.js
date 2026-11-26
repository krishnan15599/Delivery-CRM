/* Delivery CRM Service Worker for PWA & Web Push Notifications */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'New Delivery Assigned',
    body: 'You have been assigned a new delivery.',
    icon: '/assets/icon.svg',
    badge: '/assets/icon.svg',
    url: '/deliveries',
    deliveryId: null,
    trackingNumber: null,
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = { ...payload, ...data };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/assets/icon.svg',
    badge: payload.badge || '/assets/icon.svg',
    tag: payload.trackingNumber ? `delivery-${payload.trackingNumber}` : 'delivery-assignment',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.url || (payload.deliveryId ? `/deliveries/${payload.deliveryId}` : '/deliveries'),
      deliveryId: payload.deliveryId,
      trackingNumber: payload.trackingNumber,
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetPath = event.notification?.data?.url || '/deliveries';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return client;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
