-- Train with Jaime — esquema inicial + Row Level Security
-- Ejecutar tal cual en el SQL Editor de Supabase (o vía `supabase db push`).

-- =========================================================================
-- TIPOS
-- =========================================================================
create type user_role as enum ('client', 'trainer');
create type plan_type as enum ('rookie', 'all_in', 'peak');
create type workout_status as enum ('pending', 'done', 'today');
create type sender_role as enum ('client', 'trainer');
create type meal_type as enum ('desayuno', 'snack1', 'comida', 'snack2', 'cena');
create type challenge_status as enum ('active', 'closed');
create type post_type as enum ('recipe', 'blog', 'achievement');

-- =========================================================================
-- TABLAS
-- =========================================================================

-- PERFILES (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  full_name text not null,
  avatar_url text,
  plan plan_type,
  phone text,
  client_since date default now(),
  created_at timestamptz default now()
);

-- ENTRENOS
create table workouts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  created_by uuid references profiles(id), -- Jaime
  date date not null,
  day_label text not null, -- 'LUN', 'MAR'...
  title text not null,
  status workout_status default 'pending',
  trainer_comment text, -- visible para el cliente
  client_rating int check (client_rating between 1 and 10),
  created_at timestamptz default now()
);

create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts(id) on delete cascade,
  name text not null,
  sets_reps text, -- recomendado por Jaime, ej. '4x8'
  recommended_weight_kg numeric(6,2), -- recomendado por Jaime
  actual_sets_reps text, -- lo que el cliente hizo de verdad
  actual_weight_kg numeric(6,2), -- lo que el cliente levantó de verdad
  sort_order bigint default 0 -- se rellena con Date.now() desde la app
);

-- RUTINAS ESTÁNDAR (plantillas de Jaime, reutilizables entre clientes)
create table routine_templates (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references profiles(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);

create table routine_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references routine_templates(id) on delete cascade,
  name text not null,
  sets_reps text,
  recommended_weight_kg numeric(6,2),
  sort_order bigint default 0
);

-- PROGRESO
create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  logged_at date default now(),
  weight_kg numeric(5,2) not null
);

create table mood_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  week_start date not null,
  mood_score int check (mood_score between 1 and 5)
);

-- NOTAS PRIVADAS DE JAIME (nunca visibles para el cliente)
create table trainer_private_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  trainer_id uuid references profiles(id),
  note text,
  updated_at timestamptz default now()
);

-- DUDAS (chat cliente <-> Jaime)
create table qna_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  sender sender_role not null,
  message text not null,
  created_at timestamptz default now()
);

-- ALIMENTACIÓN
create table meals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  created_by uuid references profiles(id),
  date date not null,
  meal_type meal_type not null,
  title text not null,
  kcal int not null,
  protein_g numeric(5,1),
  carbs_g numeric(5,1),
  fat_g numeric(5,1),
  shopping_tip text -- sugerencia de dónde comprar, editable por Jaime
);

create table meal_ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid references meals(id) on delete cascade,
  name text not null,
  grams numeric(6,1)
);

create table diet_comments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  week_start date not null,
  comment text not null,
  trainer_reply text,
  created_at timestamptz default now()
);

-- El cliente marca un día como "menú seguido"; una fila por cliente y día.
create table meal_day_completions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  date date not null,
  completed_at timestamptz default now(),
  unique (client_id, date)
);

-- COMUNIDAD Y RETOS
create table challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  goal_label text, -- ej. '5 días', '2000m remo'
  badge_name text not null,
  badge_image_url text not null,
  status challenge_status default 'active',
  created_by uuid references profiles(id), -- siempre Jaime
  starts_at date,
  ends_at date,
  created_at timestamptz default now()
);

-- abierto: cualquier cliente puede insertar su propia fila para apuntarse, sin aprobación
create table challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges(id) on delete cascade,
  client_id uuid references profiles(id) on delete cascade,
  progress numeric default 0,
  completed boolean default false,
  completed_at timestamptz,
  joined_at timestamptz default now(),
  unique (challenge_id, client_id)
);

create table community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id), -- siempre Jaime, salvo 'achievement' generado por el sistema
  type post_type not null,
  title text,
  content text,
  image_url text,
  link_url text,
  created_at timestamptz default now()
);

-- clientes solo insertan aquí: comentarios y likes, nunca posts
create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references community_posts(id) on delete cascade,
  author_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

create table post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references community_posts(id) on delete cascade,
  user_id uuid references profiles(id),
  unique (post_id, user_id)
);

-- =========================================================================
-- ÍNDICES
-- =========================================================================
create index workouts_client_date_idx on workouts (client_id, date);
create index meals_client_date_idx on meals (client_id, date);
create index weight_logs_client_idx on weight_logs (client_id, logged_at desc);
create index mood_logs_client_idx on mood_logs (client_id, week_start desc);
create index qna_messages_client_idx on qna_messages (client_id, created_at);
create index diet_comments_client_week_idx on diet_comments (client_id, week_start);
create index meal_day_completions_client_idx on meal_day_completions (client_id, date desc);
create index routine_templates_trainer_idx on routine_templates (trainer_id, created_at desc);
create index routine_template_exercises_template_idx on routine_template_exercises (template_id);
create index challenge_participants_challenge_idx on challenge_participants (challenge_id);
create index post_comments_post_idx on post_comments (post_id, created_at);
create index post_likes_post_idx on post_likes (post_id);

-- =========================================================================
-- FUNCIONES AUXILIARES
-- =========================================================================

-- Devuelve true si el usuario indicado es Jaime (entrenador). SECURITY DEFINER
-- para que se pueda usar dentro de otras políticas RLS sin depender de que la
-- propia política de `profiles` conceda acceso de lectura.
create or replace function is_trainer(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = uid and role = 'trainer'
  );
$$;

-- Crea automáticamente la fila de `profiles` cuando se registra un usuario en
-- auth.users. El rol/plan/nombre se leen de auth.users.raw_user_meta_data,
-- que el formulario de registro rellena vía supabase.auth.signUp({ options: { data } }).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, plan, phone)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    coalesce(new.raw_user_meta_data->>'full_name', 'Nuevo usuario'),
    nullif(new.raw_user_meta_data->>'plan', '')::plan_type,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Impide que un cliente se autoasigne el rol de entrenador o cambie su plan
-- directamente; solo Jaime puede modificar esos dos campos.
create or replace function prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() es null cuando se ejecuta fuera de una petición autenticada de
  -- PostgREST (SQL Editor, migraciones, tareas de servidor): ahí confiamos en
  -- quien tiene acceso directo a la base de datos. La restricción solo se
  -- aplica cuando hay un usuario cliente autenticado detrás de la petición.
  if auth.uid() is not null and not is_trainer(auth.uid()) then
    new.role := old.role;
    new.plan := old.plan;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_escalation
  before update on profiles
  for each row execute function prevent_profile_privilege_escalation();

-- Un cliente puede tocar `client_rating` y marcar `status` como hecho/no
-- hecho en sus propios entrenos; el resto de campos (título, comentario del
-- entrenador, día...) son de solo lectura para él y solo Jaime los edita.
create or replace function restrict_workout_client_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_trainer(auth.uid()) then
    new.title := old.title;
    new.trainer_comment := old.trainer_comment;
    new.date := old.date;
    new.day_label := old.day_label;
    new.created_by := old.created_by;
    new.client_id := old.client_id;
  end if;
  return new;
end;
$$;

create trigger workouts_restrict_client_updates
  before update on workouts
  for each row execute function restrict_workout_client_updates();

-- Un cliente solo puede rellenar lo que hizo de verdad (peso y series/reps
-- reales) en los ejercicios de sus propios entrenos; el resto (nombre,
-- recomendación de Jaime...) es de solo lectura para él.
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
    new.sort_order := old.sort_order;
  end if;
  return new;
end;
$$;

create trigger workout_exercises_restrict_client_updates
  before update on workout_exercises
  for each row execute function restrict_exercise_client_updates();

-- Un cliente puede reportar su propio progreso en un reto, pero solo Jaime
-- (o la lógica de servidor) puede marcarlo como completado.
create or replace function restrict_challenge_participant_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_trainer(auth.uid()) then
    new.completed := old.completed;
    new.completed_at := old.completed_at;
    new.challenge_id := old.challenge_id;
    new.client_id := old.client_id;
  end if;
  return new;
end;
$$;

create trigger challenge_participants_restrict_updates
  before update on challenge_participants
  for each row execute function restrict_challenge_participant_updates();

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================

alter table profiles enable row level security;
alter table workouts enable row level security;
alter table workout_exercises enable row level security;
alter table weight_logs enable row level security;
alter table mood_logs enable row level security;
alter table trainer_private_notes enable row level security;
alter table qna_messages enable row level security;
alter table meals enable row level security;
alter table meal_ingredients enable row level security;
alter table diet_comments enable row level security;
alter table meal_day_completions enable row level security;
alter table routine_templates enable row level security;
alter table routine_template_exercises enable row level security;
alter table challenges enable row level security;
alter table challenge_participants enable row level security;
alter table community_posts enable row level security;
alter table post_comments enable row level security;
alter table post_likes enable row level security;

-- ---- profiles ----
-- Cualquier usuario autenticado puede leer perfiles (nombre/avatar se
-- muestran en comunidad, rankings, comentarios y en la lista de clientes de Jaime).
create policy "profiles_select_authenticated" on profiles
  for select to authenticated
  using (true);

create policy "profiles_insert_self" on profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy "profiles_update_self_or_trainer" on profiles
  for update to authenticated
  using (id = auth.uid() or is_trainer(auth.uid()));

-- ---- workouts ----
create policy "workouts_select" on workouts
  for select to authenticated
  using (client_id = auth.uid() or is_trainer(auth.uid()));

create policy "workouts_insert_trainer" on workouts
  for insert to authenticated
  with check (is_trainer(auth.uid()));

create policy "workouts_update" on workouts
  for update to authenticated
  using (client_id = auth.uid() or is_trainer(auth.uid()));

create policy "workouts_delete_trainer" on workouts
  for delete to authenticated
  using (is_trainer(auth.uid()));

-- ---- workout_exercises ----
create policy "workout_exercises_select" on workout_exercises
  for select to authenticated
  using (
    exists (
      select 1 from workouts w
      where w.id = workout_exercises.workout_id
        and (w.client_id = auth.uid() or is_trainer(auth.uid()))
    )
  );

create policy "workout_exercises_write_trainer" on workout_exercises
  for all to authenticated
  using (is_trainer(auth.uid()))
  with check (is_trainer(auth.uid()));

-- El cliente puede actualizar sus propios ejercicios (el trigger de arriba
-- limita esa actualización a los campos "actual_*"); no puede insertar ni
-- borrar ejercicios, solo Jaime.
create policy "workout_exercises_client_update" on workout_exercises
  for update to authenticated
  using (
    exists (
      select 1 from workouts w
      where w.id = workout_exercises.workout_id and w.client_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workouts w
      where w.id = workout_exercises.workout_id and w.client_id = auth.uid()
    )
  );

-- ---- weight_logs ----
create policy "weight_logs_select" on weight_logs
  for select to authenticated
  using (client_id = auth.uid() or is_trainer(auth.uid()));

create policy "weight_logs_write_own" on weight_logs
  for all to authenticated
  using (client_id = auth.uid() or is_trainer(auth.uid()))
  with check (client_id = auth.uid() or is_trainer(auth.uid()));

-- ---- mood_logs ----
create policy "mood_logs_select" on mood_logs
  for select to authenticated
  using (client_id = auth.uid() or is_trainer(auth.uid()));

create policy "mood_logs_write_own" on mood_logs
  for all to authenticated
  using (client_id = auth.uid() or is_trainer(auth.uid()))
  with check (client_id = auth.uid() or is_trainer(auth.uid()));

-- ---- trainer_private_notes ----
-- Nunca visibles para el cliente, bajo ninguna circunstancia.
create policy "trainer_private_notes_trainer_only" on trainer_private_notes
  for all to authenticated
  using (is_trainer(auth.uid()))
  with check (is_trainer(auth.uid()));

-- ---- qna_messages ----
create policy "qna_messages_select" on qna_messages
  for select to authenticated
  using (client_id = auth.uid() or is_trainer(auth.uid()));

create policy "qna_messages_insert" on qna_messages
  for insert to authenticated
  with check (
    (client_id = auth.uid() and sender = 'client' and not is_trainer(auth.uid()))
    or
    (is_trainer(auth.uid()) and sender = 'trainer')
  );

-- ---- meals ----
create policy "meals_select" on meals
  for select to authenticated
  using (client_id = auth.uid() or is_trainer(auth.uid()));

create policy "meals_write_trainer" on meals
  for all to authenticated
  using (is_trainer(auth.uid()))
  with check (is_trainer(auth.uid()));

-- ---- meal_ingredients ----
create policy "meal_ingredients_select" on meal_ingredients
  for select to authenticated
  using (
    exists (
      select 1 from meals m
      where m.id = meal_ingredients.meal_id
        and (m.client_id = auth.uid() or is_trainer(auth.uid()))
    )
  );

create policy "meal_ingredients_write_trainer" on meal_ingredients
  for all to authenticated
  using (is_trainer(auth.uid()))
  with check (is_trainer(auth.uid()));

-- ---- diet_comments ----
create policy "diet_comments_select" on diet_comments
  for select to authenticated
  using (client_id = auth.uid() or is_trainer(auth.uid()));

create policy "diet_comments_insert_client" on diet_comments
  for insert to authenticated
  with check (client_id = auth.uid() and not is_trainer(auth.uid()));

-- Solo Jaime edita (para responder en trainer_reply); el cliente no puede
-- reescribir su comentario una vez enviado.
create policy "diet_comments_update_trainer" on diet_comments
  for update to authenticated
  using (is_trainer(auth.uid()));

-- ---- meal_day_completions ----
create policy "meal_day_completions_select" on meal_day_completions
  for select to authenticated
  using (client_id = auth.uid() or is_trainer(auth.uid()));

create policy "meal_day_completions_insert_own" on meal_day_completions
  for insert to authenticated
  with check (client_id = auth.uid());

create policy "meal_day_completions_delete_own" on meal_day_completions
  for delete to authenticated
  using (client_id = auth.uid());

-- ---- routine_templates / routine_template_exercises ----
-- Nunca visibles ni accesibles para clientes: son herramientas internas de
-- Jaime para no reescribir la misma rutina cliente a cliente.
create policy "routine_templates_trainer_all" on routine_templates
  for all to authenticated
  using (is_trainer(auth.uid()) and trainer_id = auth.uid())
  with check (is_trainer(auth.uid()) and trainer_id = auth.uid());

create policy "routine_template_exercises_trainer_all" on routine_template_exercises
  for all to authenticated
  using (
    exists (
      select 1 from routine_templates t
      where t.id = routine_template_exercises.template_id and t.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from routine_templates t
      where t.id = routine_template_exercises.template_id and t.trainer_id = auth.uid()
    )
  );

-- ---- challenges ----
create policy "challenges_select_authenticated" on challenges
  for select to authenticated
  using (true);

create policy "challenges_write_trainer" on challenges
  for all to authenticated
  using (is_trainer(auth.uid()))
  with check (is_trainer(auth.uid()));

-- ---- challenge_participants ----
create policy "challenge_participants_select_authenticated" on challenge_participants
  for select to authenticated
  using (true);

-- Un cliente se apunta a sí mismo a un reto abierto, sin aprobación previa.
create policy "challenge_participants_insert" on challenge_participants
  for insert to authenticated
  with check (client_id = auth.uid() or is_trainer(auth.uid()));

create policy "challenge_participants_update" on challenge_participants
  for update to authenticated
  using (client_id = auth.uid() or is_trainer(auth.uid()));

create policy "challenge_participants_delete" on challenge_participants
  for delete to authenticated
  using (client_id = auth.uid() or is_trainer(auth.uid()));

-- ---- community_posts ----
create policy "community_posts_select_authenticated" on community_posts
  for select to authenticated
  using (true);

-- Solo Jaime publica contenido (recetas/blog). Los logros del sistema se
-- insertan con la service role key (bypassa RLS), nunca desde el cliente.
create policy "community_posts_write_trainer" on community_posts
  for all to authenticated
  using (is_trainer(auth.uid()))
  with check (is_trainer(auth.uid()));

-- ---- post_comments ----
create policy "post_comments_select_authenticated" on post_comments
  for select to authenticated
  using (true);

create policy "post_comments_insert" on post_comments
  for insert to authenticated
  with check (author_id = auth.uid());

create policy "post_comments_delete_own_or_trainer" on post_comments
  for delete to authenticated
  using (author_id = auth.uid() or is_trainer(auth.uid()));

-- ---- post_likes ----
create policy "post_likes_select_authenticated" on post_likes
  for select to authenticated
  using (true);

create policy "post_likes_insert" on post_likes
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "post_likes_delete_own" on post_likes
  for delete to authenticated
  using (user_id = auth.uid());

-- =========================================================================
-- REALTIME
-- =========================================================================
do $$
begin
  alter publication supabase_realtime add table qna_messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table post_comments;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table post_likes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table challenge_participants;
exception when duplicate_object then null;
end $$;
