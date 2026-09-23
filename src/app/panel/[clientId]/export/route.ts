import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { requireProfile } from '@/lib/auth/get-profile';
import { createClient } from '@/lib/supabase/server';
import type { WorkoutWithExercises, MealWithIngredients } from '@/app/panel/[clientId]/data';

const MEAL_LABEL: Record<string, string> = {
  desayuno: 'Desayuno',
  snack1: 'Snack 1',
  comida: 'Comida',
  snack2: 'Snack 2',
  cena: 'Cena',
};

const STATUS_LABEL: Record<string, string> = {
  done: 'Hecho',
  today: 'Hoy',
  pending: 'Pendiente',
};

export async function GET(_request: Request, { params }: { params: { clientId: string } }) {
  await requireProfile('trainer');
  const supabase = createClient();

  const [
    { data: client },
    { data: weightLogs },
    { data: workouts },
    { data: meals },
    { data: moodLogs },
    { data: dietComments },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', params.clientId).single(),
    supabase
      .from('weight_logs')
      .select('*')
      .eq('client_id', params.clientId)
      .order('logged_at', { ascending: true }),
    supabase
      .from('workouts')
      .select('*, workout_exercises(*)')
      .eq('client_id', params.clientId)
      .order('date', { ascending: true }),
    supabase
      .from('meals')
      .select('*, meal_ingredients(*)')
      .eq('client_id', params.clientId)
      .order('date', { ascending: true }),
    supabase
      .from('mood_logs')
      .select('*')
      .eq('client_id', params.clientId)
      .order('week_start', { ascending: true }),
    supabase
      .from('diet_comments')
      .select('*')
      .eq('client_id', params.clientId)
      .order('week_start', { ascending: true }),
  ]);

  if (!client) {
    return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
  }

  const typedWorkouts = (workouts as WorkoutWithExercises[] | null) ?? [];
  const typedMeals = (meals as MealWithIngredients[] | null) ?? [];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Train with Jaime';
  workbook.created = new Date();

  const pesoSheet = workbook.addWorksheet('Peso');
  pesoSheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Peso (kg)', key: 'peso', width: 12 },
  ];
  for (const log of weightLogs ?? []) {
    pesoSheet.addRow({ fecha: log.logged_at, peso: log.weight_kg });
  }

  const entrenosSheet = workbook.addWorksheet('Entrenos');
  entrenosSheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Día', key: 'dia', width: 8 },
    { header: 'Título', key: 'titulo', width: 22 },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Cómo se sintió (1-10)', key: 'sensacion', width: 18 },
    { header: 'Ejercicio', key: 'ejercicio', width: 22 },
    { header: 'Series x reps (recomendado)', key: 'setsRepsRec', width: 22 },
    { header: 'Peso recomendado (kg)', key: 'pesoRec', width: 18 },
    { header: 'Series x reps (real)', key: 'setsRepsReal', width: 20 },
    { header: 'Peso real (kg)', key: 'pesoReal', width: 14 },
    { header: 'Comentario de Jaime', key: 'comentario', width: 30 },
  ];
  for (const w of typedWorkouts) {
    const exercises = [...w.workout_exercises].sort((a, b) => a.sort_order - b.sort_order);
    if (exercises.length === 0) {
      entrenosSheet.addRow({
        fecha: w.date,
        dia: w.day_label,
        titulo: w.title,
        estado: STATUS_LABEL[w.status] ?? w.status,
        sensacion: w.client_rating ?? '',
        ejercicio: '',
        setsRepsRec: '',
        pesoRec: '',
        setsRepsReal: '',
        pesoReal: '',
        comentario: w.trainer_comment ?? '',
      });
      continue;
    }
    for (const ex of exercises) {
      entrenosSheet.addRow({
        fecha: w.date,
        dia: w.day_label,
        titulo: w.title,
        estado: STATUS_LABEL[w.status] ?? w.status,
        sensacion: w.client_rating ?? '',
        ejercicio: ex.name,
        setsRepsRec: ex.sets_reps ?? '',
        pesoRec: ex.recommended_weight_kg ?? '',
        setsRepsReal: ex.actual_sets_reps ?? '',
        pesoReal: ex.actual_weight_kg ?? '',
        comentario: w.trainer_comment ?? '',
      });
    }
  }

  const comidasSheet = workbook.addWorksheet('Comidas');
  comidasSheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Comida', key: 'comida', width: 12 },
    { header: 'Título', key: 'titulo', width: 22 },
    { header: 'Kcal', key: 'kcal', width: 8 },
    { header: 'Proteína (g)', key: 'proteina', width: 12 },
    { header: 'Carbohidratos (g)', key: 'carbos', width: 16 },
    { header: 'Grasa (g)', key: 'grasa', width: 10 },
    { header: 'Ingredientes', key: 'ingredientes', width: 40 },
    { header: 'Dónde comprar', key: 'compra', width: 30 },
  ];
  for (const m of typedMeals) {
    const ingredients = m.meal_ingredients
      .map((i) => (i.grams != null ? `${i.name} (${i.grams}g)` : i.name))
      .join(', ');
    comidasSheet.addRow({
      fecha: m.date,
      comida: MEAL_LABEL[m.meal_type] ?? m.meal_type,
      titulo: m.title,
      kcal: m.kcal,
      proteina: m.protein_g ?? '',
      carbos: m.carbs_g ?? '',
      grasa: m.fat_g ?? '',
      ingredientes: ingredients,
      compra: m.shopping_tip ?? '',
    });
  }

  const animoSheet = workbook.addWorksheet('Sensación semanal');
  animoSheet.columns = [
    { header: 'Semana', key: 'semana', width: 14 },
    { header: 'Sensación (1-5)', key: 'sensacion', width: 16 },
  ];
  for (const m of moodLogs ?? []) {
    animoSheet.addRow({ semana: m.week_start, sensacion: m.mood_score });
  }

  const dietaSheet = workbook.addWorksheet('Comentarios de dieta');
  dietaSheet.columns = [
    { header: 'Semana', key: 'semana', width: 14 },
    { header: 'Comentario del cliente', key: 'comentario', width: 40 },
    { header: 'Respuesta de Jaime', key: 'respuesta', width: 40 },
  ];
  for (const c of dietComments ?? []) {
    dietaSheet.addRow({ semana: c.week_start, comentario: c.comment, respuesta: c.trainer_reply ?? '' });
  }

  for (const sheet of workbook.worksheets) {
    sheet.getRow(1).font = { bold: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `${client.full_name.replace(/[^a-z0-9]+/gi, '_')}_train_with_jaime.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
