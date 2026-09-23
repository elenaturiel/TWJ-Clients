'use client';

import { useState, useTransition } from 'react';
import {
  upsertWorkoutAction,
  addExerciseAction,
  removeExerciseAction,
} from '@/app/panel/[clientId]/actions';
import type { WorkoutStatus } from '@/lib/types/database.types';
import type { WorkoutWithExercises } from '@/app/panel/[clientId]/data';

const STATUS_OPTIONS: { value: WorkoutStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'today', label: 'Hoy' },
  { value: 'done', label: 'Hecho' },
];

export function WorkoutEditorForm({
  clientId,
  date,
  dayLabel,
  workout,
}: {
  clientId: string;
  date: string;
  dayLabel: string;
  workout: WorkoutWithExercises;
}) {
  const [title, setTitle] = useState(workout.title);
  const [status, setStatus] = useState<WorkoutStatus>(workout.status);
  const [comment, setComment] = useState(workout.trainer_comment ?? '');
  const [exercises, setExercises] = useState(
    [...workout.workout_exercises].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [newExercise, setNewExercise] = useState('');
  const [newSetsReps, setNewSetsReps] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);

  const save = () => {
    startTransition(async () => {
      const result = await upsertWorkoutAction({
        clientId,
        date,
        dayLabel,
        title: title.trim() || 'Entreno',
        status,
        trainerComment: comment.trim() || null,
      });
      if (!result.error) setSaved(true);
    });
  };

  const addExercise = () => {
    if (!newExercise.trim()) return;
    const weight = newWeight ? Number(newWeight) : null;
    startTransition(async () => {
      await addExerciseAction(workout.id, clientId, newExercise.trim(), newSetsReps.trim(), weight);
      setExercises((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          workout_id: workout.id,
          name: newExercise.trim(),
          sets_reps: newSetsReps.trim() || null,
          recommended_weight_kg: weight,
          actual_sets_reps: null,
          actual_weight_kg: null,
          sort_order: Date.now(),
        },
      ]);
      setNewExercise('');
      setNewSetsReps('');
      setNewWeight('');
    });
  };

  const removeExercise = (exerciseId: string) => {
    startTransition(async () => {
      await removeExerciseAction(exerciseId, clientId);
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    });
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">{dayLabel}</span>
        <select
          className="input w-auto py-1.5 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as WorkoutStatus);
            setSaved(false);
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <input
        className="input mt-3 text-lg"
        placeholder="Título del entreno"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setSaved(false);
        }}
      />

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy/50">
          Ejercicios
        </h3>
        <div className="space-y-2">
          {exercises.map((ex) => (
            <div key={ex.id} className="rounded-card bg-bg px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{ex.name}</span>
                <button onClick={() => removeExercise(ex.id)} className="text-navy/40 hover:text-red-600">
                  ✕
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-navy/60">
                <span>
                  Recomendado: {ex.sets_reps || '—'}
                  {ex.recommended_weight_kg != null ? ` · ${ex.recommended_weight_kg} kg` : ''}
                </span>
                <span className={ex.actual_sets_reps || ex.actual_weight_kg != null ? 'font-semibold text-navy' : ''}>
                  Real: {ex.actual_sets_reps || '—'}
                  {ex.actual_weight_kg != null ? ` · ${ex.actual_weight_kg} kg` : ''}
                </span>
              </div>
            </div>
          ))}
          {exercises.length === 0 && (
            <p className="text-sm text-navy/40">Todavía no hay ejercicios.</p>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className="input"
            placeholder="Nombre del ejercicio"
            value={newExercise}
            onChange={(e) => setNewExercise(e.target.value)}
          />
          <input
            className="input sm:w-28"
            placeholder="4x8"
            value={newSetsReps}
            onChange={(e) => setNewSetsReps(e.target.value)}
          />
          <input
            className="input sm:w-24"
            placeholder="Peso kg"
            inputMode="decimal"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
          />
          <button onClick={addExercise} className="btn-secondary shrink-0">
            + Añadir
          </button>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy/50">
          Comentario para el cliente
        </h3>
        <textarea
          className="input min-h-[140px]"
          placeholder="Cuéntale cómo enfocar el entreno, qué vigilar, ánimos..."
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button onClick={save} disabled={isPending || saved} className="btn-primary">
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && !isPending && <span className="text-sm text-positive">Guardado</span>}
      </div>
    </div>
  );
}
