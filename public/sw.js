// Service Worker de Train with Jaime: recibe pushes y mantiene el badge del
// icono de la app con el nº de notificaciones sin leer.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function openBadgeDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('twj-badge', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('kv');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getBadgeCount() {
  try {
    const db = await openBadgeDb();
    return await new Promise((resolve) => {
      const tx = db.transaction('kv', 'readonly');
      const req = tx.objectStore('kv').get('count');
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

async function setBadgeCount(count) {
  try {
    const db = await openBadgeDb();
    await new Promise((resolve) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(count, 'count');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // IndexedDB no disponible: seguimos, solo perdemos la persistencia del contador.
  }
  try {
    if (count > 0 && self.navigator && self.navigator.setAppBadge) {
      await self.navigator.setAppBadge(count);
    } else if (count === 0 && self.navigator && self.navigator.clearAppBadge) {
      await self.navigator.clearAppBadge();
    }
  } catch {
    // Badging API no soportada (iOS, Firefox...): no hay fallback visual posible,
    // el usuario sigue viendo el banner de la notificación en sí.
  }
}

self.addEventListener('push', (event) => {
  let data = { title: 'Train with Jaime', body: 'Tienes una notificación nueva.', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // payload no era JSON: nos quedamos con el mensaje genérico.
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  };

  event.waitUntil(
    (async () => {
      const count = await getBadgeCount();
      await setBadgeCount(count + 1);
      await self.registration.showNotification(data.title, options);
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      await setBadgeCount(0);
      const target = new URL(url, self.location.origin).href;
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

      for (const client of allClients) {
        if (client.url === target && 'focus' in client) return client.focus();
      }
      for (const client of allClients) {
        if ('focus' in client && 'navigate' in client) {
          await client.focus();
          return client.navigate(target);
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })()
  );
});

// La página en primer plano nos avisa (al hacerse visible) de que el usuario
// ya ha "leído" las notificaciones, para poner el badge a cero.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    event.waitUntil(setBadgeCount(0));
  }
});
