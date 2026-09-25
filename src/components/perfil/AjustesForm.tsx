'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  updateNotificationPrefsAction,
  savePushSubscriptionAction,
  removePushSubscriptionAction,
  sendTestNotificationAction,
} from '@/app/perfil/ajustes/actions';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type PushSupport = 'checking' | 'unsupported' | 'supported';

export function AjustesForm({
  email,
  initialEmailEnabled,
  initialPushEnabled,
}: {
  email: string | null;
  initialEmailEnabled: boolean;
  initialPushEnabled: boolean;
}) {
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled);
  const [pushEnabled, setPushEnabled] = useState(initialPushEnabled);
  const [pushSupport, setPushSupport] = useState<PushSupport>('checking');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setPushSupport('unsupported');
      return;
    }
    setPushSupport('supported');

    // Si el navegador ya no tiene una subscripción activa (permiso revocado,
    // caché borrada...) reflejamos eso en el toggle aunque la BD diga "activado".
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!sub) setPushEnabled(false);
      })
      .catch(() => {});
  }, []);

  const toggleEmail = (value: boolean) => {
    setEmailEnabled(value);
    setError(null);
    startTransition(async () => {
      const result = await updateNotificationPrefsAction({ emailEnabled: value });
      if (result.error) {
        setError(result.error);
        setEmailEnabled(!value);
      }
    });
  };

  const enablePush = async () => {
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Has bloqueado los permisos de notificación del navegador. Actívalos desde los ajustes del sitio para poder recibir avisos.');
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setError('Las notificaciones push todavía no están configuradas en el servidor.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setError('No se ha podido activar el push en este navegador.');
        return;
      }

      const saveResult = await savePushSubscriptionAction({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        authKey: json.keys.auth,
      });
      if (saveResult.error) {
        setError(saveResult.error);
        return;
      }

      const prefsResult = await updateNotificationPrefsAction({ pushEnabled: true });
      if (prefsResult.error) {
        setError(prefsResult.error);
        return;
      }
      setPushEnabled(true);
    } catch (err) {
      setError('No se ha podido activar el push: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const disablePush = async () => {
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscriptionAction(subscription.endpoint);
        await subscription.unsubscribe();
      }
      const result = await updateNotificationPrefsAction({ pushEnabled: false });
      if (result.error) {
        setError(result.error);
        return;
      }
      setPushEnabled(false);
    } catch (err) {
      setError('No se ha podido desactivar el push: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const togglePush = (value: boolean) => {
    if (value) {
      void enablePush();
    } else {
      void disablePush();
    }
  };

  const sendTest = () => {
    setTestSent(false);
    startTransition(async () => {
      const result = await sendTestNotificationAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      setTestSent(true);
    });
  };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="text-lg font-display normal-case tracking-normal">Notificaciones por email</h2>
        <p className="mt-1 text-sm text-navy/60">
          Te avisaremos a <span className="font-semibold">{email ?? 'tu email de acceso'}</span> — el mismo con el
          que inicias sesión.
        </p>
        <div className="mt-3 flex items-center justify-between rounded-card bg-bg p-3">
          <span className="text-sm font-semibold">Nuevo entreno, nuevo menú y comentarios</span>
          <ToggleSwitch checked={emailEnabled} disabled={isPending} onChange={toggleEmail} />
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-display normal-case tracking-normal">Notificaciones móviles</h2>
        <p className="mt-1 text-sm text-navy/60">
          Instala Train with Jaime en tu pantalla de inicio para recibir avisos como una app nativa.
        </p>

        <div className="mt-4 space-y-3">
          <InstallInstructions />
        </div>

        {pushSupport === 'unsupported' && (
          <p className="mt-4 rounded-card bg-bg p-3 text-sm text-navy/60">
            Este navegador no admite notificaciones push. En iPhone, instala primero la app desde el botón
            Compartir → &quot;Añadir a pantalla de inicio&quot; y ábrela desde ahí (iOS 16.4 o superior).
          </p>
        )}

        {pushSupport === 'supported' && (
          <div className="mt-4 flex items-center justify-between rounded-card bg-bg p-3">
            <span className="text-sm font-semibold">Activar avisos push en este dispositivo</span>
            <ToggleSwitch checked={pushEnabled} disabled={isPending} onChange={togglePush} />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {pushSupport === 'supported' && pushEnabled && (
          <div className="mt-3 flex items-center gap-3">
            <button onClick={sendTest} disabled={isPending} className="btn-secondary text-xs">
              Enviar notificación de prueba
            </button>
            {testSent && <span className="text-xs text-positive">Enviada — debería llegarte en unos segundos.</span>}
          </div>
        )}
      </section>
    </div>
  );
}

function InstallInstructions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-card bg-bg p-3 text-sm">
        <p className="font-semibold">iPhone / iPad (Safari)</p>
        <ol className="mt-1 list-decimal space-y-1 pl-4 text-navy/60">
          <li>Abre esta web en Safari.</li>
          <li>
            Toca el icono <span className="font-semibold">Compartir</span> (el cuadrado con la flecha hacia
            arriba).
          </li>
          <li>
            Elige <span className="font-semibold">&quot;Añadir a pantalla de inicio&quot;</span>.
          </li>
          <li>Abre siempre la app desde ese icono, no desde Safari, para que lleguen las notificaciones.</li>
        </ol>
      </div>
      <div className="rounded-card bg-bg p-3 text-sm">
        <p className="font-semibold">Android (Chrome)</p>
        <ol className="mt-1 list-decimal space-y-1 pl-4 text-navy/60">
          <li>Abre esta web en Chrome.</li>
          <li>
            Toca el menú <span className="font-semibold">⋮</span> (tres puntos, arriba a la derecha).
          </li>
          <li>
            Elige <span className="font-semibold">&quot;Instalar aplicación&quot;</span> o
            &quot;Añadir a pantalla de inicio&quot;.
          </li>
          <li>Confirma la instalación.</li>
        </ol>
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
        checked ? 'bg-accent' : 'bg-navy/20'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
