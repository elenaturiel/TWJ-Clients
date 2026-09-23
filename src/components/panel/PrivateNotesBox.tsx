'use client';

import { useState, useTransition } from 'react';
import { savePrivateNoteAction } from '@/app/panel/[clientId]/actions';

export function PrivateNotesBox({ clientId, initialNote }: { clientId: string; initialNote: string }) {
  const [note, setNote] = useState(initialNote);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);

  const onSave = () => {
    startTransition(async () => {
      await savePrivateNoteAction(clientId, note);
      setSaved(true);
    });
  };

  return (
    <div className="card border-amber/30 bg-amber/5 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-navy/60">
        Notas privadas (solo tú las ves)
      </h3>
      <textarea
        className="input mt-2 min-h-[80px]"
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        placeholder="Ej: le cuesta la sentadilla profunda, vigilar rodilla derecha..."
      />
      <div className="mt-2 flex items-center gap-3">
        <button onClick={onSave} disabled={isPending} className="btn-secondary">
          {isPending ? 'Guardando...' : 'Guardar nota'}
        </button>
        {saved && <span className="text-xs text-positive">Guardado</span>}
      </div>
    </div>
  );
}
