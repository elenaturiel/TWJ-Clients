'use client';

import { useState, useTransition } from 'react';
import { rateWorkoutAction } from '@/app/semana/actions';

export function RatingSlider({
  workoutId,
  initialRating,
}: {
  workoutId: string;
  initialRating: number | null;
}) {
  const [rating, setRating] = useState(initialRating ?? 5);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(initialRating !== null);

  const commit = (value: number) => {
    setSaved(false);
    startTransition(async () => {
      await rateWorkoutAction(workoutId, value);
      setSaved(true);
    });
  };

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs text-navy/60">
        <span>¿Cómo te sentiste?</span>
        <span className="font-semibold text-navy">{rating}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        onMouseUp={(e) => commit(Number((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => commit(Number((e.target as HTMLInputElement).value))}
        className="w-full accent-accent"
      />
      {isPending && <p className="text-[11px] text-navy/40">Guardando...</p>}
      {saved && !isPending && <p className="text-[11px] text-positive">Guardado</p>}
    </div>
  );
}
