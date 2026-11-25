-- Run in Supabase → SQL Editor, AFTER `npx drizzle-kit push` (re-run it when new tables are added; it is safe to repeat).
-- Supabase exposes every table in "public" through its public REST API.
-- Enabling RLS with NO policies blocks that API completely. The app is not affected (it uses the database role).
alter table public.guests enable row level security;
alter table public.tables enable row level security;
alter table public.event_settings enable row level security;
alter table public.checkins enable row level security;