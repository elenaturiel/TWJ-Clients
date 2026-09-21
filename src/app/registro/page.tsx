'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validation/auth';
import { signUpAction } from './actions';

const PLANS: { value: RegisterInput['plan']; label: string; price: string }[] = [
  { value: 'rookie', label: 'Rookie', price: '24,90 €/mes' },
  { value: 'all_in', label: 'All In', price: '44,90 €/mes' },
  { value: 'peak', label: 'Peak', price: 'pack cerrado' },
];

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const result = await signUpAction(data);
    if (result?.error) setServerError(result.error);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-4xl text-white">Train with Jaime</h1>
          <p className="quote mt-2 text-lg">presupuesto de estudihambre, resultados de verdad</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold">Nombre</label>
            <input className="input" placeholder="Tu nombre" {...register('fullName')} />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Email</label>
            <input type="email" className="input" placeholder="tu@email.com" {...register('email')} />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Contraseña</label>
            <input type="password" className="input" placeholder="Mínimo 6 caracteres" {...register('password')} />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Teléfono (opcional)</label>
            <input className="input" placeholder="600 000 000" {...register('phone')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Tu plan</label>
            <div className="space-y-2">
              {PLANS.map((plan) => (
                <label
                  key={plan.value}
                  className="flex cursor-pointer items-center justify-between rounded-card border border-line px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                >
                  <span className="font-semibold">{plan.label}</span>
                  <span className="text-navy/60">{plan.price}</span>
                  <input
                    type="radio"
                    value={plan.value}
                    className="ml-2"
                    {...register('plan')}
                  />
                </label>
              ))}
            </div>
            {errors.plan && <p className="mt-1 text-sm text-red-600">{errors.plan.message}</p>}
          </div>
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-navy/70">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-accent">
            Entra aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
