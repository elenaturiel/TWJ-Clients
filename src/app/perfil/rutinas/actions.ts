'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/get-profile';

async function trainerClient() {
  const profile = await requireProfile('trainer');
  return { supabase: createClient(), profile };
}

export async function createTemplateAction(title: string) {
  const { supabase, profile } = await trainerClient();
  const { data, error } = await supabase
    .from('routine_templates')
    .insert({ trainer_id: profile.id, title })
    .select()
    .single();

  if (error) return { error: error.message, templateId: null };
  revalidatePath('/perfil/rutinas');
  return { error: null, templateId: data.id as string };
}

export async function renameTemplateAction(templateId: string, title: string) {
  const { supabase } = await trainerClient();
  const { error } = await supabase.from('routine_templates').update({ title }).eq('id', templateId);
  if (error) return { error: error.message };
  revalidatePath('/perfil/rutinas');
  return { error: null };
}

export async function deleteTemplateAction(templateId: string) {
  const { supabase } = await trainerClient();
  const { error } = await supabase.from('routine_templates').delete().eq('id', templateId);
  if (error) return { error: error.message };
  revalidatePath('/perfil/rutinas');
  return { error: null };
}

export async function addTemplateExerciseAction(
  templateId: string,
  name: string,
  setsReps: string,
  recommendedWeightKg: number | null,
  mediaId: string | null = null
) {
  const { supabase } = await trainerClient();
  const { data, error } = await supabase
    .from('routine_template_exercises')
    .insert({
      template_id: templateId,
      name,
      sets_reps: setsReps || null,
      recommended_weight_kg: recommendedWeightKg,
      media_id: mediaId,
      sort_order: Date.now(),
    })
    .select()
    .single();

  if (error) return { error: error.message, exercise: null };
  revalidatePath('/perfil/rutinas');
  return { error: null, exercise: data };
}

export async function updateTemplateExerciseMediaAction(exerciseId: string, mediaId: string | null) {
  const { supabase } = await trainerClient();
  const { error } = await supabase
    .from('routine_template_exercises')
    .update({ media_id: mediaId })
    .eq('id', exerciseId);
  if (error) return { error: error.message };
  revalidatePath('/perfil/rutinas');
  return { error: null };
}

export async function removeTemplateExerciseAction(exerciseId: string) {
  const { supabase } = await trainerClient();
  const { error } = await supabase.from('routine_template_exercises').delete().eq('id', exerciseId);
  if (error) return { error: error.message };
  revalidatePath('/perfil/rutinas');
  return { error: null };
}
