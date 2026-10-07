# Rumbo — organiza viajes en grupo

Aplicación web responsive para organizar viajes, registrar gastos compartidos, calcular balances, planificar actividades por día y llevar una lista de equipaje compartida. Está preparada para GitHub + Supabase.

## Funciones incluidas

- Registro e inicio de sesión con Supabase Auth.
- Crear y cambiar entre varios viajes.
- Panel resumen con gasto total, participantes, agenda y checklist.
- Gastos por categoría, pagador y participantes entre los que se divide.
- Balance individual y propuesta automática de transferencias para saldar cuentas.
- Participantes y grupos.
- Itinerario por día con hora, lugar y categoría.
- Lista de maleta interactiva.
- Modo demostración con datos de ejemplo.
- Diseño responsive para móvil y escritorio.
- Esquema SQL con Row Level Security (RLS).

## Requisitos

- Node.js 20 o posterior recomendado.
- Un proyecto de Supabase.
- Una cuenta de GitHub.

## Ejecutar en local

1. Descomprime el proyecto y abre una terminal en esta carpeta.
2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Copia `.env.example` a `.env` y rellena tus credenciales públicas de Supabase:

   ```env
   VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
   ```

4. En Supabase abre **SQL Editor**, crea una consulta, pega el contenido de `supabase/schema.sql` y ejecútala.
5. Inicia la web:

   ```bash
   npm run dev
   ```

6. Abre la URL local que indique Vite, normalmente `http://localhost:5173`.

## Subir a GitHub

1. Crea un repositorio vacío en GitHub.
2. Desde esta carpeta ejecuta:

   ```bash
   git init
   git add .
   git commit -m "Initial Rumbo travel planner"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
   git push -u origin main
   ```

3. No subas el archivo `.env`; ya está excluido por `.gitignore`.

## Publicar en Vercel

1. Importa el repositorio desde Vercel.
2. Añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Environment Variables.
3. Usa el comando de build `npm run build` y directorio de salida `dist`.

## Configuración de Supabase Auth

En Supabase, ve a **Authentication → URL Configuration** y añade los dominios locales y el dominio publicado a Site URL / Redirect URLs según corresponda. Puedes activar o desactivar la confirmación por correo desde los ajustes de Auth.

## Importante sobre las cuentas compartidas

La app distingue entre la cuenta que inicia sesión y las personas que participan en un viaje. En este starter, añadir un participante por nombre **no crea una cuenta ni envía una invitación**; esa persona aparece en el reparto de gastos. Para que cada integrante acceda con su propia cuenta, hace falta añadir un flujo de invitación por correo (idealmente mediante una Supabase Edge Function) y vincular su `auth.users.id` a `trip_members.user_id`.

Los datos compartidos se protegen mediante RLS. Revisa `supabase/schema.sql` y prueba las políticas con cuentas distintas antes de guardar datos reales. La clave `anon`/publishable puede usarse en el navegador con RLS bien configurado; **nunca pongas una `service_role` key en el frontend**.

## Notas técnicas

- React + Vite.
- Supabase JS v2.
- La división de gastos es igualitaria entre los participantes seleccionados para cada gasto.
- La propuesta de saldos reduce el número de transferencias en el caso habitual, pero no sustituye una transacción de pago real.
- La demo guarda cambios solo en el estado del navegador y se reinicia al salir.
