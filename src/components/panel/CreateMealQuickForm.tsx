'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { upsertMealAction } from '@/app/panel/[clientId]/actions';
import type { MealType } from '@/lib/types/database.types';

export function CreateMealQuickForm({
  clientId,
  date,
  mealType,
  label,
}: {
  clientId: string;
  date: string;
  mealType: MealType;
  label: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [kcal, setKcal] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !kcal) {
      setError('Ponle un título y las kcal.');
      return;
    }
    startTransition(async () => {
      const result = await upsertMealAction({
        clientId,
        date,
        mealType,
        title: title.trim(),
        kcal: Number(kcal),
        proteinG: null,
        carbsG: null,
        fatG: null,
        shoppingTip: null,
      });
      if (result.error || !result.mealId) {
        setError(result.error ?? 'No se ha podido crear la comida.');
        return;
      }
      router.push(`/panel/${clientId}/comidas/${result.mealId}`);
    });
  };

  return (
    <form onSubmit={onSubmit} className="card flex min-h-[140px] flex-col justify-center gap-2 p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">{label}</span>
      <input
        className="input py-1.5 text-sm"
        placeholder="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="input py-1.5 text-sm"
        placeholder="Kcal"
        inputMode="numeric"
        value={kcal}
        onChange={(e) => setKcal(e.target.value)}
      />
      <button type="submit" disabled={isPending} className="btn-secondary text-xs">
        {isPending ? 'Creando...' : '+ Crear comida'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
