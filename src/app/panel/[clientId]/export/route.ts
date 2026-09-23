import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { requireProfile } from '@/lib/auth/get-profile';
import { createClient } from '@/lib/supabase/server';
import { dayLabelFull } from '@/lib/utils/date';
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

const PLAN_LABEL: Record<string, string> = { rookie: 'Rookie', all_in: 'All In', peak: 'Peak' };

const NAVY = 'FF081A33';
const LINE = 'FFE7EBF2';

function styleHeaderRow(sheet: ExcelJS.Worksheet) {
  const row = sheet.getRow(1);
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: NAVY } } };
  });
  row.height = 20;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
}

function borderAllRows(sheet: ExcelJS.Worksheet) {
  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        ...cell.border,
        bottom: { style: 'hair', color: { argb: LINE } },
      };
      if (rowNumber > 1) cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });
}

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
    supabase.from('profiles').select('*').eq('id', params.clientId).single(),
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
  const typedWeightLogs = weightLogs ?? [];

  const totalWorkouts = typedWorkouts.length;
  const doneWorkouts = typedWorkouts.filter((w) => w.status === 'done').length;
  const adherencePct = totalWorkouts > 0 ? Math.round((doneWorkouts / totalWorkouts) * 100) : null;
  const firstWeight = typedWeightLogs[0]?.weight_kg ?? null;
  const lastWeight = typedWeightLogs[typedWeightLogs.length - 1]?.weight_kg ?? null;
  const weightChange = firstWeight != null && lastWeight != null ? Math.round((lastWeight - firstWeight) * 10) / 10 : null;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Train with Jaime';
  workbook.created = new Date();

  // ===== RESUMEN =====
  const resumenSheet = workbook.addWorksheet('Resumen');
  resumenSheet.columns = [
    { header: 'Dato', key: 'campo', width: 26 },
    { header: 'Valor', key: 'valor', width: 30 },
  ];
  resumenSheet.addRows([
    { campo: 'Nombre', valor: client.full_name },
    { campo: 'Plan', valor: client.plan ? PLAN_LABEL[client.plan] : 'Sin plan' },
    { campo: 'Cliente desde', valor: client.client_since ?? '—' },
    { campo: 'Teléfono', valor: client.phone ?? '—' },
    { campo: 'Peso inicial (kg)', valor: firstWeight ?? '—' },
    { campo: 'Peso actual (kg)', valor: lastWeight ?? '—' },
    { campo: 'Cambio de peso (kg)', valor: weightChange ?? '—' },
    { campo: 'Entrenos registrados', valor: totalWorkouts },
    { campo: 'Entrenos completados', valor: doneWorkouts },
    { campo: 'Adherencia', valor: adherencePct != null ? `${adherencePct}%` : '—' },
    { campo: 'Informe generado', valor: new Date().toLocaleDateString('es-ES') },
  ]);
  resumenSheet.getColumn('campo').font = { bold: true };
  styleHeaderRow(resumenSheet);
  borderAllRows(resumenSheet);

  // ===== PESO =====
  const pesoSheet = workbook.addWorksheet('Peso');
  pesoSheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Peso (kg)', key: 'peso', width: 12 },
  ];
  for (const log of typedWeightLogs) {
    pesoSheet.addRow({ fecha: log.logged_at, peso: log.weight_kg });
  }
  pesoSheet.getColumn('peso').numFmt = '0.0';
  styleHeaderRow(pesoSheet);
  borderAllRows(pesoSheet);

  // ===== ENTRENOS (uno por fila; los ejercicios van en su propia hoja) =====
  const entrenosSheet = workbook.addWorksheet('Entrenos');
  entrenosSheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Día', key: 'dia', width: 12 },
    { header: 'Entreno', key: 'titulo', width: 24 },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Sensación (1-10)', key: 'sensacion', width: 16 },
    { header: 'Nº ejercicios', key: 'numEjercicios', width: 12 },
    { header: 'Comentario de Jaime', key: 'comentario', width: 40 },
  ];
  for (const w of typedWorkouts) {
    entrenosSheet.addRow({
      fecha: w.date,
      dia: dayLabelFull(new Date(w.date + 'T00:00:00')),
      titulo: w.title,
      estado: STATUS_LABEL[w.status] ?? w.status,
      sensacion: w.client_rating ?? '',
      numEjercicios: w.workout_exercises.length,
      comentario: w.trainer_comment ?? '',
    });
  }
  styleHeaderRow(entrenosSheet);
  borderAllRows(entrenosSheet);

  // ===== EJERCICIOS (recomendado vs. real, por entreno) =====
  const ejerciciosSheet = workbook.addWorksheet('Ejercicios');
  ejerciciosSheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Entreno', key: 'entreno', width: 22 },
    { header: 'Ejercicio', key: 'ejercicio', width: 22 },
    { header: 'Series x reps recomendadas', key: 'setsRepsRec', width: 22 },
    { header: 'Peso recomendado (kg)', key: 'pesoRec', width: 18 },
    { header: 'Series x reps reales', key: 'setsRepsReal', width: 20 },
    { header: 'Peso real (kg)', key: 'pesoReal', width: 16 },
  ];
  for (const w of typedWorkouts) {
    const exercises = [...w.workout_exercises].sort((a, b) => a.sort_order - b.sort_order);
    for (const ex of exercises) {
      ejerciciosSheet.addRow({
        fecha: w.date,
        entreno: w.title,
        ejercicio: ex.name,
        setsRepsRec: ex.sets_reps ?? '',
        pesoRec: ex.recommended_weight_kg ?? '',
        setsRepsReal: ex.actual_sets_reps ?? '',
        pesoReal: ex.actual_weight_kg ?? '',
      });
    }
  }
  ejerciciosSheet.getColumn('pesoRec').numFmt = '0.0';
  ejerciciosSheet.getColumn('pesoReal').numFmt = '0.0';
  styleHeaderRow(ejerciciosSheet);
  borderAllRows(ejerciciosSheet);

  // ===== COMIDAS =====
  const comidasSheet = workbook.addWorksheet('Comidas');
  comidasSheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Día', key: 'dia', width: 12 },
    { header: 'Comida', key: 'comida', width: 12 },
    { header: 'Título', key: 'titulo', width: 24 },
    { header: 'Kcal', key: 'kcal', width: 8 },
    { header: 'Proteína (g)', key: 'proteina', width: 12 },
    { header: 'Carbohidratos (g)', key: 'carbos', width: 16 },
    { header: 'Grasa (g)', key: 'grasa', width: 10 },
    { header: 'Ingredientes', key: 'ingredientes', width: 45 },
    { header: 'Dónde comprar', key: 'compra', width: 30 },
  ];
  for (const m of typedMeals) {
    const ingredients = m.meal_ingredients
      .map((i) => (i.grams != null ? `${i.name} (${i.grams}g)` : i.name))
      .join(', ');
    comidasSheet.addRow({
      fecha: m.date,
      dia: dayLabelFull(new Date(m.date + 'T00:00:00')),
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
  styleHeaderRow(comidasSheet);
  borderAllRows(comidasSheet);

  // ===== SENSACIÓN SEMANAL =====
  const animoSheet = workbook.addWorksheet('Sensación semanal');
  animoSheet.columns = [
    { header: 'Semana', key: 'semana', width: 14 },
    { header: 'Sensación (1-5)', key: 'sensacion', width: 16 },
  ];
  for (const m of moodLogs ?? []) {
    animoSheet.addRow({ semana: m.week_start, sensacion: m.mood_score });
  }
  styleHeaderRow(animoSheet);
  borderAllRows(animoSheet);

  // ===== COMENTARIOS DE DIETA =====
  const dietaSheet = workbook.addWorksheet('Comentarios de dieta');
  dietaSheet.columns = [
    { header: 'Semana', key: 'semana', width: 14 },
    { header: 'Comentario del cliente', key: 'comentario', width: 45 },
    { header: 'Respuesta de Jaime', key: 'respuesta', width: 45 },
  ];
  for (const c of dietComments ?? []) {
    dietaSheet.addRow({ semana: c.week_start, comentario: c.comment, respuesta: c.trainer_reply ?? '' });
  }
  styleHeaderRow(dietaSheet);
  borderAllRows(dietaSheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `${client.full_name.replace(/[^a-z0-9]+/gi, '_')}_train_with_jaime.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
