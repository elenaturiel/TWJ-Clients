'use client';

import Image from 'next/image';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createExerciseMediaAction, deleteExerciseMediaAction } from '@/app/perfil/ejercicios/actions';
import type { ExerciseMedia, ExerciseMediaType } from '@/lib/types/database.types';

export function ExerciseMediaManager({ media }: { media: ExerciseMedia[] }) {
  const [items, setItems] = useState(media);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      setError('Ponle un título y elige un archivo.');
      return;
    }

    setIsUploading(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Sesión no válida.');
      setIsUploading(false);
      return;
    }

    const mediaType: ExerciseMediaType = file.type.startsWith('video') ? 'video' : 'image';
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('exercise-media').upload(path, file);
    if (uploadError) {
      setError('No se ha podido subir el archivo: ' + uploadError.message);
      setIsUploading(false);
      return;
    }

    const publicUrl = supabase.storage.from('exercise-media').getPublicUrl(path).data.publicUrl;
    const result = await createExerciseMediaAction(title.trim(), mediaType, publicUrl);

    setIsUploading(false);
    if (result.error || !result.media) {
      setError(result.error ?? 'No se ha podido guardar.');
      return;
    }

    setItems((prev) => [result.media as ExerciseMedia, ...prev]);
    setTitle('');
    setFile(null);
    (e.target as HTMLFormElement).reset();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Borrar este vídeo/foto? Los ejercicios que lo tengan adjunto se quedarán sin él.')) return;
    const result = await deleteExerciseMediaAction(id);
    if (result.error) {
      setError(result.error);
      return;
    }
    setItems((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={upload} className="card space-y-3 p-4">
        <div>
          <label className="mb-1 block text-sm font-semibold">Título</label>
          <input
            className="input"
            placeholder="Ej: Sentadilla — técnica"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Vídeo o foto</label>
          <input
            type="file"
            accept="video/*,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isUploading} className="btn-primary">
          {isUploading ? 'Subiendo...' : '+ Subir'}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="card p-4 text-sm text-navy/50">
          Todavía no has subido ningún vídeo o foto explicativa.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <div key={m.id} className="card overflow-hidden p-3">
              {m.media_type === 'video' ? (
                <video src={m.url} controls className="aspect-video w-full rounded-card bg-bg object-cover" />
              ) : (
                <div className="relative aspect-video w-full overflow-hidden rounded-card bg-bg">
                  <Image src={m.url} alt={m.title} fill className="object-cover" />
                </div>
              )}
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{m.title}</p>
                <button onClick={() => remove(m.id)} className="shrink-0 text-xs text-navy/40 hover:text-red-600">
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
