'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { upsertWorkoutAction } from '@/app/panel/[clientId]/actions';

export function CreateWorkoutQuickForm({
  clientId,
  date,
  dayLabel,
}: {
  clientId: string;
  date: string;
  dayLabel: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await upsertWorkoutAction({
        clientId,
        date,
        dayLabel,
        title: title.trim() || 'Entreno',
        status: 'pending',
        trainerComment: null,
      });
      if (result.error || !result.workoutId) {
        setError(result.error ?? 'No se ha podido crear el entreno.');
        return;
      }
      router.push(`/panel/${clientId}/entrenos/${result.workoutId}`);
    });
  };

  return (
    <form onSubmit={onSubmit} className="card flex min-h-[140px] flex-col justify-center gap-2 p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">{dayLabel}</span>
      <input
        className="input py-1.5 text-sm"
        placeholder="Título del entreno"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button type="submit" disabled={isPending} className="btn-secondary text-xs">
        {isPending ? 'Creando...' : '+ Crear entreno'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
