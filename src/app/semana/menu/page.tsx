import Link from 'next/link';
import { requireProfile } from '@/lib/auth/get-profile';
import { createClient } from '@/lib/supabase/server';
import { ClientAppShell } from '@/components/layout/ClientAppShell';
import { startOfWeek, weekDates, toISODate, dayLabel, dayLabelFull } from '@/lib/utils/date';
import type { Meal } from '@/lib/types/database.types';

const MEAL_ORDER: Record<string, number> = { desayuno: 0, comida: 1, cena: 2 };
const MEAL_LABEL: Record<string, string> = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena' };

export default async function MenuSemanalPage() {
  const profile = await requireProfile('client');
  const supabase = createClient();

  const weekStart = startOfWeek();
  const days = weekDates(weekStart);
  const weekStartISO = toISODate(weekStart);
  const weekEndISO = toISODate(days[6]);
  const todayISO = toISODate(new Date());

  const { data: meals } = await supabase
    .from('meals')
    .select('*')
    .eq('client_id', profile.id)
    .gte('date', weekStartISO)
    .lte('date', weekEndISO)
    .order('date', { ascending: true });

  const mealsByDate = new Map<string, Meal[]>();
  for (const meal of meals ?? []) {
    const list = mealsByDate.get(meal.date) ?? [];
    list.push(meal);
    mealsByDate.set(meal.date, list);
  }

  return (
    <ClientAppShell fullName={profile.full_name}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/semana" className="text-sm font-semibold text-accent">
          ← Volver a tu semana
        </Link>
        <h1 className="mt-2 text-3xl">Menú completo de la semana</h1>
        <p className="mt-1 text-sm text-navy/60">
          Échale un ojo antes de ir a comprar. Nada de sorpresas de última hora.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {days.map((d) => {
            const iso = toISODate(d);
            const dayMeals = (mealsByDate.get(iso) ?? []).sort(
              (a, b) => MEAL_ORDER[a.meal_type] - MEAL_ORDER[b.meal_type]
            );
            const totalKcal = dayMeals.reduce((sum, m) => sum + m.kcal, 0);
            const isToday = iso === todayISO;

            return (
              <div
                key={iso}
                className={`card flex flex-col p-3 ${isToday ? 'border-accent ring-1 ring-accent' : ''}`}
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
                  <div className="mt-2 border-t border-line pt-2 text-sm font-semibold">
                    {totalKcal} kcal
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
