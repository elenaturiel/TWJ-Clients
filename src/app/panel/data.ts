import { createClient } from '@/lib/supabase/server';
import { startOfWeek, addDays, toISODate } from '@/lib/utils/date';
import type { Profile, Workout, WeightLog, TrainerPrivateNote } from '@/lib/types/database.types';

export interface ClientListItem extends Profile {
  needsReview: boolean;
}

export async function getClientList(): Promise<ClientListItem[]> {
  const supabase = createClient();

  const { data: clients } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('full_name', { ascending: true });

  if (!clients || clients.length === 0) return [];

  const clientIds = clients.map((c) => c.id);

  const [{ data: pendingDiet }, { data: qnaMessages }] = await Promise.all([
    supabase
      .from('diet_comments')
      .select('client_id')
      .in('client_id', clientIds)
      .is('trainer_reply', null),
    supabase
      .from('qna_messages')
      .select('client_id, sender, created_at')
      .in('client_id', clientIds)
      .order('created_at', { ascending: false }),
  ]);

  const pendingDietSet = new Set((pendingDiet ?? []).map((d) => d.client_id));

  const lastMessageByClient = new Map<string, string>();
  for (const m of qnaMessages ?? []) {
    if (!lastMessageByClient.has(m.client_id)) lastMessageByClient.set(m.client_id, m.sender);
  }

  return clients.map((c) => ({
    ...c,
    needsReview: pendingDietSet.has(c.id) || lastMessageByClient.get(c.id) === 'client',
  }));
}

export interface ClientDetail {
  profile: Profile;
  adherencePct: number | null;
  lastWeight: number | null;
  privateNote: TrainerPrivateNote | null;
}

export async function getClientDetail(clientId: string): Promise<ClientDetail | null> {
  const supabase = createClient();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', clientId).single();
  if (!profile) return null;

  const sinceISO = profile.client_since ?? toISODate(addDays(new Date(), -60));
  const todayISO = toISODate(new Date());

  const [{ data: workouts }, { data: weightLogs }, { data: privateNote }] = await Promise.all([
    supabase
      .from('workouts')
      .select('status')
      .eq('client_id', clientId)
      .gte('date', sinceISO)
      .lte('date', todayISO),
    supabase
      .from('weight_logs')
      .select('*')
      .eq('client_id', clientId)
      .order('logged_at', { ascending: false })
      .limit(1),
    supabase.from('trainer_private_notes').select('*').eq('client_id', clientId).maybeSingle(),
  ]);

  const total = (workouts as Pick<Workout, 'status'>[] | null)?.length ?? 0;
  const done = (workouts as Pick<Workout, 'status'>[] | null)?.filter((w) => w.status === 'done').length ?? 0;
  const adherencePct = total > 0 ? Math.round((done / total) * 100) : null;

  return {
    profile,
    adherencePct,
    lastWeight: (weightLogs as WeightLog[] | null)?.[0]?.weight_kg ?? null,
    privateNote: (privateNote as TrainerPrivateNote | null) ?? null,
  };
}

export function currentWeekBounds() {
  const weekStart = startOfWeek();
  const weekEnd = addDays(weekStart, 6);
  return { weekStart, weekEnd, weekStartISO: toISODate(weekStart), weekEndISO: toISODate(weekEnd) };
}
