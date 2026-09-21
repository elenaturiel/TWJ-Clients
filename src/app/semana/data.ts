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
  workouts: WorkoutWithExercises[];
  weightLogs: WeightLog[];
  moodLogThisWeek: MoodLog | null;
  todayMeals: MealWithIngredients[];
  dietCommentsThisWeek: DietComment[];
  qnaMessages: QnaMessage[];
  stats: {
    completedThisWeek: number;
    streakDays: number;
    weightChangeKg: number | null;
  };
}

export async function getSemanaData(clientId: string): Promise<SemanaData> {
  const supabase = createClient();
  const weekStart = startOfWeek();
  const weekEnd = addDays(weekStart, 6);
  const weekStartISO = toISODate(weekStart);
  const weekEndISO = toISODate(weekEnd);
  const todayISO = toISODate(new Date());
  const sixWeeksAgoISO = toISODate(addDays(weekStart, -42));

  const [
    { data: workouts },
    { data: recentWorkoutsForStreak },
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
      .lte('date', todayISO)
      .order('date', { ascending: false })
      .limit(60),
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
  const streakDays = computeStreak(recentWorkoutsForStreak ?? []);

  let weightChangeKg: number | null = null;
  if (weightLogs && weightLogs.length >= 2) {
    const first = weightLogs[0].weight_kg;
    const last = weightLogs[weightLogs.length - 1].weight_kg;
    weightChangeKg = Math.round((last - first) * 10) / 10;
  }

  return {
    weekStartISO,
    weekEndISO,
    workouts: typedWorkouts,
    weightLogs: weightLogs ?? [],
    moodLogThisWeek: (moodLogs as MoodLog | null) ?? null,
    todayMeals: (todayMeals as MealWithIngredients[] | null) ?? [],
    dietCommentsThisWeek: dietComments ?? [],
    qnaMessages: qnaMessages ?? [],
    stats: { completedThisWeek, streakDays, weightChangeKg },
  };
}

function computeStreak(workoutsDesc: { date: string; status: string }[]): number {
  let streak = 0;
  let expectedDate = new Date();
  expectedDate.setHours(0, 0, 0, 0);

  for (const w of workoutsDesc) {
    const wDate = new Date(w.date + 'T00:00:00');
    const diffDays = Math.round((expectedDate.getTime() - wDate.getTime()) / 86400000);

    if (diffDays === 0 || diffDays === 1) {
      if (w.status === 'done') {
        streak += 1;
        expectedDate = wDate;
      } else if (diffDays === 0) {
        // hoy sin completar todavía: no rompe la racha, seguimos mirando ayer
        expectedDate = addDays(wDate, -1);
        continue;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}
