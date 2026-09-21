import { createClient } from '@/lib/supabase/server';
import { currentWeekBounds } from '../data';
import type {
  Workout,
  WorkoutExercise,
  Meal,
  MealIngredient,
  DietComment,
  QnaMessage,
} from '@/lib/types/database.types';

export type WorkoutWithExercises = Workout & { workout_exercises: WorkoutExercise[] };
export type MealWithIngredients = Meal & { meal_ingredients: MealIngredient[] };

export interface ClientWeekData {
  weekStartISO: string;
  weekEndISO: string;
  workouts: WorkoutWithExercises[];
  meals: MealWithIngredients[];
  dietComments: DietComment[];
  qnaMessages: QnaMessage[];
}

export async function getClientWeekData(clientId: string): Promise<ClientWeekData> {
  const supabase = createClient();
  const { weekStartISO, weekEndISO } = currentWeekBounds();

  const [{ data: workouts }, { data: meals }, { data: dietComments }, { data: qnaMessages }] =
    await Promise.all([
      supabase
        .from('workouts')
        .select('*, workout_exercises(*)')
        .eq('client_id', clientId)
        .gte('date', weekStartISO)
        .lte('date', weekEndISO)
        .order('date', { ascending: true }),
      supabase
        .from('meals')
        .select('*, meal_ingredients(*)')
        .eq('client_id', clientId)
        .gte('date', weekStartISO)
        .lte('date', weekEndISO)
        .order('date', { ascending: true }),
      supabase
        .from('diet_comments')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('qna_messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true }),
    ]);

  return {
    weekStartISO,
    weekEndISO,
    workouts: (workouts as WorkoutWithExercises[] | null) ?? [],
    meals: (meals as MealWithIngredients[] | null) ?? [],
    dietComments: dietComments ?? [],
    qnaMessages: qnaMessages ?? [],
  };
}
