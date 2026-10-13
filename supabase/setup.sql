-- ════════════════════════════════════════════════════════════════════════════
--  Invitación de boda · Configuración de seguridad de Supabase
--  (La base solo guarda invitaciones e invitados; las fotos viven en el proyecto.)
--  Ejecutar en: Supabase → SQL Editor → New query → Run
--  IMPORTANTE: ejecutar DESPUÉS de `npx prisma migrate deploy` (las tablas deben existir).
--  Es idempotente: se puede ejecutar varias veces sin problema.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Row Level Security en TODAS las tablas, SIN políticas públicas ─────────
-- Con RLS activo y sin políticas, la anon key y los usuarios "authenticated"
-- no pueden leer ni escribir nada. El backend se conecta con el rol `postgres`
-- (dueño de las tablas) vía Prisma, que no está sujeto a RLS.

alter table if exists public."Invitation"         enable row level security;
alter table if exists public."Guest"              enable row level security;
alter table if exists public."InvitationDevice"   enable row level security;
alter table if exists public."AccessLog"          enable row level security;
alter table if exists public."EventSettings"      enable row level security;
alter table if exists public."AdminUser"          enable row level security;
alter table if exists public."_prisma_migrations" enable row level security;

-- Red de seguridad: activar RLS en cualquier otra tabla del esquema public
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end $$;

-- Quitar cualquier privilegio directo a los roles de la API pública (PostgREST)
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;


-- ─── 2. Índices ─────────────────────────────────────────────────────────────────
-- La migración de Prisma ya los crea con estos mismos nombres; `if not exists`
-- evita duplicados y los garantiza si la base se creó de otra forma.

create unique index if not exists "Invitation_token_key"
  on public."Invitation" ("token");

create unique index if not exists "InvitationDevice_invitationId_deviceId_key"
  on public."InvitationDevice" ("invitationId", "deviceId");

create index if not exists "AccessLog_invitationId_createdAt_idx"
  on public."AccessLog" ("invitationId", "createdAt");


-- ─── 3. Verificación ────────────────────────────────────────────────────────────
-- Debe listar todas las tablas con rowsecurity = true
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
