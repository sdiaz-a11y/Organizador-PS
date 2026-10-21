# Organizador · Programación de Soporte Técnico

Tablero compartido (estilo kanban) para meter ideas, anotar avances y ver quién hace qué. Varias personas pueden trabajar a la vez: los cambios aparecen en tiempo real.

Columnas: Ideas → En análisis → En desarrollo → En pruebas → Hecho. Cada tarjeta tiene responsable, prioridad, tipo, descripción y un historial de notas (los cambios de estado y de responsable se registran solos).

## Puesta en marcha

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan gratis).
2. En **SQL Editor**, pega y ejecuta [supabase/schema.sql](supabase/schema.sql).
3. En **Project Settings → API** copia la URL y la `anon public` key.
4. Copia `.env.local.example` a `.env.local` y pega esos valores.
5. `npm install` y `npm run dev` → http://localhost:3000
6. Cada persona crea su cuenta con su nombre (aparece como autor de las notas).

## Desplegar para el equipo

Sube la carpeta a un repositorio de GitHub, impórtalo en [vercel.com](https://vercel.com) y agrega las dos variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Control de acceso

Cualquiera que pueda registrarse ve todo el tablero. Cuando ya estén todos dados de alta, desactiva el registro en Supabase: **Authentication → Providers → Email → desactivar "Allow new users to sign up"** (o invita por correo desde Authentication → Users). Si no quieres confirmar correos al inicio, desactiva "Confirm email" en el mismo lugar.
