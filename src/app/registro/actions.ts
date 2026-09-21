'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signUpAction(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  plan: 'rookie' | 'all_in' | 'peak';
}): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        role: 'client',
        full_name: input.fullName,
        phone: input.phone || null,
        plan: input.plan,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'Ya existe una cuenta con ese email.' };
    }
    return { error: 'No se ha podido crear la cuenta. Inténtalo de nuevo.' };
  }

  // Si la confirmación de email está desactivada en Supabase, signUp ya deja
  // sesión iniciada y podemos llevar al cliente directo a su panel.
  if (data.session) {
    redirect('/semana');
  }

  redirect('/registro/confirmacion');
}
