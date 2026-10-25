-- =====================================================================
-- KIBOO : base de données des comptes (Supabase).
-- À coller une seule fois dans Supabase : SQL Editor > New query > Run.
-- On peut le relancer sans risque : il ne recrée que ce qui manque.
--
-- Trois tables, chacune protégée par la sécurité au niveau des lignes
-- (Row Level Security) : une personne connectée ne peut lire et modifier
-- QUE ses propres lignes. Les comptes sont créés sur invitation
-- (inscriptions fermées dans Authentication).
--   profiles : le pseudo du joueur ;
--   saves    : la sauvegarde du jeu (progression, collection, historique
--              d'évaluation, réglages), un seul enregistrement par joueur ;
--   events   : le journal (donnes jouées, réponses aux questions et aux
--              exercices), pour la personnalisation.
-- La fonction delete_my_account() permet au joueur de supprimer son
-- compte et toutes ses données.
-- =====================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text check (char_length(pseudo) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (char_length(kind) <= 40),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_user_time on public.events (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.saves enable row level security;
alter table public.events enable row level security;

-- Chacun ne voit et ne modifie que ses propres lignes.
drop policy if exists "profil : le sien" on public.profiles;
create policy "profil : le sien" on public.profiles
  for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "sauvegarde : la sienne" on public.saves;
create policy "sauvegarde : la sienne" on public.saves
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "journal : lire le sien" on public.events;
create policy "journal : lire le sien" on public.events
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "journal : ajouter au sien" on public.events;
create policy "journal : ajouter au sien" on public.events
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Supprimer son compte : efface l'utilisateur, et par cascade son profil,
-- sa sauvegarde et son journal.
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
