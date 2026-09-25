'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('No se ha podido registrar el service worker:', err);
    });

    const clearBadge = () => {
      if (document.visibilityState !== 'visible') return;
      navigator.clearAppBadge?.().catch(() => {});
      navigator.serviceWorker.ready
        .then((reg) => reg.active?.postMessage({ type: 'CLEAR_BADGE' }))
        .catch(() => {});
    };

    clearBadge();
    document.addEventListener('visibilitychange', clearBadge);
    return () => document.removeEventListener('visibilitychange', clearBadge);
  }, []);

  return null;
}
