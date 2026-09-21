import { createClient } from '@/lib/supabase/server';
import { toISODate, addDays } from '@/lib/utils/date';
import type {
  Challenge,
  ChallengeParticipant,
  CommunityPost,
  PostComment,
  PostLike,
  Profile,
} from '@/lib/types/database.types';

export type ChallengeWithParticipants = Challenge & {
  challenge_participants: (ChallengeParticipant & { profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null })[];
};

export type PostWithDetails = CommunityPost & {
  author: Pick<Profile, 'full_name' | 'avatar_url'> | null;
  comments: (PostComment & { author: Pick<Profile, 'full_name'> | null })[];
  likes: PostLike[];
};

export interface StreakRanking {
  profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  streakDays: number;
  cheerCount: number;
}

export async function getChallenges(): Promise<ChallengeWithParticipants[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('challenges')
    .select('*, challenge_participants(*, profiles(id, full_name, avatar_url))')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (data as ChallengeWithParticipants[] | null) ?? [];
}

export async function getFeedPosts(): Promise<PostWithDetails[]> {
  const supabase = createClient();
  const { data: rawPosts } = await supabase
    .from('community_posts')
    .select('*, author:profiles!community_posts_author_id_fkey(full_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(20);

  const posts = (rawPosts as (CommunityPost & { author: Pick<Profile, 'full_name' | 'avatar_url'> | null })[] | null) ?? [];
  if (posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);

  const [{ data: rawComments }, { data: likes }] = await Promise.all([
    supabase
      .from('post_comments')
      .select('*, author:profiles(full_name)')
      .in('post_id', postIds)
      .order('created_at', { ascending: true }),
    supabase.from('post_likes').select('*').in('post_id', postIds),
  ]);

  const comments = (rawComments as (PostComment & { author: Pick<Profile, 'full_name'> | null })[] | null) ?? [];

  return posts.map((p) => ({
    ...p,
    comments: comments.filter((c) => c.post_id === p.id),
    likes: (likes ?? []).filter((l) => l.post_id === p.id),
  }));
}

export async function getStreakRanking(limit = 5): Promise<StreakRanking[]> {
  const supabase = createClient();
  const { data: clients } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('role', 'client');
  if (!clients || clients.length === 0) return [];

  const todayISO = toISODate(new Date());
  const sinceISO = toISODate(addDays(new Date(), -60));
  const clientIds = clients.map((c) => c.id);

  const { data: workouts } = await supabase
    .from('workouts')
    .select('client_id, date, status')
    .in('client_id', clientIds)
    .gte('date', sinceISO)
    .lte('date', todayISO)
    .order('date', { ascending: false });

  const byClient = new Map<string, { date: string; status: string }[]>();
  for (const w of workouts ?? []) {
    const list = byClient.get(w.client_id) ?? [];
    list.push({ date: w.date, status: w.status });
    byClient.set(w.client_id, list);
  }

  const topCandidates = clients
    .map((c) => ({ profile: c, streakDays: computeStreak(byClient.get(c.id) ?? []) }))
    .filter((r) => r.streakDays > 0)
    .sort((a, b) => b.streakDays - a.streakDays)
    .slice(0, limit);

  if (topCandidates.length === 0) return [];

  const { data: cheers } = await supabase
    .from('cheers')
    .select('to_client_id')
    .in(
      'to_client_id',
      topCandidates.map((r) => r.profile.id)
    );

  const cheerCounts = new Map<string, number>();
  for (const c of cheers ?? []) {
    if (!c.to_client_id) continue;
    cheerCounts.set(c.to_client_id, (cheerCounts.get(c.to_client_id) ?? 0) + 1);
  }

  return topCandidates.map((r) => ({ ...r, cheerCount: cheerCounts.get(r.profile.id) ?? 0 }));
}

function computeStreak(workoutsDesc: { date: string; status: string }[]): number {
  let streak = 0;
  let expectedDate = new Date();
  expectedDate.setHours(0, 0, 0, 0);

  for (const w of workoutsDesc) {
    const wDate = new Date(w.date + 'T00:00:00');
    const diffDays = Math.round((expectedDate.getTime() - wDate.getTime()) / 86400000);

    if (diffDays === 0 || diffDays === 1) {
      if (w.status === 'done') {
        streak += 1;
        expectedDate = wDate;
      } else if (diffDays === 0) {
        expectedDate = addDays(wDate, -1);
        continue;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}
