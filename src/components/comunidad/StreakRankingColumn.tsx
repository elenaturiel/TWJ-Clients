'use client';

import { useState, useTransition } from 'react';
import { cheerAction } from '@/app/comunidad/actions';
import type { StreakRanking } from '@/app/comunidad/data';

export function StreakRankingColumn({
  ranking,
  currentUserId,
}: {
  ranking: StreakRanking[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl">En racha esta semana</h2>
      <div className="card divide-y divide-line p-0">
        {ranking.length === 0 && (
          <p className="p-4 text-sm text-navy/50">Nadie lleva racha activa todavía. ¡Sé el primero!</p>
        )}
        {ranking.map((r, i) => (
          <RankingRow key={r.profile.id} rank={i + 1} item={r} isSelf={r.profile.id === currentUserId} />
        ))}
      </div>
    </div>
  );
}

function RankingRow({
  rank,
  item,
  isSelf,
}: {
  rank: number;
  item: StreakRanking;
  isSelf: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [cheered, setCheered] = useState(false);

  const cheer = () => {
    setCheered(true);
    startTransition(async () => {
      await cheerAction(item.profile.id);
    });
  };

  return (
    <div className="flex items-center gap-3 p-3">
      <span className="w-5 text-center text-sm font-semibold text-navy/40">{rank}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
        {item.profile.full_name.slice(0, 2).toUpperCase()}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{item.profile.full_name}</p>
        <p className="text-xs text-navy/50">
          {item.streakDays} días seguidos{item.cheerCount > 0 ? ` · ${item.cheerCount} ánimos` : ''}
        </p>
      </div>
      {!isSelf && (
        <button onClick={cheer} disabled={isPending || cheered} className="btn-secondary py-1 text-xs">
          {cheered ? 'Animado' : 'Animar'}
        </button>
      )}
    </div>
  );
}
