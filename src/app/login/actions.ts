'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { homePathForRole } from '@/lib/auth/get-profile';

export async function signInAction(input: {
  email: string;
  password: string;
}): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);

  if (error) {
    return { error: 'Email o contraseña incorrectos.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  redirect(homePathForRole(profile?.role));
}
