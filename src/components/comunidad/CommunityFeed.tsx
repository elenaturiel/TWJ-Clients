'use client';

import { useMemo, useState } from 'react';
import { PostComposer } from './PostComposer';
import { PostCard } from './PostCard';
import { ChallengeCard } from './ChallengeCard';
import type { ChallengeWithParticipants, PostWithDetails } from '@/app/comunidad/data';

type FilterKey = 'all' | 'recipe' | 'blog' | 'challenge';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todo' },
  { key: 'recipe', label: 'Recetas' },
  { key: 'blog', label: 'Blog' },
  { key: 'challenge', label: 'Retos' },
];

type FeedEntry =
  | { kind: 'challenge'; createdAt: string; challenge: ChallengeWithParticipants }
  | { kind: 'post'; createdAt: string; postType: 'recipe' | 'blog' | 'achievement'; post: PostWithDetails };

export function CommunityFeed({
  challenges,
  posts,
  currentUserId,
  isTrainer,
}: {
  challenges: ChallengeWithParticipants[];
  posts: PostWithDetails[];
  currentUserId: string;
  isTrainer: boolean;
}) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const entries = useMemo<FeedEntry[]>(() => {
    const challengeEntries: FeedEntry[] = challenges.map((c) => ({
      kind: 'challenge',
      createdAt: c.created_at,
      challenge: c,
    }));
    const postEntries: FeedEntry[] = posts.map((p) => ({
      kind: 'post',
      createdAt: p.created_at,
      postType: p.type,
      post: p,
    }));
    return [...challengeEntries, ...postEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [challenges, posts]);

  const filtered = entries.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'challenge') return e.kind === 'challenge';
    return e.kind === 'post' && e.postType === filter;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl">Comunidad</h2>

      {isTrainer && <PostComposer />}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-card border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
              filter === f.key ? 'border-navy bg-navy text-white' : 'border-line text-navy/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="card p-4 text-sm text-navy/50">Todavía no hay nada por aquí.</p>
      )}

      {filtered.map((entry) =>
        entry.kind === 'challenge' ? (
          <ChallengeCard key={`challenge-${entry.challenge.id}`} challenge={entry.challenge} currentUserId={currentUserId} />
        ) : (
          <PostCard key={`post-${entry.post.id}`} post={entry.post} currentUserId={currentUserId} isTrainer={isTrainer} />
        )
      )}
    </div>
  );
}
