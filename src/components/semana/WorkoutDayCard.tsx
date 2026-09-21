import { IconMessage } from '@/components/icons';
import { RatingSlider } from './RatingSlider';
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

export function WorkoutDayCard({ workout }: { workout: WorkoutWithExercises | undefined; }) {
  if (!workout) {
    return (
      <div className="card flex min-h-[220px] items-center justify-center p-4 text-sm text-navy/40">
        Sin entreno asignado
      </div>
    );
  }

  const exercises = [...workout.workout_exercises].sort((a, b) => a.sort_order - b.sort_order);
  const showRating = workout.status !== 'pending';

  return (
    <div className="card flex min-h-[220px] flex-col p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-navy/50">
        {workout.day_label}
      </div>
      <h3 className="mt-1 text-lg font-display normal-case tracking-normal">{workout.title}</h3>

      <ul className="mt-2 flex-1 space-y-1 text-sm text-navy/70">
        {exercises.map((ex) => (
          <li key={ex.id} className="flex justify-between gap-2">
            <span>{ex.name}</span>
            {ex.sets_reps && <span className="text-navy/50">{ex.sets_reps}</span>}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
        <span className={`status-dot ${STATUS_DOT[workout.status]}`} />
        {STATUS_LABEL[workout.status]}
      </div>

      {workout.trainer_comment && (
        <div className="mt-2 flex items-start gap-1.5 rounded-card bg-bg p-2 text-xs text-navy/70">
          <IconMessage className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{workout.trainer_comment}</span>
        </div>
      )}

      {showRating && <RatingSlider workoutId={workout.id} initialRating={workout.client_rating} />}
    </div>
  );
}
