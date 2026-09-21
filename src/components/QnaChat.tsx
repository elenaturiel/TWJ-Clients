'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { IconSend } from '@/components/icons';
import type { QnaMessage } from '@/lib/types/database.types';

export function QnaChat({
  clientId,
  initialMessages,
  sendAction,
  currentSender,
}: {
  clientId: string;
  initialMessages: QnaMessage[];
  sendAction: (message: string) => Promise<{ error: string | null }>;
  currentSender: 'client' | 'trainer';
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`qna-${clientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'qna_messages', filter: `client_id=eq.${clientId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as QnaMessage).id)) return prev;
            return [...prev, payload.new as QnaMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const value = text.trim();
    setText('');
    startTransition(async () => {
      await sendAction(value);
    });
  };

  return (
    <div className="flex h-72 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-navy/50">Aún no hay mensajes. Escribe tu primera duda.</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-card px-3 py-2 text-sm ${
              m.sender === currentSender
                ? 'ml-auto bg-navy text-white'
                : 'bg-bg text-navy'
            }`}
          >
            {m.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          className="input"
          placeholder="Escribe tu duda para Jaime..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={isPending} className="btn-primary px-3">
          <IconSend className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
