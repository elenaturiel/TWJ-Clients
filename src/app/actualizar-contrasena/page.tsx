'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { newPasswordSchema, type NewPasswordInput } from '@/lib/validation/auth';
import { createClient } from '@/lib/supabase/client';

function homePathForRole(role: 'client' | 'trainer' | undefined | null): string {
  return role === 'trainer' ? '/panel' : '/semana';
}

export default function ActualizarContrasenaPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordInput>({ resolver: zodResolver(newPasswordSchema) });

  const onSubmit = async (data: NewPasswordInput) => {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      setServerError('No se ha podido actualizar la contraseña. Pide un enlace nuevo desde "Recuperar contraseña".');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let role: 'client' | 'trainer' | undefined;
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      role = profile?.role;
    }

    router.push(homePathForRole(role));
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-4xl text-white">Train with Jaime</h1>
          <p className="quote mt-2 text-lg">Y tú, ¿quieres ganar?</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
          <p className="text-sm text-navy/70">Elige tu nueva contraseña.</p>
          <div>
            <label className="mb-1 block text-sm font-semibold">Contraseña nueva</label>
            <input type="password" className="input" placeholder="Mínimo 6 caracteres" {...register('password')} />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Repite la contraseña</label>
            <input type="password" className="input" placeholder="Repite la contraseña" {...register('confirmPassword')} />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </main>
  );
}
