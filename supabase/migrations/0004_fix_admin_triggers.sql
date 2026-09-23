-- Corrige un bug: los triggers que impiden que un cliente se autoasigne
-- `trainer` (o edite campos que no le corresponden) también bloqueaban los
-- cambios hechos a mano desde el SQL Editor, porque auth.uid() es null fuera
-- de una petición autenticada de PostgREST. Ahora la restricción solo se
-- aplica cuando SÍ hay un usuario cliente autenticado detrás de la petición.

create or replace function prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_trainer(auth.uid()) then
    new.role := old.role;
    new.plan := old.plan;
  end if;
  return new;
end;
$$;

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
    new.status := old.status;
    new.date := old.date;
    new.day_label := old.day_label;
    new.created_by := old.created_by;
    new.client_id := old.client_id;
  end if;
  return new;
end;
$$;

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
