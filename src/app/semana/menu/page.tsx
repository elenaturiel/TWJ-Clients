import Link from 'next/link';
import { requireProfile } from '@/lib/auth/get-profile';
import { createClient } from '@/lib/supabase/server';
import { ClientAppShell } from '@/components/layout/ClientAppShell';
import { MealDayCompletionToggle } from '@/components/semana/MealDayCompletionToggle';
import { startOfWeek, weekDates, toISODate, dayLabel, dayLabelFull, addDays, formatWeekRange } from '@/lib/utils/date';
import type { Meal } from '@/lib/types/database.types';

const MEAL_ORDER: Record<string, number> = {
  desayuno: 0,
  snack1: 1,
  comida: 2,
  snack2: 3,
  cena: 4,
};
const MEAL_LABEL: Record<string, string> = {
  desayuno: 'Desayuno',
  snack1: 'Snack 1',
  comida: 'Comida',
  snack2: 'Snack 2',
  cena: 'Cena',
};

export default async function MenuSemanalPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const profile = await requireProfile('client');
  const supabase = createClient();

  // El cliente solo puede adelantar como mucho una semana.
  const weekOffset = searchParams.week === '1' ? 1 : 0;

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7));
  const days = weekDates(weekStart);
  const weekStartISO = toISODate(weekStart);
  const weekEndISO = toISODate(days[6]);
  const todayISO = toISODate(new Date());

  const [{ data: meals }, { data: completions }] = await Promise.all([
    supabase
      .from('meals')
      .select('*')
      .eq('client_id', profile.id)
      .gte('date', weekStartISO)
      .lte('date', weekEndISO)
      .order('date', { ascending: true }),
    supabase
      .from('meal_day_completions')
      .select('date')
      .eq('client_id', profile.id)
      .gte('date', weekStartISO)
      .lte('date', weekEndISO),
  ]);

  const mealsByDate = new Map<string, Meal[]>();
  for (const meal of meals ?? []) {
    const list = mealsByDate.get(meal.date) ?? [];
    list.push(meal);
    mealsByDate.set(meal.date, list);
  }
  const completedDates = new Set((completions ?? []).map((c) => c.date));

  return (
    <ClientAppShell fullName={profile.full_name}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/semana" className="text-sm font-semibold text-accent">
          ← Volver a tu semana
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl">
            {weekOffset === 0 ? 'Menú completo de la semana' : 'Menú de la semana que viene'}
          </h1>
          {weekOffset === 0 ? (
            <Link href="/semana/menu?week=1" className="text-sm font-semibold text-accent">
              Semana que viene →
            </Link>
          ) : (
            <Link href="/semana/menu" className="text-sm font-semibold text-accent">
              ← Esta semana
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm text-navy/60">
          {formatWeekRange(weekStart)} · Échale un ojo antes de ir a comprar. Nada de sorpresas de última hora.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {days.map((d) => {
            const iso = toISODate(d);
            const dayMeals = (mealsByDate.get(iso) ?? []).sort(
              (a, b) => MEAL_ORDER[a.meal_type] - MEAL_ORDER[b.meal_type]
            );
            const totalKcal = dayMeals.reduce((sum, m) => sum + m.kcal, 0);
            const isToday = iso === todayISO;
            const isCompleted = completedDates.has(iso);

            return (
              <div
                key={iso}
                className={`card flex flex-col p-3 ${
                  isCompleted
                    ? 'border-positive ring-1 ring-positive'
                    : isToday
                      ? 'border-accent ring-1 ring-accent'
                      : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">
                    {dayLabel(d)}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-semibold uppercase text-accent">Hoy</span>
                  )}
                </div>
                <span className="text-xs text-navy/40" title={dayLabelFull(d)}>
                  {d.getDate()}
                </span>

                <ul className="mt-2 flex-1 space-y-2 text-xs">
                  {dayMeals.length === 0 && <li className="text-navy/40">Sin menú</li>}
                  {dayMeals.map((m) => (
                    <li key={m.id}>
                      <div className="font-semibold text-navy/70">{MEAL_LABEL[m.meal_type]}</div>
                      <div className="text-navy/60">{m.title}</div>
                      <div className="text-navy/40">{m.kcal} kcal</div>
                    </li>
                  ))}
                </ul>

                {dayMeals.length > 0 && (
                  <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-sm font-semibold">
                    {totalKcal} kcal
                    <MealDayCompletionToggle date={iso} initialDone={isCompleted} compact />
                  </div>
                )}

                {isToday && (
                  <Link href="/semana" className="mt-2 text-[11px] font-semibold text-accent">
                    Ver detalle →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ClientAppShell>
  );
}
