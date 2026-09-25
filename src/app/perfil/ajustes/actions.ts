'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/get-profile';
import { notifyUser } from '@/lib/notifications/notify';

export async function updateNotificationPrefsAction(input: {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
}) {
  const profile = await requireProfile();
  const supabase = createClient();

  const payload: { email_notifications_enabled?: boolean; push_notifications_enabled?: boolean } = {};
  if (input.emailEnabled !== undefined) payload.email_notifications_enabled = input.emailEnabled;
  if (input.pushEnabled !== undefined) payload.push_notifications_enabled = input.pushEnabled;

  const { error } = await supabase.from('profiles').update(payload).eq('id', profile.id);
  if (error) return { error: error.message };
  revalidatePath('/perfil/ajustes');
  return { error: null };
}

export async function savePushSubscriptionAction(sub: {
  endpoint: string;
  p256dh: string;
  authKey: string;
}) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: profile.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth_key: sub.authKey },
      { onConflict: 'endpoint' }
    );
  if (error) return { error: error.message };
  return { error: null };
}

export async function removePushSubscriptionAction(endpoint: string) {
  await requireProfile();
  const supabase = createClient();
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) return { error: error.message };
  return { error: null };
}

export async function sendTestNotificationAction() {
  const profile = await requireProfile();
  const supabase = createClient();
  await notifyUser(supabase, {
    userId: profile.id,
    title: 'Train with Jaime',
    body: 'Esto es una notificación de prueba. ¡Todo funciona!',
    path: '/perfil/ajustes',
  });
  return { error: null };
}
