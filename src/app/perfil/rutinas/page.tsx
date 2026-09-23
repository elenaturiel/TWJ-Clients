import Link from 'next/link';
import { requireProfile } from '@/lib/auth/get-profile';
import { TrainerAppShell } from '@/components/layout/TrainerAppShell';
import { getRoutineTemplates } from './data';
import { RoutineTemplatesManager } from '@/components/perfil/RoutineTemplatesManager';

export default async function RutinasPage() {
  const profile = await requireProfile('trainer');
  const templates = await getRoutineTemplates(profile.id);

  return (
    <TrainerAppShell fullName={profile.full_name}>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/perfil" className="text-sm font-semibold text-accent">
          ← Volver a tu perfil
        </Link>
        <h1 className="mb-1 mt-2 text-3xl">Rutinas estándar</h1>
        <p className="mb-6 text-sm text-navy/60">
          Créalas una vez y aplícalas a cualquier cliente en un clic desde el editor de su
          entreno. Cada cliente guarda luego su propia copia editable, independiente de la
          plantilla.
        </p>
        <RoutineTemplatesManager templates={templates} />
      </div>
    </TrainerAppShell>
  );
}
