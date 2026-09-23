import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/get-profile';
import { WorkoutEditorForm } from '@/components/panel/WorkoutEditorForm';
import { getRoutineTemplates } from '@/app/perfil/rutinas/data';
import { getClientExerciseSuggestions } from '@/app/panel/[clientId]/data';
import { dayLabelFull } from '@/lib/utils/date';
import type { WorkoutWithExercises } from '@/app/panel/[clientId]/data';

export default async function WorkoutEditPage({
  params,
}: {
  params: { clientId: string; workoutId: string };
}) {
  const trainer = await requireProfile('trainer');
  const supabase = createClient();

  const [{ data: workout }, { data: client }, templates, suggestions] = await Promise.all([
    supabase
      .from('workouts')
      .select('*, workout_exercises(*)')
      .eq('id', params.workoutId)
      .eq('client_id', params.clientId)
      .maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', params.clientId).single(),
    getRoutineTemplates(trainer.id),
    getClientExerciseSuggestions(params.clientId),
  ]);

  if (!workout) notFound();

  const typed = workout as WorkoutWithExercises;
  const date = new Date(typed.date + 'T00:00:00');

  return (
    <div>
      <Link href={`/panel/${params.clientId}?tab=entrenos`} className="text-sm font-semibold text-accent">
        ← Volver a los entrenos de {client?.full_name ?? 'este cliente'}
      </Link>
      <h1 className="mb-4 mt-2 text-2xl">{dayLabelFull(date)}</h1>

      <div className="max-w-2xl">
        <WorkoutEditorForm
          clientId={params.clientId}
          date={typed.date}
          dayLabel={typed.day_label}
          workout={typed}
          templates={templates}
          suggestions={suggestions}
        />
      </div>
    </div>
  );
}
