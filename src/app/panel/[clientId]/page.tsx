import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClientDetail } from '../data';
import { getClientWeekData } from './data';
import { PrivateNotesBox } from '@/components/panel/PrivateNotesBox';
import { EntrenosTab } from '@/components/panel/EntrenosTab';
import { MenuTab } from '@/components/panel/MenuTab';
import { NotasTab } from '@/components/panel/NotasTab';
import { startOfWeek, weekDates, toISODate, dayLabel } from '@/lib/utils/date';

const PLAN_LABEL: Record<string, string> = { rookie: 'Rookie', all_in: 'All In', peak: 'Peak' };
const TABS = [
  { key: 'entrenos', label: 'Entrenos' },
  { key: 'menu', label: 'Menú' },
  { key: 'notas', label: 'Notas y dudas' },
];

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams: { tab?: string };
}) {
  const detail = await getClientDetail(params.clientId);
  if (!detail) notFound();

  const weekData = await getClientWeekData(params.clientId);
  const days = weekDates(startOfWeek()).map((d) => ({ iso: toISODate(d), label: dayLabel(d) }));
  const workoutsByDate = new Map(weekData.workouts.map((w) => [w.date, w]));

  const tab = TABS.some((t) => t.key === searchParams.tab) ? searchParams.tab! : 'entrenos';

  return (
    <div>
      <div className="card mb-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-accent/15">
              {detail.profile.avatar_url ? (
                <Image
                  src={detail.profile.avatar_url}
                  alt={detail.profile.full_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-accent">
                  {detail.profile.full_name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl">{detail.profile.full_name}</h1>
              <p className="text-sm text-navy/60">
                {detail.profile.plan ? PLAN_LABEL[detail.profile.plan] : 'Sin plan'} · Cliente desde{' '}
                {detail.profile.client_since ?? '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-6 text-sm">
              <Metric label="Adherencia" value={detail.adherencePct !== null ? `${detail.adherencePct}%` : '—'} />
              <Metric label="Último peso" value={detail.lastWeight !== null ? `${detail.lastWeight} kg` : '—'} />
            </div>
            <a href={`/panel/${params.clientId}/export`} className="btn-secondary text-xs">
              Exportar a Excel
            </a>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <PrivateNotesBox clientId={params.clientId} initialNote={detail.privateNote?.note ?? ''} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/panel/${params.clientId}?tab=${t.key}`}
            className={`border-b-2 px-3 py-2 text-sm font-semibold ${
              tab === t.key ? 'border-navy text-navy' : 'border-transparent text-navy/50'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'entrenos' && (
        <EntrenosTab
          clientId={params.clientId}
          days={days.map((d) => ({ ...d, workout: workoutsByDate.get(d.iso) }))}
        />
      )}

      {tab === 'menu' && <MenuTab clientId={params.clientId} days={days} meals={weekData.meals} />}

      {tab === 'notas' && (
        <NotasTab
          clientId={params.clientId}
          dietComments={weekData.dietComments}
          qnaMessages={weekData.qnaMessages}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-lg font-display">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-navy/40">{label}</div>
    </div>
  );
}
