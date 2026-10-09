create table private.workshop_owner_emails(email text primary key);
alter table private.workshop_owner_emails enable row level security;
-- Add the owner email through the Supabase SQL editor; never commit personal contact details.
create function private.enroll_workshop_owner() returns trigger language plpgsql security definer set search_path='' as $$
begin
if new.email_confirmed_at is not null and exists(select 1 from private.workshop_owner_emails where email=lower(new.email)) then
insert into public.workshop_admins(user_id) values(new.id) on conflict do nothing;
end if; return new;
end; $$;
revoke all on function private.enroll_workshop_owner() from public;
create trigger enroll_workshop_owner after insert or update of email_confirmed_at on auth.users for each row execute function private.enroll_workshop_owner();
revoke insert on public.workshop_submissions from anon,authenticated;
grant insert(name,description,author,tags,animation) on public.workshop_submissions to anon,authenticated;
create function private.validate_workshop_animation() returns trigger language plpgsql set search_path='' as $$
declare f jsonb; c jsonb; k jsonb;
begin
if new.animation->>'format' is distinct from 'cidoo-rgb-studio' or new.animation->>'version' is distinct from '1' or new.animation->>'sourceLayer' is distinct from '1' or new.animation->>'targetLayer' is distinct from '2' then raise exception 'Invalid project format/layers'; end if;
if new.animation->>'effect' not in ('timeline','heartbeat','breathe','shimmer','heartbeat-shimmer') then raise exception 'Invalid effect'; end if;
if jsonb_typeof(new.animation->'keys') is distinct from 'array' or jsonb_array_length(new.animation->'keys') not between 1 and 132 then raise exception 'Invalid keys'; end if;
for k in select value from jsonb_array_elements(new.animation->'keys') loop
if k::text !~ '^[0-9]+$' or (k::text)::int not between 0 and 131 then raise exception 'Invalid key'; end if;
end loop;
if jsonb_typeof(new.animation->'sourceColors') is distinct from 'array' or jsonb_array_length(new.animation->'sourceColors')<>396 then raise exception 'Invalid source colors'; end if;
for c in select value from jsonb_array_elements(new.animation->'sourceColors') loop
if c::text !~ '^[0-9]+$' or (c::text)::int not between 0 and 255 then raise exception 'Invalid RGB'; end if;
end loop;
for f in select value from jsonb_array_elements(new.animation->'frames') loop
if jsonb_typeof(f->'colors') is distinct from 'array' or jsonb_array_length(f->'colors')<>396 or (f->>'durationMs')::int not between 50 and 60000 then raise exception 'Invalid frame'; end if;
for c in select value from jsonb_array_elements(f->'colors') loop
if c::text !~ '^[0-9]+$' or (c::text)::int not between 0 and 255 then raise exception 'Invalid frame RGB'; end if;
end loop; end loop; return new;
end; $$;
revoke all on function private.validate_workshop_animation() from public;
create trigger validate_workshop_animation before insert or update of animation on public.workshop_submissions for each row execute function private.validate_workshop_animation();
