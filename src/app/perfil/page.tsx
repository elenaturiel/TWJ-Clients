import Image from 'next/image';
import Link from 'next/link';
import { requireProfile } from '@/lib/auth/get-profile';
import { createClient } from '@/lib/supabase/server';
import { ClientAppShell } from '@/components/layout/ClientAppShell';
import { TrainerAppShell } from '@/components/layout/TrainerAppShell';
import { AvatarUploader } from '@/components/perfil/AvatarUploader';
import { IconMedal } from '@/components/icons';
import type { Challenge, ChallengeParticipant } from '@/lib/types/database.types';

const PLAN_LABEL: Record<string, string> = { rookie: 'Rookie', all_in: 'All In', peak: 'Peak' };

export default async function PerfilPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: badges } = await supabase
    .from('challenge_participants')
    .select('*, challenges(*)')
    .eq('client_id', profile.id)
    .eq('completed', true);

  const content = (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="card flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
        <AvatarUploader userId={profile.id} fullName={profile.full_name} avatarUrl={profile.avatar_url} />
        <div className="text-center sm:text-left">
          <h1 className="text-2xl">{profile.full_name}</h1>
          <p className="text-sm text-navy/60">
            {profile.plan ? PLAN_LABEL[profile.plan] : 'Sin plan'}
            {profile.role === 'client' && profile.client_since ? ` · Cliente desde ${profile.client_since}` : ''}
          </p>
        </div>
      </div>

      {profile.role === 'trainer' && (
        <section className="mt-6">
          <Link href="/perfil/rutinas" className="card flex items-center justify-between p-4 hover:border-accent">
            <div>
              <h2 className="text-lg font-display normal-case tracking-normal">Rutinas estándar</h2>
              <p className="text-sm text-navy/60">
                Crea rutinas reutilizables y aplícalas a cualquier cliente en un clic.
              </p>
            </div>
            <span className="text-sm font-semibold text-accent">Gestionar →</span>
          </Link>
        </section>
      )}

      {profile.role === 'client' && (
        <section className="mt-6">
          <h2 className="mb-3 text-xl">Medallas</h2>
          {!badges || badges.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 p-8 text-center text-navy/60">
              <IconMedal className="h-10 w-10 text-navy/30" />
              <p className="font-semibold">Tu primera medalla te está esperando</p>
              <p className="text-sm">Apúntate a un reto en Comunidad y bórdalo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {(badges as (ChallengeParticipant & { challenges: Challenge })[]).map((b) => (
                <div key={b.id} className="card flex flex-col items-center gap-2 p-4 text-center">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image
                      src={b.challenges.badge_image_url}
                      alt={b.challenges.badge_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-sm font-semibold">{b.challenges.badge_name}</p>
                  <p className="text-xs text-navy/50">{b.challenges.title}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );

  if (profile.role === 'trainer') {
    return <TrainerAppShell fullName={profile.full_name}>{content}</TrainerAppShell>;
  }

  return <ClientAppShell fullName={profile.full_name}>{content}</ClientAppShell>;
}
