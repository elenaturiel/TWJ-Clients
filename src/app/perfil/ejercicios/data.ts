import { createClient } from '@/lib/supabase/server';
import type { ExerciseMedia } from '@/lib/types/database.types';

export async function getExerciseMedia(trainerId: string): Promise<ExerciseMedia[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('exercise_media')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false });

  return data ?? [];
}
