import type { MuscleGroup } from '@/lib/types/database.types';

export const MUSCLE_GROUP_OPTIONS: { value: MuscleGroup; label: string }[] = [
  { value: 'pecho', label: 'Pecho' },
  { value: 'espalda', label: 'Espalda' },
  { value: 'piernas', label: 'Piernas' },
  { value: 'hombros', label: 'Hombros' },
  { value: 'brazos', label: 'Brazos' },
  { value: 'core', label: 'Core' },
  { value: 'gluteos', label: 'Glúteos' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'movilidad', label: 'Movilidad' },
  { value: 'otro', label: 'Otro' },
];

export const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = Object.fromEntries(
  MUSCLE_GROUP_OPTIONS.map((o) => [o.value, o.label])
) as Record<MuscleGroup, string>;
