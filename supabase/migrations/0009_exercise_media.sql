-- Biblioteca de vídeos/fotos de ejercicios: Jaime los sube una vez desde su
-- perfil y los adjunta a cualquier ejercicio, de cualquier rutina o cliente.

do $$ begin
  create type exercise_media_type as enum ('video', 'image');
exception when duplicate_object then null;
end $$;

create table if not exists exercise_media (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references profiles(id) on delete cascade,
  title text not null,
  media_type exercise_media_type not null,
  url text not null,
  created_at timestamptz default now()
);

create index if not exists exercise_media_trainer_idx on exercise_media (trainer_id, created_at desc);

alter table workout_exercises add column if not exists media_id uuid references exercise_media(id) on delete set null;
alter table routine_template_exercises add column if not exists media_id uuid references exercise_media(id) on delete set null;

alter table exercise_media enable row level security;

do $$ begin
  create policy "exercise_media_select_authenticated" on exercise_media
    for select to authenticated
    using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "exercise_media_write_trainer" on exercise_media
    for all to authenticated
    using (is_trainer(auth.uid()) and trainer_id = auth.uid())
    with check (is_trainer(auth.uid()) and trainer_id = auth.uid());
exception when duplicate_object then null;
end $$;

-- El cliente sigue sin poder tocar media_id (solo Jaime adjunta el vídeo).
create or replace function restrict_exercise_client_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_trainer(auth.uid()) then
    new.workout_id := old.workout_id;
    new.name := old.name;
    new.sets_reps := old.sets_reps;
    new.recommended_weight_kg := old.recommended_weight_kg;
    new.media_id := old.media_id;
    new.sort_order := old.sort_order;
  end if;
  return new;
end;
$$;

-- Bucket de Storage para los archivos, con límite de 50MB por vídeo/foto.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-media',
  'exercise-media',
  true,
  52428800,
  array['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

do $$ begin
  create policy "public_read_exercise_media" on storage.objects
    for select using (bucket_id = 'exercise-media');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "exercise_media_write_trainer" on storage.objects
    for all to authenticated
    using (bucket_id = 'exercise-media' and is_trainer(auth.uid()))
    with check (bucket_id = 'exercise-media' and is_trainer(auth.uid()));
exception when duplicate_object then null;
end $$;
