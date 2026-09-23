'use client';

import { useState } from 'react';
import { uploadExerciseMedia } from '@/lib/utils/upload-exercise-media';
import { MUSCLE_GROUP_OPTIONS } from '@/lib/constants/muscle-groups';
import type { ExerciseMedia, MuscleGroup } from '@/lib/types/database.types';

export function InlineMediaField({
  media,
  value,
  onChange,
  onMediaCreated,
  exerciseName,
  disabled,
}: {
  media: ExerciseMedia[];
  value: string;
  onChange: (mediaId: string) => void;
  onMediaCreated: (media: ExerciseMedia) => void;
  exerciseName: string;
  disabled?: boolean;
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState(exerciseName);
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('otro');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMedia = media.find((m) => m.id === value);

  const groups = MUSCLE_GROUP_OPTIONS.map((g) => ({
    ...g,
    items: media.filter((m) => m.muscle_group === g.value),
  })).filter((g) => g.items.length > 0);

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
    onMediaCreated(result.media);
    onChange(result.media.id);
    setShowUpload(false);
    setFile(null);
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="input w-auto py-1 text-xs"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Sin vídeo/foto</option>
          {groups.map((group) => (
            <optgroup key={group.value} label={group.label}>
              {group.items.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedMedia && (
          <a href={selectedMedia.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accent">
            Ver →
          </a>
        )}
        <button
          type="button"
          onClick={() => setShowUpload((v) => !v)}
          className="text-xs font-semibold text-navy/50 hover:text-accent"
        >
          {showUpload ? 'Cancelar' : '+ Subir nuevo'}
        </button>
      </div>

      {showUpload && (
        <form onSubmit={upload} className="flex flex-col gap-2 rounded-card border border-line p-2 sm:flex-row sm:items-center">
          <input
            className="input py-1 text-xs sm:flex-1"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="input w-auto py-1 text-xs"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
          >
            {MUSCLE_GROUP_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="video/*,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs"
          />
          <button type="submit" disabled={isUploading} className="btn-secondary shrink-0 py-1 text-xs">
            {isUploading ? 'Subiendo...' : 'Subir y adjuntar'}
          </button>
        </form>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
