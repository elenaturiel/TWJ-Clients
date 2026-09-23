import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/auth/get-profile';
import { createClient } from '@/lib/supabase/server';
import { ClientAppShell } from '@/components/layout/ClientAppShell';
import { IconCart } from '@/components/icons';
import type { MealWithIngredients } from '@/app/semana/data';

const MEAL_LABEL: Record<string, string> = {
  desayuno: 'Desayuno',
  snack1: 'Snack 1',
  comida: 'Comida',
  snack2: 'Snack 2',
  cena: 'Cena',
};

export default async function MealDetailPage({ params }: { params: { mealId: string } }) {
  const profile = await requireProfile('client');
  const supabase = createClient();

  const { data: meal } = await supabase
    .from('meals')
    .select('*, meal_ingredients(*)')
    .eq('id', params.mealId)
    .eq('client_id', profile.id)
    .maybeSingle();

  if (!meal) notFound();

  const typed = meal as MealWithIngredients;
  const date = new Date(typed.date + 'T00:00:00');

  return (
    <ClientAppShell fullName={profile.full_name}>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link href="/semana" className="text-sm font-semibold text-accent">
          ← Volver a tu semana
        </Link>

        <div className="card mt-4 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
            {MEAL_LABEL[typed.meal_type] ?? typed.meal_type} ·{' '}
            {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-1 text-3xl">{typed.title}</h1>

          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span className="font-semibold">{typed.kcal} kcal</span>
            {typed.protein_g != null && <span className="text-navy/60">Proteína {typed.protein_g}g</span>}
            {typed.carbs_g != null && <span className="text-navy/60">Carbohidratos {typed.carbs_g}g</span>}
            {typed.fat_g != null && <span className="text-navy/60">Grasa {typed.fat_g}g</span>}
          </div>

          <ul className="mt-5 divide-y divide-line">
            {typed.meal_ingredients.length === 0 && (
              <li className="py-3 text-sm text-navy/40">Todavía no hay ingredientes.</li>
            )}
            {typed.meal_ingredients.map((ing) => (
              <li key={ing.id} className="flex items-center justify-between py-3 text-sm">
                <span>{ing.name}</span>
                {ing.grams != null && <span className="font-semibold text-navy/60">{ing.grams}g</span>}
              </li>
            ))}
          </ul>

          {typed.shopping_tip && (
            <div className="mt-5 flex items-start gap-2 rounded-card bg-bg p-3 text-sm text-navy/70">
              <IconCart className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{typed.shopping_tip}</span>
            </div>
          )}
        </div>
      </div>
    </ClientAppShell>
  );
}
