import Link from 'next/link';
import { requireProfile } from '@/lib/auth/get-profile';
import { TrainerAppShell } from '@/components/layout/TrainerAppShell';
import { getExerciseMedia } from './data';
import { ExerciseMediaManager } from '@/components/perfil/ExerciseMediaManager';

export default async function EjerciciosMediaPage() {
  const profile = await requireProfile('trainer');
  const media = await getExerciseMedia(profile.id);

  return (
    <TrainerAppShell fullName={profile.full_name}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link href="/perfil" className="text-sm font-semibold text-accent">
          ← Volver a tu perfil
        </Link>
        <h1 className="mb-1 mt-2 text-3xl">Vídeos y fotos de ejercicios</h1>
        <p className="mb-6 text-sm text-navy/60">
          Sube una vez la demostración de cada ejercicio y adjúntala luego desde cualquier
          rutina o entreno de cualquier cliente, en la edición de cada ejercicio.
        </p>
        <ExerciseMediaManager media={media} />
      </div>
    </TrainerAppShell>
  );
}
