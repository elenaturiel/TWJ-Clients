'use client';

import { useState, useTransition } from 'react';
import { updateExerciseActualAction } from '@/app/semana/actions';
import type { WorkoutExercise } from '@/lib/types/database.types';

export function ExerciseActualsList({ exercises }: { exercises: WorkoutExercise[] }) {
  if (exercises.length === 0) {
    return <p className="py-3 text-sm text-navy/40">Todavía no hay ejercicios en este entreno.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {exercises.map((ex) => (
        <ExerciseRow key={ex.id} exercise={ex} />
      ))}
    </ul>
  );
}

function ExerciseRow({ exercise }: { exercise: WorkoutExercise }) {
  const [setsReps, setSetsReps] = useState(exercise.actual_sets_reps ?? '');
  const [weight, setWeight] = useState(
    exercise.actual_weight_kg != null ? String(exercise.actual_weight_kg) : ''
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);

  const save = () => {
    startTransition(async () => {
      const weightValue = weight ? Number(weight.replace(',', '.')) : null;
      const result = await updateExerciseActualAction(exercise.id, weightValue, setsReps.trim() || null);
      if (!result.error) setSaved(true);
    });
  };

  return (
    <li className="py-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{exercise.name}</span>
        <span className="text-navy/50">
          Recomendado: {exercise.sets_reps || '—'}
          {exercise.recommended_weight_kg != null ? ` · ${exercise.recommended_weight_kg} kg` : ''}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-navy/40">
            Series x reps reales
          </label>
          <input
            className="input w-28 py-1.5 text-sm"
            placeholder="4x8"
            value={setsReps}
            onChange={(e) => {
              setSetsReps(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-navy/40">
            Peso real (kg)
          </label>
          <input
            className="input w-24 py-1.5 text-sm"
            placeholder="20"
            inputMode="decimal"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        <button onClick={save} disabled={isPending || saved} className="btn-secondary py-1.5 text-xs">
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
        {saved && !isPending && <span className="text-xs text-positive">Guardado</span>}
      </div>
    </li>
  );
}
