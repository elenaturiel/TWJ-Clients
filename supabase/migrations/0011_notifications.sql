-- Sistema de notificaciones (email + push) para clientes y Jaime.

-- Email copiado de auth.users (no se introduce a mano) + preferencias.
alter table profiles add column if not exists email text;
alter table profiles add column if not exists email_notifications_enabled boolean not null default true;
alter table profiles add column if not exists push_notifications_enabled boolean not null default true;

-- Backfill: rellena el email de los perfiles que ya existían antes de este cambio.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- A partir de ahora, todo usuario nuevo se crea ya con su email copiado.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, plan, phone, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    coalesce(new.raw_user_meta_data->>'full_name', 'Nuevo usuario'),
    nullif(new.raw_user_meta_data->>'plan', '')::plan_type,
    new.raw_user_meta_data->>'phone',
    new.email
  );
  return new;
end;
$$;

-- Subscripciones a notificaciones push, una fila por dispositivo/navegador.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

do $$ begin
  create policy "push_subscriptions_select" on push_subscriptions
    for select to authenticated
    using (user_id = auth.uid() or is_trainer(auth.uid()) or is_trainer(user_id));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "push_subscriptions_insert_own" on push_subscriptions
    for insert to authenticated
    with check (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "push_subscriptions_update_own" on push_subscriptions
    for update to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "push_subscriptions_delete_own" on push_subscriptions
    for delete to authenticated
    using (user_id = auth.uid());
exception when duplicate_object then null;
end $$;
