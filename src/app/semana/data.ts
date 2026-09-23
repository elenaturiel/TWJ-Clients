import { createClient } from '@/lib/supabase/server';
import { startOfWeek, addDays, toISODate } from '@/lib/utils/date';
import type {
  Workout,
  WorkoutExercise,
  WeightLog,
  MoodLog,
  Meal,
  MealIngredient,
  DietComment,
  QnaMessage,
} from '@/lib/types/database.types';

export type WorkoutWithExercises = Workout & { workout_exercises: WorkoutExercise[] };
export type MealWithIngredients = Meal & { meal_ingredients: MealIngredient[] };

export interface SemanaData {
  weekStartISO: string;
  weekEndISO: string;
  todayISO: string;
  workouts: WorkoutWithExercises[];
  weightLogs: WeightLog[];
  moodLogThisWeek: MoodLog | null;
  todayMeals: MealWithIngredients[];
  todayMealsCompleted: boolean;
  dietCommentsThisWeek: DietComment[];
  qnaMessages: QnaMessage[];
  stats: {
    completedThisWeek: number;
    streakDays: number;
    weightChangeKg: number | null;
  };
}

const STREAK_WINDOW_DAYS = 60;

export async function getSemanaData(clientId: string): Promise<SemanaData> {
  const supabase = createClient();
  const weekStart = startOfWeek();
  const weekEnd = addDays(weekStart, 6);
  const weekStartISO = toISODate(weekStart);
  const weekEndISO = toISODate(weekEnd);
  const todayISO = toISODate(new Date());
  const sixWeeksAgoISO = toISODate(addDays(weekStart, -42));
  const streakSinceISO = toISODate(addDays(new Date(), -STREAK_WINDOW_DAYS));

  const [
    { data: workouts },
    { data: streakWorkouts },
    { data: streakMeals },
    { data: streakMealCompletions },
    { data: weightLogs },
    { data: moodLogs },
    { data: todayMeals },
    { data: dietComments },
    { data: qnaMessages },
  ] = await Promise.all([
    supabase
      .from('workouts')
      .select('*, workout_exercises(*)')
      .eq('client_id', clientId)
      .gte('date', weekStartISO)
      .lte('date', weekEndISO)
      .order('date', { ascending: true }),
    supabase
      .from('workouts')
      .select('date, status')
      .eq('client_id', clientId)
      .gte('date', streakSinceISO)
      .lte('date', todayISO),
    supabase
      .from('meals')
      .select('date')
      .eq('client_id', clientId)
      .gte('date', streakSinceISO)
      .lte('date', todayISO),
    supabase
      .from('meal_day_completions')
      .select('date')
      .eq('client_id', clientId)
      .gte('date', streakSinceISO)
      .lte('date', todayISO),
    supabase
      .from('weight_logs')
      .select('*')
      .eq('client_id', clientId)
      .gte('logged_at', sixWeeksAgoISO)
      .order('logged_at', { ascending: true }),
    supabase
      .from('mood_logs')
      .select('*')
      .eq('client_id', clientId)
      .eq('week_start', weekStartISO)
      .maybeSingle(),
    supabase
      .from('meals')
      .select('*, meal_ingredients(*)')
      .eq('client_id', clientId)
      .eq('date', todayISO),
    supabase
      .from('diet_comments')
      .select('*')
      .eq('client_id', clientId)
      .eq('week_start', weekStartISO)
      .order('created_at', { ascending: false }),
    supabase
      .from('qna_messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true }),
  ]);

  const typedWorkouts = (workouts as WorkoutWithExercises[] | null) ?? [];
  const completedThisWeek = typedWorkouts.filter((w) => w.status === 'done').length;

  const workoutStatusByDate = new Map((streakWorkouts ?? []).map((w) => [w.date, w.status]));
  const mealDates = new Set((streakMeals ?? []).map((m) => m.date));
  const completedMealDates = new Set((streakMealCompletions ?? []).map((c) => c.date));
  const streakDays = computeStreak(workoutStatusByDate, mealDates, completedMealDates);

  let weightChangeKg: number | null = null;
  if (weightLogs && weightLogs.length >= 2) {
    const first = weightLogs[0].weight_kg;
    const last = weightLogs[weightLogs.length - 1].weight_kg;
    weightChangeKg = Math.round((last - first) * 10) / 10;
  }

  return {
    weekStartISO,
    weekEndISO,
    todayISO,
    workouts: typedWorkouts,
    weightLogs: weightLogs ?? [],
    moodLogThisWeek: (moodLogs as MoodLog | null) ?? null,
    todayMeals: (todayMeals as MealWithIngredients[] | null) ?? [],
    todayMealsCompleted: completedMealDates.has(todayISO),
    dietCommentsThisWeek: dietComments ?? [],
    qnaMessages: qnaMessages ?? [],
    stats: { completedThisWeek, streakDays, weightChangeKg },
  };
}

function computeStreak(
  workoutStatusByDate: Map<string, string>,
  mealDates: Set<string>,
  completedMealDates: Set<string>
): number {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < STREAK_WINDOW_DAYS; i++) {
    const iso = toISODate(addDays(today, -i));
    const workoutStatus = workoutStatusByDate.get(iso);
    const hasWorkout = workoutStatus !== undefined;
    const hasMeals = mealDates.has(iso);

    if (!hasWorkout && !hasMeals) {
      // Día sin nada planeado (descanso): ni rompe ni suma la racha.
      continue;
    }

    const workoutOk = !hasWorkout || workoutStatus === 'done';
    const mealOk = !hasMeals || completedMealDates.has(iso);

    if (workoutOk && mealOk) {
      streak += 1;
      continue;
    }

    if (i === 0) {
      // Hoy, todavía sin completar del todo: no rompe la racha.
      continue;
    }

    break;
  }

  return streak;
}
