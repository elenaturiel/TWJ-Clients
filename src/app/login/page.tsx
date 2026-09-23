'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';
import { signInAction } from './actions';

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const result = await signInAction(data);
    if (result?.error) setServerError(result.error);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-4xl text-white">Train with Jaime</h1>
          <p className="quote mt-2 text-lg">Y tú, ¿quieres ganar?</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold">Email</label>
            <input type="email" className="input" placeholder="tu@email.com" {...register('email')} />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-semibold">Contraseña</label>
              <Link href="/recuperar" className="text-xs font-semibold text-accent">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input type="password" className="input" placeholder="••••••••" {...register('password')} />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-navy/70">
          ¿Primera vez por aquí?{' '}
          <Link href="/registro" className="font-semibold text-accent">
            Date de alta
          </Link>
        </p>
      </div>
    </main>
  );
}
