import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Profile } from '@/lib/types/database.types';
import { sendEmail } from './email';
import { sendPushToUser } from './push';

export function appUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return `${base}${path}`;
}

interface NotifyInput {
  userId: string;
  title: string;
  body: string;
  path: string; // ruta relativa, ej. "/semana"
  emailHtml?: string; // si no se pasa, se genera un email simple a partir de title/body
}

/**
 * Notifica a un usuario (cliente o Jaime) por email y/o push según sus
 * preferencias guardadas en `profiles`. Nunca lanza: un fallo de
 * email/push no debe romper la acción que lo dispara.
 */
export async function notifyUser(supabase: SupabaseClient<Database>, input: NotifyInput) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, email_notifications_enabled, push_notifications_enabled')
      .eq('id', input.userId)
      .maybeSingle<Pick<Profile, 'email' | 'email_notifications_enabled' | 'push_notifications_enabled'>>();

    if (!profile) return;

    const url = appUrl(input.path);

    const tasks: Promise<void>[] = [];

    if (profile.email_notifications_enabled && profile.email) {
      const html =
        input.emailHtml ??
        `<p>${input.body}</p><p><a href="${url}">Ver en Train with Jaime →</a></p>`;
      tasks.push(sendEmail(profile.email, input.title, html));
    }

    if (profile.push_notifications_enabled) {
      tasks.push(sendPushToUser(supabase, input.userId, { title: input.title, body: input.body, url: input.path }));
    }

    await Promise.all(tasks);
  } catch (err) {
    console.warn('[notify] Error notificando al usuario:', err);
  }
}

/** El único entrenador de la app (Jaime). */
export async function getTrainerId(supabase: SupabaseClient<Database>): Promise<string | null> {
  const { data } = await supabase.from('profiles').select('id').eq('role', 'trainer').limit(1).maybeSingle();
  return data?.id ?? null;
}
