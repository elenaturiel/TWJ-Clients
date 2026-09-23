import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/auth/get-profile';
import { createClient } from '@/lib/supabase/server';
import { ClientAppShell } from '@/components/layout/ClientAppShell';
import { RatingSlider } from '@/components/semana/RatingSlider';
import { WorkoutCompletionToggle } from '@/components/semana/WorkoutCompletionToggle';
import { ExerciseActualsList } from '@/components/semana/ExerciseActualsList';
import { IconMessage } from '@/components/icons';
import { dayLabelFull } from '@/lib/utils/date';
import type { WorkoutWithExercises } from '@/app/semana/data';

const STATUS_LABEL: Record<string, string> = {
  done: 'Hecho',
  today: 'Hoy',
  pending: 'Pendiente',
};

export default async function WorkoutDetailPage({ params }: { params: { workoutId: string } }) {
  const profile = await requireProfile('client');
  const supabase = createClient();

  const { data: workout } = await supabase
    .from('workouts')
    .select('*, workout_exercises(*)')
    .eq('id', params.workoutId)
    .eq('client_id', profile.id)
    .maybeSingle();

  if (!workout) notFound();

  const typed = workout as WorkoutWithExercises;
  const exercises = [...typed.workout_exercises].sort((a, b) => a.sort_order - b.sort_order);
  const done = typed.status === 'done';
  const date = new Date(typed.date + 'T00:00:00');

  return (
    <ClientAppShell fullName={profile.full_name}>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/semana" className="text-sm font-semibold text-accent">
          ← Volver a tu semana
        </Link>

        <div
          className={`card mt-4 p-5 transition-colors sm:p-6 ${
            done ? 'border-positive ring-1 ring-positive' : ''
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
                {dayLabelFull(date)}
              </p>
              <h1 className="mt-1 text-3xl">{typed.title}</h1>
              {!done && (
                <p className="mt-1 text-xs font-semibold text-navy/50">
                  {STATUS_LABEL[typed.status]}
                </p>
              )}
            </div>
            <WorkoutCompletionToggle workoutId={typed.id} date={typed.date} initialDone={done} />
          </div>

          <div className="mt-5">
            <ExerciseActualsList exercises={exercises} />
          </div>

          {typed.trainer_comment && (
            <div className="mt-5 flex items-start gap-2 rounded-card bg-bg p-3 text-sm text-navy/70">
              <IconMessage className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{typed.trainer_comment}</span>
            </div>
          )}

          <div className="mt-6 border-t border-line pt-5">
            <RatingSlider workoutId={typed.id} initialRating={typed.client_rating} />
          </div>
        </div>
      </div>
    </ClientAppShell>
  );
}
