-- Service Auto La Ghita: extensii sigure pentru programari, status reparatii,
-- recenzii moderate si mementouri ITP/revizie.
-- Ruleaza o singura data in Supabase SQL Editor.

alter table public.bookings
  add column if not exists preferred_time time,
  add column if not exists tracking_code text unique;

-- Cod unic automat pentru fiecare programare noua; completeaza si programarile existente.
alter table public.bookings
  alter column tracking_code set default (
    'LGH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  );
update public.bookings
set tracking_code = 'LGH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where tracking_code is null;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  rating smallint not null check (rating between 1 and 5),
  review_text text not null check (char_length(review_text) between 10 and 1200),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;
drop policy if exists "Public can submit reviews" on public.reviews;
create policy "Public can submit reviews"
  on public.reviews for insert to anon, authenticated
  with check (approved = false);
drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
  on public.reviews for select to anon, authenticated
  using (approved = true);

grant insert on public.reviews to anon, authenticated;
grant select on public.reviews to anon, authenticated;

create table if not exists public.maintenance_reminders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  phone text not null check (char_length(phone) between 6 and 30),
  email text,
  vehicle text not null check (char_length(vehicle) between 2 and 100),
  reminder_type text not null check (reminder_type in ('ITP','Revizie','Ambele')),
  due_date date not null,
  consent boolean not null default false check (consent = true),
  created_at timestamptz not null default now()
);
alter table public.maintenance_reminders enable row level security;
drop policy if exists "Public can request maintenance reminders" on public.maintenance_reminders;
create policy "Public can request maintenance reminders"
  on public.maintenance_reminders for insert to anon, authenticated
  with check (consent = true and due_date >= current_date);
grant insert on public.maintenance_reminders to anon, authenticated;

create or replace function public.lookup_repair_status(p_code text)
returns table(status text, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select b.status, b.updated_at
  from public.bookings b
  where b.tracking_code = upper(trim(p_code))
    and b.tracking_code is not null
  limit 1;
$$;
revoke all on function public.lookup_repair_status(text) from public;
grant execute on function public.lookup_repair_status(text) to anon, authenticated;

-- Ora programata, daca formularul trimite un camp separat in viitor.
