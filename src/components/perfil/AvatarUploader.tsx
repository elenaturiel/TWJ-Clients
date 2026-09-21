'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AvatarUploader({
  userId,
  fullName,
  avatarUrl,
}: {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(avatarUrl);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const supabase = createClient();
    const path = `${userId}/avatar-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file);

    if (!uploadError) {
      const publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
      setPreview(publicUrl);
      router.refresh();
    }

    setIsUploading(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-24 w-24 overflow-hidden rounded-full bg-navy/10"
      >
        {preview ? (
          <Image src={preview} alt={fullName} fill className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-navy/40">
            {fullName.slice(0, 2).toUpperCase()}
          </span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-semibold text-accent">
        {isUploading ? 'Subiendo...' : 'Cambiar foto'}
      </button>
    </div>
  );
}
