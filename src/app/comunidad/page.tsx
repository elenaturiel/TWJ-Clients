import { requireProfile } from '@/lib/auth/get-profile';
import { getChallenges, getFeedPosts, getStreakRanking } from './data';
import { ClientAppShell } from '@/components/layout/ClientAppShell';
import { TrainerAppShell } from '@/components/layout/TrainerAppShell';
import { ChallengesColumn } from '@/components/comunidad/ChallengesColumn';
import { FeedColumn } from '@/components/comunidad/FeedColumn';
import { StreakRankingColumn } from '@/components/comunidad/StreakRankingColumn';

export default async function ComunidadPage() {
  const profile = await requireProfile();
  const [challenges, posts, ranking] = await Promise.all([
    getChallenges(),
    getFeedPosts(),
    getStreakRanking(),
  ]);

  const content = (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl">Comunidad</h1>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr_280px]">
        <ChallengesColumn challenges={challenges} currentUserId={profile.id} />
        <FeedColumn posts={posts} currentUserId={profile.id} isTrainer={profile.role === 'trainer'} />
        <StreakRankingColumn ranking={ranking} currentUserId={profile.id} />
      </div>
    </div>
  );

  if (profile.role === 'trainer') {
    return <TrainerAppShell fullName={profile.full_name}>{content}</TrainerAppShell>;
  }

  return <ClientAppShell fullName={profile.full_name}>{content}</ClientAppShell>;
}
