# Train with Jaime

Plataforma de clientes para Train with Jaime: entrenamiento y nutrición personalizados
para estudiantes universitarios en Pamplona. Next.js 14 (App Router) + TypeScript +
Tailwind CSS + Supabase (Postgres, Auth, Storage, Realtime).

## 1. Qué necesitas antes de arrancar

1. Una cuenta gratuita en [supabase.com](https://supabase.com) y un proyecto nuevo.
2. Node.js 18+ y npm.
3. (Para desplegar) una cuenta gratuita en [vercel.com](https://vercel.com).

## 2. Configurar Supabase

1. Crea un proyecto nuevo en Supabase (plan Free).
2. Ve a **SQL Editor** y ejecuta, en este orden, el contenido de:
   - `supabase/migrations/0001_init.sql` (tablas, RLS, triggers)
   - `supabase/migrations/0002_storage.sql` (buckets de Storage)
   - `supabase/migrations/0003_cheers.sql` (reacciones "Animar" en Comunidad)
3. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public` key
4. Copia `.env.local.example` a `.env.local` y rellena esos dos valores:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. Por defecto Supabase Auth pide confirmación por email. Para probar rápido en local sin
   configurar SMTP, puedes desactivarla temporalmente en **Authentication → Providers →
   Email → Confirm email** (desactivar), o revisar el correo de confirmación que Supabase
   envía automáticamente con su servidor de pruebas.

### Cómo dar de alta a Jaime (el entrenador)

El formulario público de `/registro` solo crea clientes (`role = 'client'`), a propósito
(nadie debería poder auto-asignarse como entrenador). Para convertir tu propia cuenta —
o la de Jaime— en entrenador:

1. Regístrate normalmente desde `/registro` con el email de Jaime.
2. En Supabase, ve a **SQL Editor** y ejecuta:
   ```sql
   update profiles set role = 'trainer' where id =
     (select id from auth.users where email = 'jaime@ejemplo.com');
   ```
3. Vuelve a entrar en la app: ahora se redirige a `/panel` en vez de `/semana`.

## 3. Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 4. Qué probar en cada fase

| Fase | Qué probar |
|---|---|
| 1. Auth y perfiles | Crear un cliente desde `/registro`, comprobar que aparece en `profiles` con `role='client'`. Convertir un segundo usuario en `trainer` (ver arriba) y comprobar que entra en `/panel`. Intentar acceder a `/panel` con el usuario cliente: debe redirigir a `/semana`. |
| 2. Mi semana | Como Jaime, entra en `/panel`, pestaña **Entrenos**, crea el entreno de "Hoy" para un cliente. Como ese cliente, entra en `/semana` y comprueba que aparece, puntúalo con el slider. Registra un peso y la sensación semanal. |
| 3. Menú semanal | Como Jaime, pestaña **Menú**, crea las 3 comidas de hoy con macros e ingredientes. Como cliente, comprueba que aparecen en "Tu menú de hoy" y en `/semana/menu` para toda la semana. |
| 4. Panel de Jaime | Notas privadas: escribe una nota en un cliente y confirma que **no** aparece en ningún sitio del lado del cliente. Responde a una duda del chat y a un comentario de dieta. |
| 5. Comunidad | Como Jaime, crea un reto (`/panel/retos/nueva`) con imagen de medalla. Como cliente, apúntate desde `/comunidad`. Publica una receta (solo visible el composer para Jaime); comenta y dale like como cliente. |
| 6. Responsive | Abre `/semana` en un móvil (o DevTools en modo responsive): debe verse la navegación inferior fija (Semana / Progreso / Comunidad / Perfil). |
| 7. RLS | Con las DevTools abiertas y sesión de cliente, intenta hacer un `fetch` directo a la REST API de Supabase pidiendo `trainer_private_notes` o los datos de otro cliente: debe devolver vacío/error por RLS, no los datos. |

## 5. Seguridad (Row Level Security)

Todas las tablas tienen RLS activado desde la migración inicial. Puntos clave, ya
aplicados en `supabase/migrations/0001_init.sql`:

- Un cliente solo lee/escribe sus propias filas (`client_id = auth.uid()`).
- `trainer_private_notes` es ilegible para cualquier rol que no sea `trainer`, a nivel de
  base de datos (no solo oculto en la interfaz).
- Un cliente puede actualizar `client_rating` en sus entrenos, pero un trigger
  (`restrict_workout_client_updates`) revierte cualquier intento de cambiar `title`,
  `trainer_comment` o `status` si quien hace la petición no es Jaime.
- Un trigger equivalente (`prevent_profile_privilege_escalation`) impide que un cliente se
  autoasigne `role = 'trainer'` o cambie su `plan` manipulando la petición.
- Solo Jaime puede crear/editar `challenges` y `community_posts`; los clientes solo
  pueden insertar en `challenge_participants` (apuntarse), `post_comments` y
  `post_likes`.

No se usa la `service_role` key en ningún punto de la app: todo pasa por el cliente
autenticado normal, así que RLS se aplica siempre, también si alguien manipula las
peticiones desde el navegador.

## 6. Desplegar en Vercel

1. Sube este repositorio a GitHub (privado).
2. En [vercel.com](https://vercel.com), **Add New → Project** e importa el repositorio.
3. En **Environment Variables**, añade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Cada push a `main` volverá a desplegar automáticamente.
5. (Opcional) Añade un dominio propio en **Project Settings → Domains**.

## 7. Fuera de alcance en esta primera versión

Explícitamente no incluido, a la espera de que se decida si hace falta:

- Pagos online (las suscripciones se siguen gestionando fuera de la app).
- Notificaciones push/email al guardar cambios en el panel de Jaime (el botón de guardar
  persiste los cambios; el "notificar" queda para una fase 2).
- Varios entrenadores a la vez (el esquema ya lo soporta con `role = 'trainer'`, pero no
  hay gestión de equipos ni permisos entre entrenadores).

## 8. Nota sobre dependencias

`npm audit` señala vulnerabilidades conocidas en versiones recientes de Next.js que solo
tienen parche en la rama mayor 16.x. Este proyecto se mantiene deliberadamente en Next 14
(pedido explícitamente en el stack) en su última versión de parche (`14.2.35`). El riesgo
real es bajo para este despliegue (Vercel, sin servidor propio, sin i18n, sin rutas de
Image Optimization con `remotePatterns` abiertos a terceros), pero conviene revisar
`npm audit` de vez en cuando y valorar una migración a Next 15/16 más adelante.
