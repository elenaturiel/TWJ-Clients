import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/get-profile';
import { WorkoutEditorForm } from '@/components/panel/WorkoutEditorForm';
import { getRoutineTemplates } from '@/app/perfil/rutinas/data';
import { getExerciseMedia } from '@/app/perfil/ejercicios/data';
import { getClientExerciseSuggestions } from '@/app/panel/[clientId]/data';
import { dayLabelFull, weekOffsetFromToday } from '@/lib/utils/date';
import type { WorkoutWithExercises } from '@/app/panel/[clientId]/data';

export default async function WorkoutEditPage({
  params,
}: {
  params: { clientId: string; workoutId: string };
}) {
  const trainer = await requireProfile('trainer');
  const supabase = createClient();

  const [{ data: workout }, { data: client }, templates, suggestions, media] = await Promise.all([
    supabase
      .from('workouts')
      .select('*, workout_exercises(*)')
      .eq('id', params.workoutId)
      .eq('client_id', params.clientId)
      .maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', params.clientId).single(),
    getRoutineTemplates(trainer.id),
    getClientExerciseSuggestions(params.clientId),
    getExerciseMedia(trainer.id),
  ]);

  if (!workout) notFound();

  const typed = workout as WorkoutWithExercises;
  const date = new Date(typed.date + 'T00:00:00');
  const weekOffset = weekOffsetFromToday(typed.date);

  return (
    <div>
      <Link
        href={`/panel/${params.clientId}?tab=entrenos&week=${weekOffset}`}
        className="text-sm font-semibold text-accent"
      >
        ← Volver a los entrenos de {client?.full_name ?? 'este cliente'}
      </Link>
      <h1 className="mb-4 mt-2 text-2xl">
        {dayLabelFull(date)}, {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
      </h1>

      <div className="max-w-2xl">
        <WorkoutEditorForm
          clientId={params.clientId}
          date={typed.date}
          dayLabel={typed.day_label}
          workout={typed}
          templates={templates}
          suggestions={suggestions}
          media={media}
        />
      </div>
    </div>
  );
}
