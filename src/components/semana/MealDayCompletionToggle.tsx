'use client';

import { useState, useTransition } from 'react';
import { toggleMealDayCompletionAction } from '@/app/semana/actions';

export function MealDayCompletionToggle({
  date,
  initialDone,
  compact = false,
}: {
  date: string;
  initialDone: boolean;
  compact?: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      const result = await toggleMealDayCompletionAction(date, next);
      if (result.error) setDone(!next);
    });
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={isPending}
        title={done ? 'Menú seguido' : 'Marcar menú como seguido'}
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs transition-colors ${
          done ? 'border-positive bg-positive text-white' : 'border-navy/25 text-transparent hover:border-positive'
        }`}
      >
        ✓
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`flex items-center gap-2 rounded-card border px-3 py-1.5 text-xs font-semibold transition-colors ${
        done
          ? 'border-positive bg-positive/10 text-positive'
          : 'border-line text-navy/60 hover:border-positive hover:text-positive'
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 text-[10px] ${
          done ? 'border-positive bg-positive text-white' : 'border-navy/30'
        }`}
      >
        {done ? '✓' : ''}
      </span>
      {done ? 'Menú seguido' : 'Marcar menú como seguido'}
    </button>
  );
}
