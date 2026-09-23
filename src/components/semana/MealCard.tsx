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
    <div className="card p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">
          {MEAL_LABEL[meal.meal_type]}
        </span>
        <span className="text-sm font-semibold">{meal.kcal} kcal</span>
      </div>
      <h4 className="mt-1 font-display text-base normal-case tracking-normal">{meal.title}</h4>

      <div className="mt-2 flex gap-3 text-xs text-navy/60">
        {meal.protein_g != null && <span>P {meal.protein_g}g</span>}
        {meal.carbs_g != null && <span>HC {meal.carbs_g}g</span>}
        {meal.fat_g != null && <span>G {meal.fat_g}g</span>}
      </div>

      {meal.meal_ingredients.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-navy/70">
          {meal.meal_ingredients.map((ing) => (
            <li key={ing.id} className="flex justify-between">
              <span>{ing.name}</span>
              {ing.grams != null && <span className="text-navy/50">{ing.grams}g</span>}
            </li>
          ))}
        </ul>
      )}

      {meal.shopping_tip && (
        <div className="mt-2 flex items-start gap-1.5 rounded-card bg-bg p-2 text-xs text-navy/70">
          <IconCart className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{meal.shopping_tip}</span>
        </div>
      )}
    </div>
  );
}
