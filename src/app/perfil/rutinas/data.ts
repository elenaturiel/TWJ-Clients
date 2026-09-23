import { createClient } from '@/lib/supabase/server';
import type { RoutineTemplate, RoutineTemplateExercise } from '@/lib/types/database.types';

export type TemplateWithExercises = RoutineTemplate & {
  routine_template_exercises: RoutineTemplateExercise[];
};

export async function getRoutineTemplates(trainerId: string): Promise<TemplateWithExercises[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('routine_templates')
    .select('*, routine_template_exercises(*)')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false });

  return (data as TemplateWithExercises[] | null) ?? [];
}
