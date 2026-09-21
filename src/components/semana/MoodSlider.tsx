'use client';

import { useState, useTransition } from 'react';
import { logMoodAction } from '@/app/semana/actions';

const LABELS = ['Fatal', 'Regular', 'Normal', 'Bien', 'Genial'];

export function MoodSlider({
  weekStartISO,
  initialScore,
}: {
  weekStartISO: string;
  initialScore: number | null;
}) {
  const [score, setScore] = useState(initialScore ?? 3);
  const [isPending, startTransition] = useTransition();

  const commit = (value: number) => {
    startTransition(async () => {
      await logMoodAction(weekStartISO, value);
    });
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-navy/60">
        <span>Sensación general de la semana</span>
        <span className="font-semibold text-navy">{LABELS[score - 1]}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={score}
        onChange={(e) => setScore(Number(e.target.value))}
        onMouseUp={(e) => commit(Number((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => commit(Number((e.target as HTMLInputElement).value))}
        className="w-full accent-accent"
      />
      {isPending && <p className="text-[11px] text-navy/40">Guardando...</p>}
    </div>
  );
}
