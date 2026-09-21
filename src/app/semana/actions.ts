'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function rateWorkoutAction(workoutId: string, rating: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const { error } = await supabase
    .from('workouts')
    .update({ client_rating: rating })
    .eq('id', workoutId);

  if (error) return { error: error.message };
  revalidatePath('/semana');
  return { error: null };
}

export async function logWeightAction(weightKg: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const { error } = await supabase.from('weight_logs').insert({
    client_id: user.id,
    weight_kg: weightKg,
    logged_at: new Date().toISOString().slice(0, 10),
  });

  if (error) return { error: error.message };
  revalidatePath('/semana');
  return { error: null };
}

export async function logMoodAction(weekStart: string, moodScore: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const { data: existing } = await supabase
    .from('mood_logs')
    .select('id')
    .eq('client_id', user.id)
    .eq('week_start', weekStart)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from('mood_logs').update({ mood_score: moodScore }).eq('id', existing.id)
    : await supabase
        .from('mood_logs')
        .insert({ client_id: user.id, week_start: weekStart, mood_score: moodScore });

  if (error) return { error: error.message };
  revalidatePath('/semana');
  return { error: null };
}

export async function submitDietCommentAction(weekStart: string, comment: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const { error } = await supabase
    .from('diet_comments')
    .insert({ client_id: user.id, week_start: weekStart, comment });

  if (error) return { error: error.message };
  revalidatePath('/semana');
  return { error: null };
}

export async function sendQnaMessageAction(message: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const { error } = await supabase
    .from('qna_messages')
    .insert({ client_id: user.id, sender: 'client', message });

  if (error) return { error: error.message };
  revalidatePath('/semana');
  return { error: null };
}
