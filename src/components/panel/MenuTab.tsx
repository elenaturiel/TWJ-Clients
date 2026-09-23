'use client';

import { useState, useTransition } from 'react';
import {
  upsertMealAction,
  addIngredientAction,
  updateIngredientAction,
  removeIngredientAction,
} from '@/app/panel/[clientId]/actions';
import type { MealType, MealIngredient } from '@/lib/types/database.types';
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
          <DayMealsEditor
            key={d.iso}
            clientId={clientId}
            date={d.iso}
            dayMeals={mealsByDate.get(d.iso) ?? []}
          />
        ))}
    </div>
  );
}

function DayMealsEditor({
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
      {MEAL_TYPES.map((mt) => (
        <MealEditor
          key={mt.value}
          clientId={clientId}
          date={date}
          mealType={mt.value}
          label={mt.label}
          existing={dayMeals.find((m) => m.meal_type === mt.value)}
        />
      ))}
    </div>
  );
}

function MealEditor({
  clientId,
  date,
  mealType,
  label,
  existing,
}: {
  clientId: string;
  date: string;
  mealType: MealType;
  label: string;
  existing?: MealWithIngredients;
}) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [kcal, setKcal] = useState(String(existing?.kcal ?? ''));
  const [protein, setProtein] = useState(String(existing?.protein_g ?? ''));
  const [carbs, setCarbs] = useState(String(existing?.carbs_g ?? ''));
  const [fat, setFat] = useState(String(existing?.fat_g ?? ''));
  const [shoppingTip, setShoppingTip] = useState(existing?.shopping_tip ?? '');
  const [mealId, setMealId] = useState(existing?.id ?? null);
  const [ingredients, setIngredients] = useState(existing?.meal_ingredients ?? []);
  const [newIngredient, setNewIngredient] = useState('');
  const [newGrams, setNewGrams] = useState('');
  const [isPending, startTransition] = useTransition();
  const [ingredientError, setIngredientError] = useState<string | null>(null);

  const save = () => {
    if (!title.trim() || !kcal) return;
    startTransition(async () => {
      const result = await upsertMealAction({
        clientId,
        date,
        mealType,
        title: title.trim(),
        kcal: Number(kcal),
        proteinG: protein ? Number(protein) : null,
        carbsG: carbs ? Number(carbs) : null,
        fatG: fat ? Number(fat) : null,
        shoppingTip: shoppingTip.trim() || null,
      });
      if (!result.error && result.mealId) setMealId(result.mealId);
    });
  };

  const addIngredient = () => {
    if (!mealId || !newIngredient.trim()) return;
    setIngredientError(null);
    startTransition(async () => {
      const grams = newGrams ? Number(newGrams) : null;
      const result = await addIngredientAction(mealId, clientId, newIngredient.trim(), grams);
      if (result.error) {
        setIngredientError(result.error);
        return;
      }
      setIngredients((prev) => [
        ...prev,
        { id: crypto.randomUUID(), meal_id: mealId, name: newIngredient.trim(), grams },
      ]);
      setNewIngredient('');
      setNewGrams('');
    });
  };

  const removeIngredient = (id: string) => {
    startTransition(async () => {
      const result = await removeIngredientAction(id, clientId);
      if (result.error) {
        setIngredientError(result.error);
        return;
      }
      setIngredients((prev) => prev.filter((i) => i.id !== id));
    });
  };

  const updateIngredient = (updated: MealIngredient) => {
    setIngredients((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  return (
    <div className="card p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-navy/50">{label}</span>
      <input className="input mt-2" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="mt-2 grid grid-cols-4 gap-1">
        <input className="input py-1 text-xs" placeholder="kcal" value={kcal} onChange={(e) => setKcal(e.target.value)} />
        <input className="input py-1 text-xs" placeholder="P" value={protein} onChange={(e) => setProtein(e.target.value)} />
        <input className="input py-1 text-xs" placeholder="HC" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        <input className="input py-1 text-xs" placeholder="G" value={fat} onChange={(e) => setFat(e.target.value)} />
      </div>

      {mealId && (
        <div className="mt-2 space-y-1">
          {ingredients.map((ing) => (
            <IngredientEditRow
              key={ing.id}
              ingredient={ing}
              clientId={clientId}
              onUpdated={updateIngredient}
              onRemove={() => removeIngredient(ing.id)}
            />
          ))}
          <div className="flex gap-1 pt-1">
            <input
              className="input py-1 text-xs"
              placeholder="Ingrediente"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
            />
            <input
              className="input w-16 py-1 text-xs"
              placeholder="g"
              value={newGrams}
              onChange={(e) => setNewGrams(e.target.value)}
            />
            <button onClick={addIngredient} className="btn-secondary px-2 text-xs">
              +
            </button>
          </div>
          {ingredientError && <p className="text-[11px] text-red-600">{ingredientError}</p>}
        </div>
      )}

      <textarea
        className="input mt-2 min-h-[50px] text-sm"
        placeholder="Dónde comprar (ej: Mercadona, marca Hacendado...)"
        value={shoppingTip}
        onChange={(e) => setShoppingTip(e.target.value)}
      />

      <button onClick={save} disabled={isPending} className="btn-primary mt-2 w-full">
        {isPending ? 'Guardando...' : mealId ? 'Guardar cambios' : 'Crear comida'}
      </button>
      {!mealId && (
        <p className="mt-1 text-[11px] text-navy/40">Guarda primero para poder añadir ingredientes.</p>
      )}
    </div>
  );
}

function IngredientEditRow({
  ingredient,
  clientId,
  onUpdated,
  onRemove,
}: {
  ingredient: MealIngredient;
  clientId: string;
  onUpdated: (updated: MealIngredient) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(ingredient.name);
  const [grams, setGrams] = useState(ingredient.grams != null ? String(ingredient.grams) : '');
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!name.trim()) return;
    setError(null);
    const gramsValue = grams ? Number(grams.replace(',', '.')) : null;
    startTransition(async () => {
      const result = await updateIngredientAction(ingredient.id, clientId, name.trim(), gramsValue);
      if (result.error) {
        setError(result.error);
        return;
      }
      onUpdated({ ...ingredient, name: name.trim(), grams: gramsValue });
      setDirty(false);
    });
  };

  return (
    <div className="rounded-card bg-bg px-2 py-1 text-xs">
      <div className="flex items-center gap-1">
        <input
          className="input flex-1 py-0.5 text-xs"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDirty(true);
          }}
        />
        <input
          className="input w-14 py-0.5 text-xs"
          placeholder="g"
          value={grams}
          onChange={(e) => {
            setGrams(e.target.value);
            setDirty(true);
          }}
        />
        {dirty && (
          <button onClick={save} disabled={isPending} className="text-positive">
            ✓
          </button>
        )}
        <button onClick={onRemove} className="text-navy/40 hover:text-red-600">
          ✕
        </button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
