'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { WeightLog } from '@/lib/types/database.types';

export function WeightChart({ logs }: { logs: WeightLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-card border border-dashed border-line text-sm text-navy/50">
        Registra tu peso para empezar a ver tu evolución.
      </div>
    );
  }

  const data = logs.map((l) => ({
    date: new Date(l.logged_at + 'T00:00:00').toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
    }),
    kg: l.weight_kg,
  }));

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#E7EBF2" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#081A33aa' }} axisLine={false} tickLine={false} />
          <YAxis
            domain={['dataMin - 1', 'dataMax + 1']}
            tick={{ fontSize: 11, fill: '#081A33aa' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, borderColor: '#E7EBF2', fontSize: 12 }}
            formatter={(value: number) => [`${value} kg`, 'Peso']}
          />
          <Line type="monotone" dataKey="kg" stroke="#3E8EF0" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
