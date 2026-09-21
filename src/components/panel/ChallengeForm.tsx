'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function ChallengeForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalLabel, setGoalLabel] = useState('');
  const [badgeName, setBadgeName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [badgeFile, setBadgeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !badgeName.trim() || !badgeFile) {
      setError('Título, nombre de la medalla e imagen son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Sesión no válida.');
      setIsSubmitting(false);
      return;
    }

    const path = `${user.id}/${Date.now()}-${badgeFile.name}`;
    const { error: uploadError } = await supabase.storage.from('badges').upload(path, badgeFile);
    if (uploadError) {
      setError('No se ha podido subir la imagen: ' + uploadError.message);
      setIsSubmitting(false);
      return;
    }

    const { data: publicUrl } = supabase.storage.from('badges').getPublicUrl(path);

    const { error: insertError } = await supabase.from('challenges').insert({
      title: title.trim(),
      description: description.trim() || null,
      goal_label: goalLabel.trim() || null,
      badge_name: badgeName.trim(),
      badge_image_url: publicUrl.publicUrl,
      status: 'active',
      created_by: user.id,
      starts_at: startsAt || null,
      ends_at: endsAt || null,
    });

    setIsSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push('/comunidad');
  };

  return (
    <form onSubmit={onSubmit} className="card max-w-lg space-y-4 p-6">
      <div>
        <label className="mb-1 block text-sm font-semibold">Título del reto</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Descripción</label>
        <textarea className="input min-h-[70px]" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Objetivo (ej: &quot;5 días&quot;, &quot;2000m remo&quot;)</label>
        <input className="input" value={goalLabel} onChange={(e) => setGoalLabel(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-semibold">Empieza</label>
          <input type="date" className="input" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Termina</label>
          <input type="date" className="input" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Nombre de la medalla</label>
        <input
          className="input"
          placeholder="Ej: Constancia de hierro"
          value={badgeName}
          onChange={(e) => setBadgeName(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Imagen de la medalla</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBadgeFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? 'Creando reto...' : 'Publicar reto'}
      </button>
    </form>
  );
}
