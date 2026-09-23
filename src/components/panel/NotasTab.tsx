'use client';

import { useState, useTransition } from 'react';
import { replyDietCommentAction, sendTrainerQnaMessageAction } from '@/app/panel/[clientId]/actions';
import { QnaChat } from '@/components/QnaChat';
import type { DietComment, QnaMessage } from '@/lib/types/database.types';

export function NotasTab({
  clientId,
  dietComments,
  qnaMessages,
}: {
  clientId: string;
  dietComments: DietComment[];
  qnaMessages: QnaMessage[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy/60">
          Dudas del cliente
        </h3>
        <QnaChat
          clientId={clientId}
          initialMessages={qnaMessages}
          sendAction={(message) => sendTrainerQnaMessageAction(clientId, message)}
          currentSender="trainer"
        />
      </div>

      <div className="card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy/60">
          Comentarios de dieta
        </h3>
        {dietComments.length === 0 ? (
          <p className="text-sm text-navy/50">Sin comentarios todavía.</p>
        ) : (
          <div className="space-y-3">
            {dietComments.map((c) => (
              <DietCommentItem key={c.id} clientId={clientId} comment={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DietCommentItem({ clientId, comment }: { clientId: string; comment: DietComment }) {
  const [reply, setReply] = useState(comment.trainer_reply ?? '');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(!!comment.trainer_reply);

  const save = () => {
    startTransition(async () => {
      await replyDietCommentAction(comment.id, clientId, reply);
      setSaved(true);
    });
  };

  return (
    <div className="rounded-card bg-bg p-3 text-sm">
      <p className="text-xs text-navy/40">Semana del {comment.week_start}</p>
      <p className="mt-1">{comment.comment}</p>
      <textarea
        className="input mt-2 min-h-[50px] text-sm"
        placeholder="Responder..."
        value={reply}
        onChange={(e) => {
          setReply(e.target.value);
          setSaved(false);
        }}
      />
      <button onClick={save} disabled={isPending} className="btn-secondary mt-1 text-xs">
        {isPending ? 'Guardando...' : 'Responder'}
      </button>
      {saved && <span className="ml-2 text-xs text-positive">Guardado</span>}
    </div>
  );
}
