import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MealEditorForm } from '@/components/panel/MealEditorForm';
import type { MealWithIngredients } from '@/app/panel/[clientId]/data';

const MEAL_LABEL: Record<string, string> = {
  desayuno: 'Desayuno',
  snack1: 'Snack 1',
  comida: 'Comida',
  snack2: 'Snack 2',
  cena: 'Cena',
};

export default async function MealEditPage({
  params,
}: {
  params: { clientId: string; mealId: string };
}) {
  const supabase = createClient();

  const [{ data: meal }, { data: client }] = await Promise.all([
    supabase
      .from('meals')
      .select('*, meal_ingredients(*)')
      .eq('id', params.mealId)
      .eq('client_id', params.clientId)
      .maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', params.clientId).single(),
  ]);

  if (!meal) notFound();

  const typed = meal as MealWithIngredients;
  const date = new Date(typed.date + 'T00:00:00');

  return (
    <div>
      <Link href={`/panel/${params.clientId}?tab=menu`} className="text-sm font-semibold text-accent">
        ← Volver al menú de {client?.full_name ?? 'este cliente'}
      </Link>
      <h1 className="mb-4 mt-2 text-2xl">
        {MEAL_LABEL[typed.meal_type] ?? typed.meal_type} ·{' '}
        {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </h1>

      <div className="max-w-2xl">
        <MealEditorForm clientId={params.clientId} date={typed.date} mealType={typed.meal_type} meal={typed} />
      </div>
    </div>
  );
}
