'use client';

import { useState, useTransition } from 'react';
import { logWeightAction } from '@/app/semana/actions';

export function WeightForm() {
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const kg = Number(value.replace(',', '.'));
    if (!kg || kg <= 0) {
      setMessage('Pon un peso válido.');
      return;
    }
    startTransition(async () => {
      const result = await logWeightAction(kg);
      setMessage(result.error ? result.error : 'Peso registrado.');
      if (!result.error) setValue('');
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-semibold text-navy/60">Peso de hoy (kg)</label>
        <input
          className="input"
          inputMode="decimal"
          placeholder="72.5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? '...' : 'Registrar'}
      </button>
      {message && <p className="ml-2 text-xs text-navy/60">{message}</p>}
    </form>
  );
}
