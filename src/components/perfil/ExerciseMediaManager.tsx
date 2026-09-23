'use client';

import Image from 'next/image';
import { useState } from 'react';
import { deleteExerciseMediaAction } from '@/app/perfil/ejercicios/actions';
import { uploadExerciseMedia } from '@/lib/utils/upload-exercise-media';
import { MUSCLE_GROUP_OPTIONS } from '@/lib/constants/muscle-groups';
import type { ExerciseMedia, MuscleGroup } from '@/lib/types/database.types';

export function ExerciseMediaManager({ media }: { media: ExerciseMedia[] }) {
  const [items, setItems] = useState(media);
  const [title, setTitle] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('otro');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      setError('Ponle un título y elige un archivo.');
      return;
    }

    setIsUploading(true);
    setError(null);
    const result = await uploadExerciseMedia(title.trim(), muscleGroup, file);
    setIsUploading(false);
    if (result.error || !result.media) {
      setError(result.error ?? 'No se ha podido guardar.');
      return;
    }

    setItems((prev) => [result.media as ExerciseMedia, ...prev]);
    setTitle('');
    setMuscleGroup('otro');
    setFile(null);
    (e.target as HTMLFormElement).reset();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Borrar este vídeo/foto? Los ejercicios que lo tengan adjunto se quedarán sin él.')) return;
    const result = await deleteExerciseMediaAction(id);
    if (result.error) {
      setError(result.error);
      return;
    }
    setItems((prev) => prev.filter((m) => m.id !== id));
  };

  const groups = MUSCLE_GROUP_OPTIONS.map((g) => ({
    ...g,
    items: items.filter((m) => m.muscle_group === g.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <form onSubmit={upload} className="card space-y-3 p-4">
        <div>
          <label className="mb-1 block text-sm font-semibold">Título</label>
          <input
            className="input"
            placeholder="Ej: Sentadilla — técnica"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Grupo muscular</label>
          <select
            className="input"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
          >
            {MUSCLE_GROUP_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Vídeo o foto</label>
          <input
            type="file"
            accept="video/*,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isUploading} className="btn-primary">
          {isUploading ? 'Subiendo...' : '+ Subir'}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="card p-4 text-sm text-navy/50">
          Todavía no has subido ningún vídeo o foto explicativa.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.value}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy/50">
                {group.label}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((m) => (
                  <div key={m.id} className="card overflow-hidden p-3">
                    {m.media_type === 'video' ? (
                      <video src={m.url} controls className="aspect-video w-full rounded-card bg-bg object-cover" />
                    ) : (
                      <div className="relative aspect-video w-full overflow-hidden rounded-card bg-bg">
                        <Image src={m.url} alt={m.title} fill className="object-cover" />
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{m.title}</p>
                      <button onClick={() => remove(m.id)} className="shrink-0 text-xs text-navy/40 hover:text-red-600">
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
