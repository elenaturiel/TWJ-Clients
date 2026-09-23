'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/get-profile';
import type { ExerciseMediaType } from '@/lib/types/database.types';

export async function createExerciseMediaAction(
  title: string,
  mediaType: ExerciseMediaType,
  url: string
) {
  const profile = await requireProfile('trainer');
  const supabase = createClient();

  const { data, error } = await supabase
    .from('exercise_media')
    .insert({ trainer_id: profile.id, title, media_type: mediaType, url })
    .select()
    .single();

  if (error) return { error: error.message, media: null };
  revalidatePath('/perfil/ejercicios');
  return { error: null, media: data };
}

export async function deleteExerciseMediaAction(mediaId: string) {
  await requireProfile('trainer');
  const supabase = createClient();

  const { error } = await supabase.from('exercise_media').delete().eq('id', mediaId);
  if (error) return { error: error.message };
  revalidatePath('/perfil/ejercicios');
  return { error: null };
}
