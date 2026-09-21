'use client';

import { useState, useTransition } from 'react';
import { submitDietCommentAction } from '@/app/semana/actions';
import type { DietComment } from '@/lib/types/database.types';

export function DietCommentForm({
  weekStartISO,
  comments,
}: {
  weekStartISO: string;
  comments: DietComment[];
}) {
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(comments);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    startTransition(async () => {
      const result = await submitDietCommentAction(weekStartISO, text.trim());
      if (!result.error) {
        setItems([
          {
            id: crypto.randomUUID(),
            client_id: '',
            week_start: weekStartISO,
            comment: text.trim(),
            trainer_reply: null,
            created_at: new Date().toISOString(),
          },
          ...items,
        ]);
        setText('');
      }
    });
  };

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="space-y-2">
        <textarea
          className="input min-h-[80px]"
          placeholder="¿Has seguido la dieta esta semana? Cuéntale a Jaime lo que se te ha torcido (o lo que has bordado)."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      {items.length > 0 && (
        <div className="space-y-2 border-t border-line pt-3">
          {items.map((c) => (
            <div key={c.id} className="rounded-card bg-bg p-3 text-sm">
              <p>{c.comment}</p>
              {c.trainer_reply && (
                <p className="mt-2 border-l-2 border-accent pl-2 text-navy/70">
                  <span className="font-semibold">Jaime: </span>
                  {c.trainer_reply}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
