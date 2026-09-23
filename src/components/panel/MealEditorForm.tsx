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

export function MealEditorForm({
  clientId,
  date,
  mealType,
  meal,
}: {
  clientId: string;
  date: string;
  mealType: MealType;
  meal: MealWithIngredients;
}) {
  const [title, setTitle] = useState(meal.title);
  const [kcal, setKcal] = useState(String(meal.kcal));
  const [protein, setProtein] = useState(meal.protein_g != null ? String(meal.protein_g) : '');
  const [carbs, setCarbs] = useState(meal.carbs_g != null ? String(meal.carbs_g) : '');
  const [fat, setFat] = useState(meal.fat_g != null ? String(meal.fat_g) : '');
  const [shoppingTip, setShoppingTip] = useState(meal.shopping_tip ?? '');
  const [ingredients, setIngredients] = useState(meal.meal_ingredients);
  const [newIngredient, setNewIngredient] = useState('');
  const [newGrams, setNewGrams] = useState('');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);
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
      if (!result.error) setSaved(true);
    });
  };

  const addIngredient = () => {
    if (!newIngredient.trim()) return;
    setIngredientError(null);
    startTransition(async () => {
      const grams = newGrams ? Number(newGrams) : null;
      const result = await addIngredientAction(meal.id, clientId, newIngredient.trim(), grams);
      if (result.error) {
        setIngredientError(result.error);
        return;
      }
      setIngredients((prev) => [
        ...prev,
        { id: crypto.randomUUID(), meal_id: meal.id, name: newIngredient.trim(), grams },
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
    <div className="card p-5 sm:p-6">
      <input
        className="input text-lg"
        placeholder="Título"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setSaved(false);
        }}
      />

      <div className="mt-3 grid grid-cols-4 gap-2">
        <Field
          label="Kcal"
          value={kcal}
          onChange={(v) => {
            setKcal(v);
            setSaved(false);
          }}
        />
        <Field
          label="Proteína (g)"
          value={protein}
          onChange={(v) => {
            setProtein(v);
            setSaved(false);
          }}
        />
        <Field
          label="Carbos (g)"
          value={carbs}
          onChange={(v) => {
            setCarbs(v);
            setSaved(false);
          }}
        />
        <Field
          label="Grasa (g)"
          value={fat}
          onChange={(v) => {
            setFat(v);
            setSaved(false);
          }}
        />
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy/50">
          Ingredientes
        </h3>
        <div className="space-y-1.5">
          {ingredients.map((ing) => (
            <IngredientRow key={ing.id} ingredient={ing} clientId={clientId} onUpdated={updateIngredient} onRemove={() => removeIngredient(ing.id)} />
          ))}
          {ingredients.length === 0 && <p className="text-sm text-navy/40">Sin ingredientes todavía.</p>}
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className="input"
            placeholder="Ingrediente"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
          />
          <input
            className="input sm:w-24"
            placeholder="Gramos"
            value={newGrams}
            onChange={(e) => setNewGrams(e.target.value)}
          />
          <button onClick={addIngredient} className="btn-secondary shrink-0">
            + Añadir
          </button>
        </div>
        {ingredientError && <p className="mt-1 text-xs text-red-600">{ingredientError}</p>}
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy/50">
          Dónde comprar
        </h3>
        <textarea
          className="input min-h-[80px]"
          placeholder="Ej: Mercadona, marca Hacendado..."
          value={shoppingTip}
          onChange={(e) => {
            setShoppingTip(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button onClick={save} disabled={isPending} className="btn-primary">
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && !isPending && <span className="text-sm text-positive">Guardado</span>}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-navy/40">
        {label}
      </label>
      <input className="input py-1 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function IngredientRow({
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
    <div className="rounded-card bg-bg px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <input
          className="input flex-1 py-1 text-sm"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDirty(true);
          }}
        />
        <input
          className="input w-20 py-1 text-sm"
          placeholder="g"
          value={grams}
          onChange={(e) => {
            setGrams(e.target.value);
            setDirty(true);
          }}
        />
        {dirty && (
          <button onClick={save} disabled={isPending} className="btn-secondary py-1 text-xs">
            {isPending ? '...' : 'Guardar'}
          </button>
        )}
        <button onClick={onRemove} className="text-navy/40 hover:text-red-600">
          ✕
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
