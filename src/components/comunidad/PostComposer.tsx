'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createPostAction } from '@/app/comunidad/actions';

export function PostComposer() {
  const router = useRouter();
  const [type, setType] = useState<'recipe' | 'blog'>('recipe');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Título y texto son obligatorios.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    let imageUrl: string | null = null;
    if (file) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const path = `${user?.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('community').upload(path, file);
      if (uploadError) {
        setError('No se ha podido subir la imagen: ' + uploadError.message);
        setIsSubmitting(false);
        return;
      }
      imageUrl = supabase.storage.from('community').getPublicUrl(path).data.publicUrl;
    }

    const result = await createPostAction({
      type,
      title: title.trim(),
      content: content.trim(),
      imageUrl,
      linkUrl: linkUrl.trim() || null,
    });

    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    setTitle('');
    setContent('');
    setLinkUrl('');
    setFile(null);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="card space-y-3 p-4">
      <div className="flex gap-2">
        {(['recipe', 'blog'] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setType(t)}
            className={`rounded-card border px-3 py-1 text-xs font-semibold uppercase ${
              type === t ? 'border-navy bg-navy text-white' : 'border-line text-navy/60'
            }`}
          >
            {t === 'recipe' ? 'Receta' : 'Blog'}
          </button>
        ))}
      </div>
      <input className="input" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        className="input min-h-[80px]"
        placeholder="Cuenta la receta o la novedad, sin postureo."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <input
        className="input"
        placeholder="Enlace externo (opcional)"
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
      />
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? 'Publicando...' : 'Publicar'}
      </button>
    </form>
  );
}
