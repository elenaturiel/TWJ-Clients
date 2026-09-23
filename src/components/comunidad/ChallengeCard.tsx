'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { joinChallengeAction } from '@/app/comunidad/actions';
import type { ChallengeWithParticipants } from '@/app/comunidad/data';

export function ChallengeCard({
  challenge,
  currentUserId,
}: {
  challenge: ChallengeWithParticipants;
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const participants = challenge.challenge_participants;
  const joined = participants.some((p) => p.client_id === currentUserId);
  const completedCount = participants.filter((p) => p.completed).length;
  const progressPct = participants.length > 0 ? Math.round((completedCount / participants.length) * 100) : 0;

  const join = () => {
    startTransition(async () => {
      await joinChallengeAction(challenge.id);
    });
  };

  return (
    <div className="card p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-amber">Reto</span>
      <div className="mt-1 flex items-start gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-card bg-bg">
          <Image src={challenge.badge_image_url} alt={challenge.badge_name} fill className="object-cover" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-base normal-case tracking-normal">{challenge.title}</h3>
          {challenge.goal_label && <p className="text-xs text-navy/50">Objetivo: {challenge.goal_label}</p>}
        </div>
      </div>

      {challenge.description && <p className="mt-2 text-sm text-navy/70">{challenge.description}</p>}

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bg">
        <div className="h-full bg-accent" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex -space-x-2">
          {participants.slice(0, 5).map((p) => (
            <div
              key={p.id}
              title={p.profiles?.full_name}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-accent/20 text-[9px] font-semibold text-accent"
            >
              {p.profiles?.full_name?.slice(0, 2).toUpperCase()}
            </div>
          ))}
        </div>
        <button
          onClick={join}
          disabled={joined || isPending}
          className="btn-secondary py-1 text-xs disabled:opacity-100"
        >
          {joined ? 'Apuntado/a' : isPending ? '...' : 'Unirme'}
        </button>
      </div>
    </div>
  );
}
