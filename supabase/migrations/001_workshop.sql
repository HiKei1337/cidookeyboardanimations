-- CIDOO Workshop: public submissions with owner moderation.
-- The browser only receives the publishable key; Row Level Security protects rows.

create table if not exists public.workshop_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  description text not null check (char_length(btrim(description)) between 8 and 500),
  author text not null check (char_length(btrim(author)) between 2 and 80),
  tags text[] not null default '{}',
  animation jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text not null default '' check (char_length(review_note) <= 500),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint workshop_animation_shape check (
    jsonb_typeof(animation) = 'object'
    and jsonb_typeof(animation->'frames') = 'array'
    and jsonb_array_length(animation->'frames') between 1 and 120
    and pg_column_size(animation) <= 524288
  ),
  constraint workshop_tags_shape check (cardinality(tags) <= 4)
);

create table if not exists public.workshop_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create schema if not exists private;

create or replace function private.is_workshop_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workshop_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_workshop_admin() from public;
grant execute on function private.is_workshop_admin() to anon, authenticated;

alter table public.workshop_submissions enable row level security;
alter table public.workshop_admins enable row level security;

drop policy if exists "Approved animations are public" on public.workshop_submissions;
create policy "Approved animations are public"
  on public.workshop_submissions
  for select
  to anon, authenticated
  using (status = 'approved' or (select private.is_workshop_admin()));

drop policy if exists "Anyone can submit an animation" on public.workshop_submissions;
create policy "Anyone can submit an animation"
  on public.workshop_submissions
  for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists "Admins can moderate animations" on public.workshop_submissions;
create policy "Admins can moderate animations"
  on public.workshop_submissions
  for update
  to authenticated
  using ((select private.is_workshop_admin()))
  with check ((select private.is_workshop_admin()));

drop policy if exists "Admins can read admin list" on public.workshop_admins;
create policy "Admins can read admin list"
  on public.workshop_admins
  for select
  to authenticated
  using ((select private.is_workshop_admin()));

grant select on public.workshop_submissions to anon, authenticated;
grant insert on public.workshop_submissions to anon, authenticated;
grant update on public.workshop_submissions to authenticated;
grant select on public.workshop_admins to authenticated;

create index if not exists workshop_submissions_status_created_idx
  on public.workshop_submissions (status, created_at desc);

comment on table public.workshop_submissions is 'CIDOO RGB Studio animations submitted through the Workshop website.';
comment on table public.workshop_admins is 'Supabase Auth users allowed to moderate Workshop submissions.';
