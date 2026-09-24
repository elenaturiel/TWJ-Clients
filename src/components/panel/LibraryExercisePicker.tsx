'use client';

import { useState } from 'react';
import { MUSCLE_GROUP_OPTIONS } from '@/lib/constants/muscle-groups';
import type { ExerciseMedia, MuscleGroup } from '@/lib/types/database.types';

export function LibraryExercisePicker({
  media,
  onPick,
}: {
  media: ExerciseMedia[];
  onPick: (item: ExerciseMedia) => void;
}) {
  const [groupFilter, setGroupFilter] = useState<MuscleGroup | ''>('');
  const [selected, setSelected] = useState('');

  if (media.length === 0) return null;

  const availableGroups = MUSCLE_GROUP_OPTIONS.filter((g) =>
    media.some((m) => m.muscle_group === g.value)
  );
  const visibleMedia = groupFilter ? media.filter((m) => m.muscle_group === groupFilter) : media;

  const pick = (id: string) => {
    const item = media.find((m) => m.id === id);
    setSelected('');
    if (item) onPick(item);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-navy/50">O elige de tu biblioteca:</span>
      <select
        className="input w-auto py-1 text-xs"
        value={groupFilter}
        onChange={(e) => {
          setGroupFilter(e.target.value as MuscleGroup | '');
          setSelected('');
        }}
      >
        <option value="">Todas las carpetas</option>
        {availableGroups.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </select>
      <select className="input w-auto py-1 text-xs" value={selected} onChange={(e) => pick(e.target.value)}>
        <option value="">Elegir ejercicio...</option>
        {visibleMedia.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </select>
    </div>
  );
}
