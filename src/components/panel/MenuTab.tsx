'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CreateMealQuickForm } from './CreateMealQuickForm';
import type { MealType } from '@/lib/types/database.types';
import type { MealWithIngredients } from '@/app/panel/[clientId]/data';

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'desayuno', label: 'Desayuno' },
  { value: 'snack1', label: 'Snack 1' },
  { value: 'comida', label: 'Comida' },
  { value: 'snack2', label: 'Snack 2' },
  { value: 'cena', label: 'Cena' },
];

export function MenuTab({
  clientId,
  days,
  meals,
}: {
  clientId: string;
  days: { iso: string; label: string }[];
  meals: MealWithIngredients[];
}) {
  const [activeDay, setActiveDay] = useState(days[0]?.iso);

  const mealsByDate = new Map<string, MealWithIngredients[]>();
  for (const m of meals) {
    const list = mealsByDate.get(m.date) ?? [];
    list.push(m);
    mealsByDate.set(m.date, list);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {days.map((d) => (
          <button
            key={d.iso}
            onClick={() => setActiveDay(d.iso)}
            className={`rounded-card border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
              activeDay === d.iso ? 'border-navy bg-navy text-white' : 'border-line text-navy/60'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {days
        .filter((d) => d.iso === activeDay)
        .map((d) => (
          <DayMealsPreview
            key={d.iso}
            clientId={clientId}
            date={d.iso}
            dayMeals={mealsByDate.get(d.iso) ?? []}
          />
        ))}
    </div>
  );
}

function DayMealsPreview({
  clientId,
  date,
  dayMeals,
}: {
  clientId: string;
  date: string;
  dayMeals: MealWithIngredients[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {MEAL_TYPES.map((mt) => {
        const meal = dayMeals.find((m) => m.meal_type === mt.value);
        return meal ? (
          <Link
            key={mt.value}
            href={`/panel/${clientId}/comidas/${meal.id}`}
            className="card flex min-h-[140px] flex-col p-4 active:scale-[0.99]"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">{mt.label}</span>
            <h3 className="mt-1 font-display text-base normal-case tracking-normal">{meal.title}</h3>
            <p className="mt-1 text-xs text-navy/50">
              {meal.meal_ingredients.length}{' '}
              {meal.meal_ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}
            </p>
            <div className="mt-auto pt-3 text-sm font-semibold">{meal.kcal} kcal</div>
            <span className="mt-2 text-xs font-semibold text-accent">Editar →</span>
          </Link>
        ) : (
          <CreateMealQuickForm key={mt.value} clientId={clientId} date={date} mealType={mt.value} label={mt.label} />
        );
      })}
    </div>
  );
}
