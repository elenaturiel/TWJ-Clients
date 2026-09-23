import Link from 'next/link';
import { IconMessage } from '@/components/icons';
import { CreateWorkoutQuickForm } from './CreateWorkoutQuickForm';
import type { WorkoutWithExercises } from '@/app/panel/[clientId]/data';

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

export function EntrenosTab({
  clientId,
  days,
}: {
  clientId: string;
  days: { iso: string; label: string; workout: WorkoutWithExercises | undefined }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {days.map((d) =>
        d.workout ? (
          <Link
            key={d.iso}
            href={`/panel/${clientId}/entrenos/${d.workout.id}`}
            className={`card flex min-h-[140px] flex-col p-4 active:scale-[0.99] ${
              d.workout.status === 'done' ? 'border-positive ring-1 ring-positive' : ''
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">
              {d.label}
            </span>
            <h3 className="mt-1 font-display text-base normal-case tracking-normal">
              {d.workout.title}
            </h3>
            <p className="mt-1 text-xs text-navy/50">
              {d.workout.workout_exercises.length}{' '}
              {d.workout.workout_exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
            </p>
            <div className="mt-auto flex items-center justify-between pt-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className={`status-dot ${STATUS_DOT[d.workout.status]}`} />
                {STATUS_LABEL[d.workout.status]}
              </div>
              <div className="flex items-center gap-1.5">
                {d.workout.client_rating != null && (
                  <span className="text-xs font-semibold text-navy/60">
                    {d.workout.client_rating}/10
                  </span>
                )}
                {d.workout.trainer_comment && <IconMessage className="h-4 w-4 text-navy/40" />}
              </div>
            </div>
            <span className="mt-2 text-xs font-semibold text-accent">Editar →</span>
          </Link>
        ) : (
          <CreateWorkoutQuickForm key={d.iso} clientId={clientId} date={d.iso} dayLabel={d.label} />
        )
      )}
    </div>
  );
}
