import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database.types';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:hola@trainwithjaime.app';

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!vapidPublicKey || !vapidPrivateKey) return false;
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Envía un push a todos los dispositivos guardados de un usuario. Nunca lanza. */
export async function sendPushToUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  payload: PushPayload
) {
  if (!ensureConfigured()) {
    console.warn('[push] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY no configuradas: push omitido.');
    return;
  }

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (!subscriptions || subscriptions.length === 0) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          body
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscripción caducada o revocada por el navegador: la limpiamos.
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.warn('[push] Error enviando notificación:', err);
        }
      }
    })
  );
}
