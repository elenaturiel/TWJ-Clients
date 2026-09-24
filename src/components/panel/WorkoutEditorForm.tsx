'use client';

import { useState, useTransition } from 'react';
import {
  upsertWorkoutAction,
  addExerciseAction,
  updateExerciseAction,
  updateExerciseMediaAction,
  removeExerciseAction,
  applyTemplateToWorkoutAction,
} from '@/app/panel/[clientId]/actions';
import { InlineMediaField } from './InlineMediaField';
import { LibraryExercisePicker } from './LibraryExercisePicker';
import type { WorkoutStatus, WorkoutExercise, ExerciseMedia } from '@/lib/types/database.types';
import type { WorkoutWithExercises, ExerciseSuggestion } from '@/app/panel/[clientId]/data';
import type { TemplateWithExercises } from '@/app/perfil/rutinas/data';

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
  templates,
  suggestions,
  media,
}: {
  clientId: string;
  date: string;
  dayLabel: string;
  workout: WorkoutWithExercises;
  templates: TemplateWithExercises[];
  suggestions: Record<string, ExerciseSuggestion>;
  media: ExerciseMedia[];
}) {
  const [title, setTitle] = useState(workout.title);
  const [status, setStatus] = useState<WorkoutStatus>(workout.status);
  const [comment, setComment] = useState(workout.trainer_comment ?? '');
  const [exercises, setExercises] = useState(
    [...workout.workout_exercises].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [newExercise, setNewExercise] = useState('');
  const [newExerciseMediaId, setNewExerciseMediaId] = useState('');
  const [newSetsReps, setNewSetsReps] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isApplyingTemplate, startApplyTemplate] = useTransition();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);
  const [exerciseError, setExerciseError] = useState<string | null>(null);

  const applyTemplate = () => {
    if (!selectedTemplate) return;
    setExerciseError(null);
    startApplyTemplate(async () => {
      const result = await applyTemplateToWorkoutAction(selectedTemplate, workout.id, clientId);
      if (result.error || !result.exercises) {
        setExerciseError(result.error ?? 'No se ha podido aplicar la rutina.');
        return;
      }
      setExercises((prev) => [...prev, ...(result.exercises as WorkoutExercise[])]);
      setSelectedTemplate('');
    });
  };

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

  const applySuggestionToNewExercise = (name: string) => {
    const suggestion = suggestions[name.trim().toLowerCase()];
    if (!suggestion) return;
    if (!newSetsReps && suggestion.setsReps) setNewSetsReps(suggestion.setsReps);
    if (!newWeight && suggestion.weightKg != null) setNewWeight(String(suggestion.weightKg));
  };

  const pickFromLibrary = (item: ExerciseMedia) => {
    setNewExercise(item.title);
    setNewExerciseMediaId(item.id);
    applySuggestionToNewExercise(item.title);
  };

  const addExercise = () => {
    if (!newExercise.trim()) return;
    const weight = newWeight ? Number(newWeight) : null;
    setExerciseError(null);
    startTransition(async () => {
      const result = await addExerciseAction(
        workout.id,
        clientId,
        newExercise.trim(),
        newSetsReps.trim(),
        weight,
        newExerciseMediaId || null
      );
      if (result.error || !result.exercise) {
        setExerciseError(result.error ?? 'No se ha podido añadir el ejercicio.');
        return;
      }
      setExercises((prev) => [...prev, result.exercise as WorkoutExercise]);
      setNewExercise('');
      setNewExerciseMediaId('');
      setNewSetsReps('');
      setNewWeight('');
    });
  };

  const removeExercise = (exerciseId: string) => {
    startTransition(async () => {
      const result = await removeExerciseAction(exerciseId, clientId);
      if (result.error) {
        setExerciseError(result.error);
        return;
      }
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    });
  };

  const updateExercise = (updated: WorkoutExercise) => {
    setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">{dayLabel}</span>
        {workout.client_rating != null && (
          <span className="rounded-card bg-bg px-2.5 py-1 text-xs font-semibold text-navy/70">
            Cómo se sintió: {workout.client_rating}/10
          </span>
        )}
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
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-navy/50">Ejercicios</h3>
          {templates.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                className="input w-auto py-1 text-xs"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="">Aplicar rutina estándar...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <button
                onClick={applyTemplate}
                disabled={!selectedTemplate || isApplyingTemplate}
                className="btn-secondary py-1 text-xs"
              >
                {isApplyingTemplate ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {exercises.map((ex) => (
            <ExerciseEditRow
              key={ex.id}
              exercise={ex}
              clientId={clientId}
              media={media}
              onUpdated={updateExercise}
              onRemove={() => removeExercise(ex.id)}
            />
          ))}
          {exercises.length === 0 && (
            <p className="text-sm text-navy/40">Todavía no hay ejercicios.</p>
          )}
        </div>
        {media.length > 0 && (
          <div className="mt-2">
            <LibraryExercisePicker media={media} onPick={pickFromLibrary} />
          </div>
        )}
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className="input"
            placeholder="Nombre del ejercicio"
            value={newExercise}
            onChange={(e) => {
              setNewExercise(e.target.value);
              setNewExerciseMediaId('');
            }}
            onBlur={(e) => applySuggestionToNewExercise(e.target.value)}
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
        {exerciseError && <p className="mt-1 text-xs text-red-600">{exerciseError}</p>}
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
        <button onClick={save} disabled={isPending} className="btn-primary">
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && !isPending && <span className="text-sm text-positive">Guardado</span>}
      </div>
    </div>
  );
}

function ExerciseEditRow({
  exercise,
  clientId,
  media,
  onUpdated,
  onRemove,
}: {
  exercise: WorkoutExercise;
  clientId: string;
  media: ExerciseMedia[];
  onUpdated: (updated: WorkoutExercise) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(exercise.name);
  const [setsReps, setSetsReps] = useState(exercise.sets_reps ?? '');
  const [weight, setWeight] = useState(
    exercise.recommended_weight_kg != null ? String(exercise.recommended_weight_kg) : ''
  );
  const [mediaId, setMediaId] = useState(exercise.media_id ?? '');
  const [isSavingMedia, startSavingMedia] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const changeMedia = (value: string) => {
    setMediaId(value);
    startSavingMedia(async () => {
      const result = await updateExerciseMediaAction(exercise.id, clientId, value || null);
      if (!result.error) onUpdated({ ...exercise, media_id: value || null });
    });
  };

  const save = () => {
    if (!name.trim()) return;
    setError(null);
    const weightValue = weight ? Number(weight.replace(',', '.')) : null;
    startTransition(async () => {
      const result = await updateExerciseAction(exercise.id, clientId, name.trim(), setsReps.trim(), weightValue);
      if (result.error) {
        setError(result.error);
        return;
      }
      onUpdated({ ...exercise, name: name.trim(), sets_reps: setsReps.trim() || null, recommended_weight_kg: weightValue });
      setDirty(false);
    });
  };

  return (
    <div className="rounded-card bg-bg px-3 py-2 text-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="input py-1 text-sm sm:flex-1"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDirty(true);
          }}
        />
        <input
          className="input py-1 text-sm sm:w-28"
          placeholder="4x8"
          value={setsReps}
          onChange={(e) => {
            setSetsReps(e.target.value);
            setDirty(true);
          }}
        />
        <input
          className="input py-1 text-sm sm:w-24"
          placeholder="Peso kg"
          inputMode="decimal"
          value={weight}
          onChange={(e) => {
            setWeight(e.target.value);
            setDirty(true);
          }}
        />
        <div className="flex items-center gap-2">
          {dirty && (
            <button onClick={save} disabled={isPending} className="btn-secondary py-1 text-xs">
              {isPending ? '...' : 'Guardar'}
            </button>
          )}
          <button onClick={onRemove} className="text-navy/40 hover:text-red-600">
            ✕
          </button>
        </div>
      </div>
      {(exercise.actual_sets_reps || exercise.actual_weight_kg != null) && (
        <p className="mt-1 text-xs font-semibold text-navy/60">
          Real: {exercise.actual_sets_reps || '—'}
          {exercise.actual_weight_kg != null ? ` · ${exercise.actual_weight_kg} kg` : ''}
        </p>
      )}
      <InlineMediaField media={media} value={mediaId} onChange={changeMedia} disabled={isSavingMedia} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
