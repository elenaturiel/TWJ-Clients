import Link from 'next/link';
import { requireProfile } from '@/lib/auth/get-profile';
import { getSemanaData } from './data';
import { ClientAppShell } from '@/components/layout/ClientAppShell';
import { WorkoutDayCard } from '@/components/semana/WorkoutDayCard';
import { WeightChart } from '@/components/semana/WeightChart';
import { WeightForm } from '@/components/semana/WeightForm';
import { MoodSlider } from '@/components/semana/MoodSlider';
import { MealCard } from '@/components/semana/MealCard';
import { DietCommentForm } from '@/components/semana/DietCommentForm';
import { MealDayCompletionToggle } from '@/components/semana/MealDayCompletionToggle';
import { QnaChat } from '@/components/QnaChat';
import { IconFlame } from '@/components/icons';
import { sendQnaMessageAction } from './actions';
import { startOfWeek, weekDates, toISODate, formatWeekRange } from '@/lib/utils/date';

const MEAL_ORDER: Record<string, number> = {
  desayuno: 0,
  snack1: 1,
  comida: 2,
  snack2: 3,
  cena: 4,
};

export default async function SemanaPage() {
  const profile = await requireProfile('client');
  const data = await getSemanaData(profile.id);

  const weekStart = startOfWeek();
  const days = weekDates(weekStart);
  const workoutsByDate = new Map(data.workouts.map((w) => [w.date, w]));

  const todayMealsSorted = [...data.todayMeals].sort(
    (a, b) => MEAL_ORDER[a.meal_type] - MEAL_ORDER[b.meal_type]
  );
  const totals = todayMealsSorted.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + (m.protein_g ?? 0),
      carbs: acc.carbs + (m.carbs_g ?? 0),
      fat: acc.fat + (m.fat_g ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <ClientAppShell fullName={profile.full_name}>
      <section className="relative overflow-hidden bg-navy px-4 py-10 text-white sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(62,142,240,0.25),_transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Foto — fondo de Jaime pendiente
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl">{formatWeekRange(weekStart)}</h1>
          <p className="quote mt-1 text-lg">Y tú, ¿quieres ganar?</p>

          <div className="mt-6 grid grid-cols-3 gap-4 max-w-md">
            <Stat label="Entrenos" value={String(data.stats.completedThisWeek)} />
            <div>
              <div className="flex items-center gap-1 text-2xl font-display">
                {data.stats.streakDays > 0 && <IconFlame className="h-5 w-5 text-amber" />}
                {data.stats.streakDays}d
              </div>
              <div className="text-xs uppercase tracking-wide text-white/50">Racha</div>
            </div>
            <Stat
              label="Peso semanal"
              value={
                data.stats.weightChangeKg === null
                  ? '—'
                  : `${data.stats.weightChangeKg > 0 ? '+' : ''}${data.stats.weightChangeKg}kg`
              }
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <section>
          <h2 className="mb-3 text-xl">Tu semana</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {days.map((d) => (
              <WorkoutDayCard key={toISODate(d)} workout={workoutsByDate.get(toISODate(d))} />
            ))}
          </div>
        </section>

        <section id="progreso" className="grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-3 text-xl">Tu progreso</h2>
            <WeightChart logs={data.weightLogs} />
            <div className="mt-4">
              <WeightForm />
            </div>
            <div className="mt-4">
              <MoodSlider
                weekStartISO={data.weekStartISO}
                initialScore={data.moodLogThisWeek?.mood_score ?? null}
              />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-xl">¿Has seguido la dieta esta semana?</h2>
            <DietCommentForm weekStartISO={data.weekStartISO} comments={data.dietCommentsThisWeek} />
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl">Tu menú de hoy</h2>
            <div className="flex items-center gap-3">
              <Link href="/semana/menu" className="text-sm font-semibold text-accent">
                Ver semana completa →
              </Link>
              <Link href="/semana/menu?week=1" className="text-sm font-semibold text-accent">
                Semana que viene →
              </Link>
            </div>
          </div>

          {todayMealsSorted.length === 0 ? (
            <p className="card p-4 text-sm text-navy/50">
              Jaime todavía no ha subido el menú de hoy.
            </p>
          ) : (
            <>
              <div
                className={`card mb-3 flex flex-wrap items-center justify-between gap-3 p-3 text-sm ${
                  data.todayMealsCompleted ? 'border-positive ring-1 ring-positive' : ''
                }`}
              >
                <div className="flex flex-wrap gap-4">
                  <span className="font-semibold">{totals.kcal} kcal</span>
                  <span className="text-navy/60">P {totals.protein.toFixed(0)}g</span>
                  <span className="text-navy/60">HC {totals.carbs.toFixed(0)}g</span>
                  <span className="text-navy/60">G {totals.fat.toFixed(0)}g</span>
                </div>
                <MealDayCompletionToggle date={data.todayISO} initialDone={data.todayMealsCompleted} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {todayMealsSorted.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
              </div>
            </>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-xl">Dudas para Jaime</h2>
          <QnaChat
            clientId={profile.id}
            initialMessages={data.qnaMessages}
            sendAction={sendQnaMessageAction}
            currentSender="client"
          />
        </section>
      </div>
    </ClientAppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-display">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
    </div>
  );
}
