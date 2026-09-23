import Link from 'next/link';
import { IconMessage } from '@/components/icons';
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

export function WorkoutDayCard({ workout }: { workout: WorkoutWithExercises | undefined }) {
  if (!workout) {
    return (
      <div className="card flex min-h-[140px] items-center justify-center p-4 text-center text-sm text-navy/40">
        Sin entreno asignado
      </div>
    );
  }

  const done = workout.status === 'done';

  return (
    <Link
      href={`/semana/entreno/${workout.id}`}
      className={`card flex min-h-[140px] flex-col p-4 active:scale-[0.99] ${
        done ? 'border-positive ring-1 ring-positive' : ''
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-navy/50">
        {workout.day_label}
      </div>
      <h3 className="mt-1 text-lg font-display normal-case tracking-normal">{workout.title}</h3>

      <p className="mt-1 text-xs text-navy/50">
        {workout.workout_exercises.length}{' '}
        {workout.workout_exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
      </p>

      <div className="mt-auto flex items-center justify-between pt-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className={`status-dot ${STATUS_DOT[workout.status]}`} />
          {STATUS_LABEL[workout.status]}
        </div>
        {workout.trainer_comment && <IconMessage className="h-4 w-4 text-navy/40" />}
      </div>

      <span className="mt-2 text-xs font-semibold text-accent">Ver entreno →</span>
    </Link>
  );
}
