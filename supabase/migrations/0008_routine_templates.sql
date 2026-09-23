-- Rutinas estándar: plantillas de ejercicios que Jaime crea una vez y aplica
-- a cualquier cliente en un clic. Aplicar una plantilla copia sus ejercicios
-- al entreno del cliente como filas normales de workout_exercises, así que
-- a partir de ahí cada cliente edita su copia de forma independiente sin
-- tocar la plantilla original.

create table if not exists routine_templates (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references profiles(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);

create table if not exists routine_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references routine_templates(id) on delete cascade,
  name text not null,
  sets_reps text,
  recommended_weight_kg numeric(6,2),
  sort_order bigint default 0
);

create index if not exists routine_templates_trainer_idx on routine_templates (trainer_id, created_at desc);
create index if not exists routine_template_exercises_template_idx on routine_template_exercises (template_id);

alter table routine_templates enable row level security;
alter table routine_template_exercises enable row level security;

do $$ begin
  create policy "routine_templates_trainer_all" on routine_templates
    for all to authenticated
    using (is_trainer(auth.uid()) and trainer_id = auth.uid())
    with check (is_trainer(auth.uid()) and trainer_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
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
exception when duplicate_object then null;
end $$;
