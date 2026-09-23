'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/auth';
import { createClient } from '@/lib/supabase/client';

export default function RecuperarPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/actualizar-contrasena`,
    });

    if (error) {
      setServerError('No se ha podido enviar el email. Inténtalo de nuevo.');
      return;
    }

    setSent(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-4xl text-white">Train with Jaime</h1>
          <p className="quote mt-2 text-lg">Y tú, ¿quieres ganar?</p>
        </div>

        {sent ? (
          <div className="card p-6 text-center">
            <p className="font-semibold">Revisa tu email</p>
            <p className="mt-2 text-sm text-navy/70">
              Si existe una cuenta con ese email, te hemos enviado un enlace para elegir una
              contraseña nueva.
            </p>
            <Link href="/login" className="btn-primary mt-6 inline-flex">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
            <p className="text-sm text-navy/70">
              Escribe el email con el que te diste de alta y te mandamos un enlace para
              restablecer tu contraseña.
            </p>
            <div>
              <label className="mb-1 block text-sm font-semibold">Email</label>
              <input type="email" className="input" placeholder="tu@email.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-navy/70">
          <Link href="/login" className="font-semibold text-accent">
            ← Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
