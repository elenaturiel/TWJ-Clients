'use client';

import Image from 'next/image';
import { useState } from 'react';
import { deleteExerciseMediaAction } from '@/app/perfil/ejercicios/actions';
import { uploadExerciseMedia } from '@/lib/utils/upload-exercise-media';
import { MUSCLE_GROUP_OPTIONS } from '@/lib/constants/muscle-groups';
import type { ExerciseMedia, MuscleGroup } from '@/lib/types/database.types';

function titleFromFileName(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

export function ExerciseMediaManager({ media }: { media: ExerciseMedia[] }) {
  const [items, setItems] = useState(media);
  const [title, setTitle] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('otro');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isBatch = files.length > 1;

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Elige al menos un archivo.');
      return;
    }
    if (!isBatch && !title.trim()) {
      setError('Ponle un título.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress({ done: 0, total: files.length });

    const uploaded: ExerciseMedia[] = [];
    for (const file of files) {
      const fileTitle = isBatch ? titleFromFileName(file.name) : title.trim();
      const result = await uploadExerciseMedia(fileTitle, muscleGroup, file);
      if (result.error || !result.media) {
        setError(result.error ?? 'No se ha podido guardar ' + file.name + '.');
        break;
      }
      uploaded.push(result.media);
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }

    setIsUploading(false);
    setProgress(null);
    if (uploaded.length > 0) setItems((prev) => [...uploaded, ...prev]);
    if (uploaded.length === files.length) {
      setTitle('');
      setMuscleGroup('otro');
      setFiles([]);
      (e.target as HTMLFormElement).reset();
    }
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
          <label className="mb-1 block text-sm font-semibold">Vídeos o fotos</label>
          <input
            type="file"
            accept="video/*,image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="text-sm"
          />
          {files.length > 0 && (
            <p className="mt-1 text-xs text-navy/50">
              {files.length} {files.length === 1 ? 'archivo elegido' : 'archivos elegidos'}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Título{isBatch && <span className="font-normal text-navy/40"> (se usará el nombre de cada archivo)</span>}
          </label>
          <input
            className="input"
            placeholder="Ej: Sentadilla — técnica"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isBatch}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Grupo muscular{isBatch && <span className="font-normal text-navy/40"> (para todos los archivos)</span>}
          </label>
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isUploading} className="btn-primary">
          {isUploading
            ? progress
              ? `Subiendo ${progress.done + 1}/${progress.total}...`
              : 'Subiendo...'
            : `+ Subir${files.length > 1 ? ` (${files.length})` : ''}`}
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
                      <video
                        src={m.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="aspect-video w-full rounded-card bg-bg object-cover"
                      />
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
