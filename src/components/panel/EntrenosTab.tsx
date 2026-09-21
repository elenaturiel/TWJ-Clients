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

export function EntrenosTab({
  clientId,
  days,
}: {
  clientId: string;
  days: { iso: string; label: string; workout: WorkoutWithExercises | undefined }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {days.map((d) => (
        <DayEditor key={d.iso} clientId={clientId} date={d.iso} dayLabel={d.label} workout={d.workout} />
      ))}
    </div>
  );
}

function DayEditor({
  clientId,
  date,
  dayLabel,
  workout,
}: {
  clientId: string;
  date: string;
  dayLabel: string;
  workout: WorkoutWithExercises | undefined;
}) {
  const [title, setTitle] = useState(workout?.title ?? '');
  const [status, setStatus] = useState<WorkoutStatus>(workout?.status ?? 'pending');
  const [comment, setComment] = useState(workout?.trainer_comment ?? '');
  const [workoutId, setWorkoutId] = useState(workout?.id ?? null);
  const [exercises, setExercises] = useState(workout?.workout_exercises ?? []);
  const [newExercise, setNewExercise] = useState('');
  const [newSetsReps, setNewSetsReps] = useState('');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);

  const save = () => {
    startTransition(async () => {
      const result = await upsertWorkoutAction({
        clientId,
        date,
        dayLabel,
        title: title || 'Entreno',
        status,
        trainerComment: comment || null,
      });
      if (!result.error && result.workoutId) {
        setWorkoutId(result.workoutId);
        setSaved(true);
      }
    });
  };

  const addExercise = () => {
    if (!workoutId || !newExercise.trim()) return;
    startTransition(async () => {
      await addExerciseAction(workoutId, clientId, newExercise.trim(), newSetsReps.trim());
      setExercises((prev) => [
        ...prev,
        { id: crypto.randomUUID(), workout_id: workoutId, name: newExercise.trim(), sets_reps: newSetsReps.trim() || null, sort_order: Date.now() },
      ]);
      setNewExercise('');
      setNewSetsReps('');
    });
  };

  const removeExercise = (exerciseId: string) => {
    startTransition(async () => {
      await removeExerciseAction(exerciseId, clientId);
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    });
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">{dayLabel}</span>
        <select
          className="input w-auto py-1 text-xs"
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
        className="input mt-2"
        placeholder="Título del entreno"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setSaved(false);
        }}
      />

      {workoutId && (
        <div className="mt-2 space-y-1">
          {exercises.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between rounded-card bg-bg px-2 py-1 text-xs">
              <span>
                {ex.name} {ex.sets_reps && <span className="text-navy/50">· {ex.sets_reps}</span>}
              </span>
              <button onClick={() => removeExercise(ex.id)} className="text-navy/40 hover:text-red-600">
                ✕
              </button>
            </div>
          ))}
          <div className="flex gap-1 pt-1">
            <input
              className="input py-1 text-xs"
              placeholder="Ejercicio"
              value={newExercise}
              onChange={(e) => setNewExercise(e.target.value)}
            />
            <input
              className="input w-16 py-1 text-xs"
              placeholder="4x8"
              value={newSetsReps}
              onChange={(e) => setNewSetsReps(e.target.value)}
            />
            <button onClick={addExercise} className="btn-secondary px-2 text-xs">
              +
            </button>
          </div>
        </div>
      )}

      <textarea
        className="input mt-2 min-h-[60px] text-sm"
        placeholder="Comentario para el cliente..."
        value={comment}
        onChange={(e) => {
          setComment(e.target.value);
          setSaved(false);
        }}
      />

      <div className="mt-2 flex items-center gap-2">
        <button onClick={save} disabled={isPending} className="btn-primary w-full">
          {isPending ? 'Guardando...' : workoutId ? 'Guardar cambios' : 'Crear entreno'}
        </button>
      </div>
      {!workoutId && (
        <p className="mt-1 text-[11px] text-navy/40">Guarda primero para poder añadir ejercicios.</p>
      )}
      {saved && workoutId && <p className="mt-1 text-[11px] text-positive">Guardado</p>}
    </div>
  );
}
