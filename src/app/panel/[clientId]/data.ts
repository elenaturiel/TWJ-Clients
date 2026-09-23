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

export interface ExerciseSuggestion {
  weightKg: number | null;
  setsReps: string | null;
}

/**
 * Último peso/series-reps conocidos de este cliente para cada ejercicio
 * (por nombre, sin distinguir mayúsculas), priorizando lo que el cliente
 * hizo de verdad (`actual_*`) sobre lo recomendado si ya hay un registro.
 * Sirve para sugerir "remo 23kg" la próxima vez que Jaime escriba "remo"
 * para ese mismo cliente.
 */
export async function getClientExerciseSuggestions(
  clientId: string
): Promise<Record<string, ExerciseSuggestion>> {
  const supabase = createClient();

  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, date')
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .limit(120);

  if (!workouts || workouts.length === 0) return {};

  const workoutIds = workouts.map((w) => w.id);
  const dateByWorkoutId = new Map(workouts.map((w) => [w.id, w.date]));

  const { data: exercises } = await supabase
    .from('workout_exercises')
    .select('workout_id, name, sets_reps, recommended_weight_kg, actual_sets_reps, actual_weight_kg')
    .in('workout_id', workoutIds);

  if (!exercises) return {};

  const sorted = [...exercises].sort((a, b) => {
    const dateA = dateByWorkoutId.get(a.workout_id) ?? '';
    const dateB = dateByWorkoutId.get(b.workout_id) ?? '';
    return dateB.localeCompare(dateA);
  });

  const suggestions: Record<string, ExerciseSuggestion> = {};
  for (const ex of sorted) {
    const key = ex.name.trim().toLowerCase();
    if (key in suggestions) continue;
    const weightKg = ex.actual_weight_kg ?? ex.recommended_weight_kg ?? null;
    const setsReps = ex.actual_sets_reps ?? ex.sets_reps ?? null;
    if (weightKg == null && !setsReps) continue;
    suggestions[key] = { weightKg, setsReps };
  }
  return suggestions;
}
