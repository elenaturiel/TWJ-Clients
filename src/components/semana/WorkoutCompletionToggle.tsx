'use client';

import { useState, useTransition } from 'react';
import { toggleWorkoutCompletionAction } from '@/app/semana/actions';

export function WorkoutCompletionToggle({
  workoutId,
  date,
  initialDone,
}: {
  workoutId: string;
  date: string;
  initialDone: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      const result = await toggleWorkoutCompletionAction(workoutId, date, next);
      if (result.error) setDone(!next);
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`flex items-center gap-2 rounded-card border px-4 py-2 text-sm font-semibold transition-colors ${
        done
          ? 'border-positive bg-positive/10 text-positive'
          : 'border-line text-navy/60 hover:border-positive hover:text-positive'
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs ${
          done ? 'border-positive bg-positive text-white' : 'border-navy/30'
        }`}
      >
        {done ? '✓' : ''}
      </span>
      {done ? 'Entreno hecho' : 'Marcar como hecho'}
    </button>
  );
}
