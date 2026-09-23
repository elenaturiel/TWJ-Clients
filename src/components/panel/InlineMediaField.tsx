'use client';

import { useState } from 'react';
import { MUSCLE_GROUP_OPTIONS } from '@/lib/constants/muscle-groups';
import type { ExerciseMedia, MuscleGroup } from '@/lib/types/database.types';

export function InlineMediaField({
  media,
  value,
  onChange,
  disabled,
}: {
  media: ExerciseMedia[];
  value: string;
  onChange: (mediaId: string) => void;
  disabled?: boolean;
}) {
  const selected = media.find((m) => m.id === value);
  const [groupFilter, setGroupFilter] = useState<MuscleGroup | ''>(selected?.muscle_group ?? '');

  const availableGroups = MUSCLE_GROUP_OPTIONS.filter((g) =>
    media.some((m) => m.muscle_group === g.value)
  );
  const visibleMedia = groupFilter ? media.filter((m) => m.muscle_group === groupFilter) : media;

  const changeGroup = (group: MuscleGroup | '') => {
    setGroupFilter(group);
    if (value && !media.some((m) => m.id === value && (group === '' || m.muscle_group === group))) {
      onChange('');
    }
  };

  if (media.length === 0) {
    return (
      <p className="mt-2 text-xs text-navy/40">
        Todavía no hay vídeos/fotos en tu biblioteca. Súbelos desde tu perfil.
      </p>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <select
        className="input w-auto py-1 text-xs"
        value={groupFilter}
        onChange={(e) => changeGroup(e.target.value as MuscleGroup | '')}
        disabled={disabled}
      >
        <option value="">Todas las carpetas</option>
        {availableGroups.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </select>
      <select
        className="input w-auto py-1 text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Sin vídeo/foto</option>
        {visibleMedia.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </select>
      {selected && (
        <a href={selected.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accent">
          Ver →
        </a>
      )}
    </div>
  );
}
