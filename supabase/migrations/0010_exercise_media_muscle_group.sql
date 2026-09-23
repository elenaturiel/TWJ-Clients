-- Grupo muscular en la biblioteca de vídeos/fotos, para poder ordenarlos y
-- agruparlos (pecho, espalda, piernas...).

do $$ begin
  create type muscle_group as enum (
    'pecho', 'espalda', 'piernas', 'hombros', 'brazos', 'core', 'gluteos', 'cardio', 'movilidad', 'otro'
  );
exception when duplicate_object then null;
end $$;

alter table exercise_media add column if not exists muscle_group muscle_group not null default 'otro';
