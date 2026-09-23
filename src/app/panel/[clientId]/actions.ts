'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/get-profile';
import type { WorkoutStatus, MealType } from '@/lib/types/database.types';

async function trainerClient() {
  await requireProfile('trainer');
  return createClient();
}

export async function savePrivateNoteAction(clientId: string, note: string) {
  const supabase = await trainerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from('trainer_private_notes')
    .select('id')
    .eq('client_id', clientId)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from('trainer_private_notes')
        .update({ note, updated_at: new Date().toISOString(), trainer_id: user?.id })
        .eq('id', existing.id)
    : await supabase
        .from('trainer_private_notes')
        .insert({ client_id: clientId, note, trainer_id: user?.id });

  if (error) return { error: error.message };
  revalidatePath(`/panel/${clientId}`);
  return { error: null };
}

export async function upsertWorkoutAction(input: {
  clientId: string;
  date: string;
  dayLabel: string;
  title: string;
  status: WorkoutStatus;
  trainerComment: string | null;
}) {
  const supabase = await trainerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from('workouts')
    .select('id')
    .eq('client_id', input.clientId)
    .eq('date', input.date)
    .maybeSingle();

  const payload = {
    client_id: input.clientId,
    date: input.date,
    day_label: input.dayLabel,
    title: input.title,
    status: input.status,
    trainer_comment: input.trainerComment,
    created_by: user?.id,
  };

  const { data: workout, error } = existing
    ? await supabase.from('workouts').update(payload).eq('id', existing.id).select().single()
    : await supabase.from('workouts').insert(payload).select().single();

  if (error) return { error: error.message, workoutId: null };
  revalidatePath(`/panel/${input.clientId}`);
  return { error: null, workoutId: workout.id as string };
}

export async function addExerciseAction(
  workoutId: string,
  clientId: string,
  name: string,
  setsReps: string,
  recommendedWeightKg: number | null
) {
  const supabase = await trainerClient();
  const { error } = await supabase.from('workout_exercises').insert({
    workout_id: workoutId,
    name,
    sets_reps: setsReps || null,
    recommended_weight_kg: recommendedWeightKg,
    sort_order: Date.now(),
  });
  if (error) return { error: error.message };
  revalidatePath(`/panel/${clientId}`);
  return { error: null };
}

export async function removeExerciseAction(exerciseId: string, clientId: string) {
  const supabase = await trainerClient();
  const { error } = await supabase.from('workout_exercises').delete().eq('id', exerciseId);
  if (error) return { error: error.message };
  revalidatePath(`/panel/${clientId}`);
  return { error: null };
}

export async function upsertMealAction(input: {
  clientId: string;
  date: string;
  mealType: MealType;
  title: string;
  kcal: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  shoppingTip: string | null;
}) {
  const supabase = await trainerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from('meals')
    .select('id')
    .eq('client_id', input.clientId)
    .eq('date', input.date)
    .eq('meal_type', input.mealType)
    .maybeSingle();

  const payload = {
    client_id: input.clientId,
    date: input.date,
    meal_type: input.mealType,
    title: input.title,
    kcal: input.kcal,
    protein_g: input.proteinG,
    carbs_g: input.carbsG,
    fat_g: input.fatG,
    shopping_tip: input.shoppingTip,
    created_by: user?.id,
  };

  const { data: meal, error } = existing
    ? await supabase.from('meals').update(payload).eq('id', existing.id).select().single()
    : await supabase.from('meals').insert(payload).select().single();

  if (error) return { error: error.message, mealId: null };
  revalidatePath(`/panel/${input.clientId}`);
  return { error: null, mealId: meal.id as string };
}

export async function addIngredientAction(mealId: string, clientId: string, name: string, grams: number | null) {
  const supabase = await trainerClient();
  const { error } = await supabase.from('meal_ingredients').insert({ meal_id: mealId, name, grams });
  if (error) return { error: error.message };
  revalidatePath(`/panel/${clientId}`);
  return { error: null };
}

export async function removeIngredientAction(ingredientId: string, clientId: string) {
  const supabase = await trainerClient();
  const { error } = await supabase.from('meal_ingredients').delete().eq('id', ingredientId);
  if (error) return { error: error.message };
  revalidatePath(`/panel/${clientId}`);
  return { error: null };
}

export async function replyDietCommentAction(dietCommentId: string, clientId: string, reply: string) {
  const supabase = await trainerClient();
  const { error } = await supabase
    .from('diet_comments')
    .update({ trainer_reply: reply })
    .eq('id', dietCommentId);
  if (error) return { error: error.message };
  revalidatePath(`/panel/${clientId}`);
  return { error: null };
}

export async function sendTrainerQnaMessageAction(clientId: string, message: string) {
  const supabase = await trainerClient();
  const { error } = await supabase
    .from('qna_messages')
    .insert({ client_id: clientId, sender: 'trainer', message });
  if (error) return { error: error.message };
  revalidatePath(`/panel/${clientId}`);
  return { error: null };
}
