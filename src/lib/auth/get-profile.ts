import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types/database.types';

export async function getCurrentUserAndProfile(): Promise<{
  userId: string | null;
  profile: Profile | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { userId: user.id, profile: profile ?? null };
}

export function homePathForRole(role: 'client' | 'trainer' | undefined | null): string {
  return role === 'trainer' ? '/panel' : '/semana';
}

/** Exige sesión iniciada y, opcionalmente, un rol concreto. Redirige si no se cumple. */
export async function requireProfile(role?: 'client' | 'trainer'): Promise<Profile> {
  const { userId, profile } = await getCurrentUserAndProfile();

  if (!userId || !profile) {
    redirect('/login');
  }

  if (role && profile.role !== role) {
    redirect(homePathForRole(profile.role));
  }

  return profile;
}
