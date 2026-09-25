import Link from 'next/link';
import { requireProfile } from '@/lib/auth/get-profile';
import { ClientAppShell } from '@/components/layout/ClientAppShell';
import { TrainerAppShell } from '@/components/layout/TrainerAppShell';
import { AjustesForm } from '@/components/perfil/AjustesForm';

export default async function AjustesPage() {
  const profile = await requireProfile();

  const content = (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/perfil" className="text-sm font-semibold text-accent">
        ← Volver a tu perfil
      </Link>
      <h1 className="mb-1 mt-2 text-3xl">Ajustes</h1>
      <p className="mb-6 text-sm text-navy/60">
        Decide cómo quieres que te avisemos de un entreno o menú nuevo, o de un comentario.
      </p>

      <AjustesForm
        email={profile.email}
        initialEmailEnabled={profile.email_notifications_enabled}
        initialPushEnabled={profile.push_notifications_enabled}
      />
    </div>
  );

  if (profile.role === 'trainer') {
    return <TrainerAppShell fullName={profile.full_name}>{content}</TrainerAppShell>;
  }

  return <ClientAppShell fullName={profile.full_name}>{content}</ClientAppShell>;
}
