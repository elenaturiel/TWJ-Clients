-- Bug: la app guarda `Date.now()` (milisegundos, ~1.7 billones ahora mismo)
-- en `sort_order`, pero la columna era `int` (máximo ~2.147 millones... de
-- millones, en realidad 2.147 mil millones, insuficiente). Cada inserción de
-- un ejercicio nuevo fallaba con "integer out of range" y la interfaz de
-- Jaime lo mostraba como guardado igualmente (fallo optimista de la UI, ya
-- corregido aparte). Se amplía a bigint para admitir timestamps.
alter table workout_exercises alter column sort_order type bigint;
