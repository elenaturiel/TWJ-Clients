-- Añade seguimiento de peso/series-reps reales vs. recomendados, deja que el
-- cliente marque sus propios entrenos como hechos, y añade el "menú
-- seguido" del día (para la racha y el tick verde del menú).

-- =========================================================================
-- COLUMNAS NUEVAS
-- =========================================================================
alter table workout_exercises add column if not exists recommended_weight_kg numeric(6,2);
alter table workout_exercises add column if not exists actual_sets_reps text;
alter table workout_exercises add column if not exists actual_weight_kg numeric(6,2);

create table if not exists meal_day_completions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  date date not null,
  completed_at timestamptz default now(),
  unique (client_id, date)
);

create index if not exists meal_day_completions_client_idx on meal_day_completions (client_id, date desc);

alter table meal_day_completions enable row level security;

-- =========================================================================
-- El cliente ahora puede marcar su entreno como hecho (antes solo Jaime
-- podía tocar `status`); el resto de campos siguen bloqueados para él.
-- =========================================================================
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

-- =========================================================================
-- El cliente solo puede rellenar lo que hizo de verdad en sus ejercicios
-- (actual_sets_reps, actual_weight_kg); el resto es de solo lectura para él.
-- =========================================================================
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

drop trigger if exists workout_exercises_restrict_client_updates on workout_exercises;
create trigger workout_exercises_restrict_client_updates
  before update on workout_exercises
  for each row execute function restrict_exercise_client_updates();

-- =========================================================================
-- RLS
-- =========================================================================
do $$ begin
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
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "meal_day_completions_select" on meal_day_completions
    for select to authenticated
    using (client_id = auth.uid() or is_trainer(auth.uid()));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "meal_day_completions_insert_own" on meal_day_completions
    for insert to authenticated
    with check (client_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "meal_day_completions_delete_own" on meal_day_completions
    for delete to authenticated
    using (client_id = auth.uid());
exception when duplicate_object then null;
end $$;
