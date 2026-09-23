import Link from 'next/link';
import { IconCart } from '@/components/icons';
import type { MealWithIngredients } from '@/app/semana/data';

const MEAL_LABEL: Record<string, string> = {
  desayuno: 'Desayuno',
  snack1: 'Snack 1',
  comida: 'Comida',
  snack2: 'Snack 2',
  cena: 'Cena',
};

export function MealCard({ meal }: { meal: MealWithIngredients }) {
  return (
    <Link href={`/semana/comida/${meal.id}`} className="card flex min-h-[120px] flex-col p-4 active:scale-[0.99]">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">
          {MEAL_LABEL[meal.meal_type]}
        </span>
        <span className="text-sm font-semibold">{meal.kcal} kcal</span>
      </div>
      <h4 className="mt-1 font-display text-base normal-case tracking-normal">{meal.title}</h4>
      <p className="mt-1 text-xs text-navy/50">
        {meal.meal_ingredients.length} {meal.meal_ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}
      </p>
      <div className="mt-auto flex items-center justify-between pt-3">
        {meal.shopping_tip && <IconCart className="h-4 w-4 text-navy/40" />}
        <span className="ml-auto text-xs font-semibold text-accent">Ver →</span>
      </div>
    </Link>
  );
}
