-- Buckets de Supabase Storage para avatares, medallas de retos y fotos de
-- comunidad (recetas/blog). Todos públicos en lectura (son imágenes que se
-- muestran en la app); la escritura queda restringida por rol via RLS.

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('badges', 'badges', true),
  ('community', 'community', true)
on conflict (id) do nothing;

-- Lectura pública de las tres carpetas
do $$ begin
  create policy "public_read_avatars" on storage.objects
    for select using (bucket_id = 'avatars');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "public_read_badges" on storage.objects
    for select using (bucket_id = 'badges');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "public_read_community" on storage.objects
    for select using (bucket_id = 'community');
exception when duplicate_object then null;
end $$;

-- Cada usuario autenticado puede subir/actualizar/borrar su propio avatar,
-- guardado bajo una carpeta con su propio uid: avatars/<uid>/foto.jpg
do $$ begin
  create policy "avatar_write_own" on storage.objects
    for all to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null;
end $$;

-- Solo Jaime sube medallas de retos y fotos de recetas/blog
do $$ begin
  create policy "badges_write_trainer" on storage.objects
    for all to authenticated
    using (bucket_id = 'badges' and is_trainer(auth.uid()))
    with check (bucket_id = 'badges' and is_trainer(auth.uid()));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "community_write_trainer" on storage.objects
    for all to authenticated
    using (bucket_id = 'community' and is_trainer(auth.uid()))
    with check (bucket_id = 'community' and is_trainer(auth.uid()));
exception when duplicate_object then null;
end $$;
