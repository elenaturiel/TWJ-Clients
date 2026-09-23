import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/auth/get-profile';
import { createClient } from '@/lib/supabase/server';
import { ClientAppShell } from '@/components/layout/ClientAppShell';
import { RatingSlider } from '@/components/semana/RatingSlider';
import { IconMessage } from '@/components/icons';
import { dayLabelFull } from '@/lib/utils/date';
import type { WorkoutWithExercises } from '@/app/semana/data';

const STATUS_LABEL: Record<string, string> = {
  done: 'Hecho',
  today: 'Hoy',
  pending: 'Pendiente',
};

const STATUS_DOT: Record<string, string> = {
  done: 'bg-positive',
  today: 'bg-amber',
  pending: 'bg-navy/25',
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
  const showRating = typed.status !== 'pending';
  const date = new Date(typed.date + 'T00:00:00');

  return (
    <ClientAppShell fullName={profile.full_name}>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/semana" className="text-sm font-semibold text-accent">
          ← Volver a tu semana
        </Link>

        <div className="card mt-4 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
            {dayLabelFull(date)}
          </p>
          <h1 className="mt-1 text-3xl">{typed.title}</h1>

          <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <span className={`status-dot ${STATUS_DOT[typed.status]}`} />
            {STATUS_LABEL[typed.status]}
          </div>

          <ul className="mt-5 divide-y divide-line">
            {exercises.length === 0 && (
              <li className="py-3 text-sm text-navy/40">Todavía no hay ejercicios en este entreno.</li>
            )}
            {exercises.map((ex) => (
              <li key={ex.id} className="flex items-center justify-between py-3 text-sm">
                <span>{ex.name}</span>
                {ex.sets_reps && <span className="font-semibold text-navy/60">{ex.sets_reps}</span>}
              </li>
            ))}
          </ul>

          {typed.trainer_comment && (
            <div className="mt-5 flex items-start gap-2 rounded-card bg-bg p-3 text-sm text-navy/70">
              <IconMessage className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{typed.trainer_comment}</span>
            </div>
          )}

          {showRating && (
            <div className="mt-6 border-t border-line pt-5">
              <RatingSlider workoutId={typed.id} initialRating={typed.client_rating} />
            </div>
          )}
        </div>
      </div>
    </ClientAppShell>
  );
}
