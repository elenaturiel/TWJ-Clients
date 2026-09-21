-- "Animar": reacción dirigida de un cliente a otro en el ranking de racha.
-- Se modela como tabla propia (no como post_comments) porque solo Jaime puede
-- crear community_posts; esto deja a los clientes animarse entre ellos sin
-- tocar esa regla.

create table cheers (
  id uuid primary key default gen_random_uuid(),
  from_client_id uuid references profiles(id) on delete cascade,
  to_client_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create index cheers_to_client_idx on cheers (to_client_id, created_at desc);

alter table cheers enable row level security;

create policy "cheers_select_authenticated" on cheers
  for select to authenticated
  using (true);

create policy "cheers_insert_own" on cheers
  for insert to authenticated
  with check (from_client_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table cheers;
exception when duplicate_object then null;
end $$;
