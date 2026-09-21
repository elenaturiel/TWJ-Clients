const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const DAY_LABELS_FULL = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Lunes de la semana que contiene `date` (por defecto hoy). */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 domingo .. 6 sábado
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function weekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function dayLabel(date: Date): string {
  const day = date.getDay();
  return DAY_LABELS[day === 0 ? 6 : day - 1];
}

export function dayLabelFull(date: Date): string {
  const day = date.getDay();
  return DAY_LABELS_FULL[day === 0 ? 6 : day - 1];
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  if (sameMonth) {
    return `${weekStart.getDate()} – ${weekEnd.getDate()} de ${MONTHS[weekEnd.getMonth()]}`;
  }
  return `${weekStart.getDate()} de ${MONTHS[weekStart.getMonth()]} – ${weekEnd.getDate()} de ${MONTHS[weekEnd.getMonth()]}`;
}
