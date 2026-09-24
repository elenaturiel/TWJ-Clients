'use client';

import { useState, useTransition } from 'react';
import {
  createTemplateAction,
  renameTemplateAction,
  deleteTemplateAction,
  addTemplateExerciseAction,
  updateTemplateExerciseMediaAction,
  removeTemplateExerciseAction,
} from '@/app/perfil/rutinas/actions';
import { InlineMediaField } from '@/components/panel/InlineMediaField';
import { LibraryExercisePicker } from '@/components/panel/LibraryExercisePicker';
import type { TemplateWithExercises } from '@/app/perfil/rutinas/data';
import type { RoutineTemplateExercise, ExerciseMedia } from '@/lib/types/database.types';

export function RoutineTemplatesManager({
  templates,
  media,
}: {
  templates: TemplateWithExercises[];
  media: ExerciseMedia[];
}) {
  const [items, setItems] = useState(templates);
  const [newTitle, setNewTitle] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const createTemplate = () => {
    if (!newTitle.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createTemplateAction(newTitle.trim());
      if (result.error || !result.templateId) {
        setError(result.error ?? 'No se ha podido crear la rutina.');
        return;
      }
      setItems((prev) => [
        {
          id: result.templateId!,
          trainer_id: '',
          title: newTitle.trim(),
          created_at: new Date().toISOString(),
          routine_template_exercises: [],
        },
        ...prev,
      ]);
      setNewTitle('');
    });
  };

  const deleteTemplate = (id: string) => {
    if (!confirm('¿Borrar esta rutina estándar? No afecta a los entrenos ya asignados a clientes.')) return;
    startTransition(async () => {
      const result = await deleteTemplateAction(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setItems((prev) => prev.filter((t) => t.id !== id));
    });
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-2 p-4 sm:flex-row">
        <input
          className="input"
          placeholder="Nombre de la rutina (ej: Espalda estándar)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button onClick={createTemplate} disabled={isPending} className="btn-primary shrink-0">
          + Nueva rutina
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 && (
        <p className="card p-4 text-sm text-navy/50">
          Todavía no tienes rutinas estándar. Crea la primera arriba.
        </p>
      )}

      {items.map((template) => (
        <TemplateCard key={template.id} template={template} media={media} onDelete={() => deleteTemplate(template.id)} />
      ))}
    </div>
  );
}

function TemplateCard({
  template,
  media,
  onDelete,
}: {
  template: TemplateWithExercises;
  media: ExerciseMedia[];
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(template.title);
  const [exercises, setExercises] = useState(
    [...template.routine_template_exercises].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [newExercise, setNewExercise] = useState('');
  const [newExerciseMediaId, setNewExerciseMediaId] = useState('');
  const [newSetsReps, setNewSetsReps] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const saveTitle = () => {
    if (title.trim() === template.title) return;
    startTransition(async () => {
      await renameTemplateAction(template.id, title.trim() || template.title);
    });
  };

  const pickFromLibrary = (item: ExerciseMedia) => {
    setNewExercise(item.title);
    setNewExerciseMediaId(item.id);
  };

  const addExercise = () => {
    if (!newExercise.trim()) return;
    const weight = newWeight ? Number(newWeight) : null;
    setError(null);
    startTransition(async () => {
      const result = await addTemplateExerciseAction(
        template.id,
        newExercise.trim(),
        newSetsReps.trim(),
        weight,
        newExerciseMediaId || null
      );
      if (result.error || !result.exercise) {
        setError(result.error ?? 'No se ha podido añadir el ejercicio.');
        return;
      }
      setExercises((prev) => [...prev, result.exercise as RoutineTemplateExercise]);
      setNewExercise('');
      setNewExerciseMediaId('');
      setNewSetsReps('');
      setNewWeight('');
    });
  };

  const removeExercise = (exerciseId: string) => {
    startTransition(async () => {
      const result = await removeTemplateExerciseAction(exerciseId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    });
  };

  const changeExerciseMedia = (exerciseId: string, mediaId: string) => {
    startTransition(async () => {
      const result = await updateTemplateExerciseMediaAction(exerciseId, mediaId || null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setExercises((prev) =>
        prev.map((e) => (e.id === exerciseId ? { ...e, media_id: mediaId || null } : e))
      );
    });
  };

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <input
          className="input flex-1 text-lg font-semibold"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
        />
        <button onClick={onDelete} className="text-xs font-semibold text-navy/40 hover:text-red-600">
          Borrar rutina
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        {exercises.map((ex) => (
          <div key={ex.id} className="rounded-card bg-bg px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span>
                {ex.name}
                {ex.sets_reps && <span className="text-navy/50"> · {ex.sets_reps}</span>}
                {ex.recommended_weight_kg != null && (
                  <span className="text-navy/50"> · {ex.recommended_weight_kg} kg</span>
                )}
              </span>
              <button onClick={() => removeExercise(ex.id)} className="text-navy/40 hover:text-red-600">
                ✕
              </button>
            </div>
            <InlineMediaField
              media={media}
              value={ex.media_id ?? ''}
              onChange={(value) => changeExerciseMedia(ex.id, value)}
            />
          </div>
        ))}
        {exercises.length === 0 && <p className="text-sm text-navy/40">Sin ejercicios todavía.</p>}
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
        <button onClick={addExercise} disabled={isPending} className="btn-secondary shrink-0">
          + Añadir
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
