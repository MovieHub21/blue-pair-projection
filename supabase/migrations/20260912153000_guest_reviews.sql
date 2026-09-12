create table if not exists public.guest_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id text not null references public.bookings(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  review text not null check (char_length(trim(review)) between 10 and 2000),
  keywords text[] not null default '{}',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id)
);

create index if not exists guest_reviews_published_idx on public.guest_reviews(published, created_at desc);
create index if not exists guest_reviews_keywords_idx on public.guest_reviews using gin(keywords);

alter table public.guest_reviews enable row level security;

create policy "Guests can read published reviews"
  on public.guest_reviews for select
  using (published = true or auth.uid() = user_id);

create policy "Eligible guests can submit reviews"
  on public.guest_reviews for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.user_id = auth.uid()
        and b.status = 'checked_out'
    )
  );

create policy "Guests can update own review"
  on public.guest_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Staff can manage reviews"
  on public.guest_reviews for all
  using (
    exists (
      select 1 from public.staff s
      where s.user_id = auth.uid() and s.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.staff s
      where s.user_id = auth.uid() and s.status = 'active'
    )
  );

create or replace function public.set_guest_review_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guest_reviews_updated_at on public.guest_reviews;
create trigger guest_reviews_updated_at before update on public.guest_reviews
for each row execute function public.set_guest_review_updated_at();
